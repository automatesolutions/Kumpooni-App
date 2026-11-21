// Top repair shops near a point, for the /nearby page.
// Deploy: npx supabase functions deploy nearby-shops --project-ref <ref>
//
// Today it returns sample shops only. It never calls Google.
// Live Places calls come later, behind a server-only secret (GOOGLE_PLACES_KEY), never a VITE_ key.
//
// It reads and writes public.nearby_cache with the service role, which Supabase gives every
// function. The browser cannot read or write that table. It never reads anyone's repair files:
// the Proof Score is worked out in the browser from the person's own files.
//
// Privacy: the request holds a location. Do not log request or response bodies.
import {createClient} from 'npm:@supabase/supabase-js@2'
import {
  CACHE_MAX_AGE_DAYS,
  CACHE_TTL_HOURS,
  type NearbyResponse,
  type NearbyShop,
  RADIUS_MAX_KM,
  RADIUS_MIN_KM,
  fetchRadiusKm,
  gridCell,
  inPhilippines,
  isNearbyKind,
  nearbyCacheKey,
  radiusBucket,
} from '../_shared/nearby-key.ts'
import {sampleShops} from './sample.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function reply(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {status, headers: {...CORS, 'Content-Type': 'application/json'}})
}

type CacheRow = {
  source: 'sample' | 'places'
  payload: NearbyShop[] | null
  fetched_at: string
  attributions: string[] | null
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', {headers: CORS})
  if (req.method !== 'POST') return reply(405, {error: 'method_not_allowed'})

  let input: {kind?: unknown; lat?: unknown; lng?: unknown; radius_km?: unknown}
  try {
    input = await req.json()
  } catch {
    return reply(400, {error: 'bad_request'})
  }
  const kind = input.kind
  const lat = Number(input.lat)
  const lng = Number(input.lng)
  const radiusKm = Number(input.radius_km)
  if (!isNearbyKind(kind)) return reply(400, {error: 'bad_kind'})
  if (!Number.isFinite(radiusKm) || radiusKm < RADIUS_MIN_KM || radiusKm > RADIUS_MAX_KM) {
    return reply(400, {error: 'bad_radius'})
  }
  if (!inPhilippines(lat, lng)) return reply(400, {error: 'outside_ph'})

  const cacheKey = nearbyCacheKey(kind, lat, lng, radiusKm)
  const bucketKm = radiusBucket(radiusKm)
  const {latCell, lngCell, center} = gridCell(lat, lng)

  const url = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const db = url && serviceKey ? createClient(url, serviceKey, {auth: {persistSession: false}}) : null

  // 1. A fresh cache row wins.
  if (db) {
    const {data} = await db
      .from('nearby_cache')
      .select('source, payload, fetched_at, attributions')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle<CacheRow>()
    // Only sample rows carry a payload. Live rows will keep ids and coordinates only (Google's terms),
    // so a live hit still has to fetch names and ratings. That comes with live calls.
    if (data?.source === 'sample' && Array.isArray(data.payload)) {
      return reply(200, {
        shops: data.payload,
        source: 'sample',
        cached: true,
        cacheKey,
        bucketKm,
        center,
        fetchedAt: data.fetched_at,
        attributions: data.attributions ?? [],
      } satisfies NearbyResponse)
    }
  }

  // 2. No fresh row: sample shops. Live Places calls replace this step later, after a yes on cost.
  const shops = sampleShops(kind, center, fetchRadiusKm(bucketKm))
  const fetchedAt = new Date()
  const expiresAt = new Date(fetchedAt.getTime() + CACHE_TTL_HOURS * 3600_000)

  if (db) {
    const {error} = await db.from('nearby_cache').upsert({
      cache_key: cacheKey,
      kind,
      lat_cell: latCell,
      lng_cell: lngCell,
      radius_bucket: bucketKm,
      center_lat: center.lat,
      center_lng: center.lng,
      fetch_radius_km: fetchRadiusKm(bucketKm),
      source: 'sample',
      place_ids: shops.map(s => s.id),
      place_points: shops.map(s => ({id: s.id, lat: s.lat, lng: s.lng})),
      payload: shops,
      attributions: [],
      fetched_at: fetchedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    // A cache write that fails should not cost the person their results.
    if (error) console.warn('nearby_cache write failed', error.code)

    // Google allows coordinates to be kept for up to 30 days. Delete anything older.
    const cutoff = new Date(fetchedAt.getTime() - CACHE_MAX_AGE_DAYS * 86400_000).toISOString()
    await db.from('nearby_cache').delete().lt('fetched_at', cutoff)
  }

  return reply(200, {
    shops,
    source: 'sample',
    cached: false,
    cacheKey,
    bucketKm,
    center,
    fetchedAt: fetchedAt.toISOString(),
    attributions: [],
  } satisfies NearbyResponse)
})
