// Top repair shops near a point, for the /nearby page.
// Deploy: npx supabase functions deploy nearby-shops --project-ref <ref>
//
// With the GOOGLE_PLACES_KEY secret set, it returns live shops from Google Places (New).
// Without it, it returns Kumpooni's own sample shops and never calls Google.
// The key is a server-only Supabase secret. Never put it in a VITE_ variable.
//
// Cost guard: before every live search it asks nearby_take_call() in the database, which
// allows LIVE_MONTH_CAP searches a month for the whole site (Google's free amount) and
// LIVE_HOUR_CAP_PER_VISITOR per visitor per hour. If that check fails, it does not call Google.
//
// It reads and writes public.nearby_cache with the service role. For live results it stores
// place ids and coordinates only (Google's terms). It never reads anyone's repair files:
// the Proof Score is worked out in the browser from the person's own files.
//
// Privacy: the request holds a location. Do not log request or response bodies, and never
// log the key. Visitors are counted by a one-way hash, not by IP.
import {createClient} from 'npm:@supabase/supabase-js@2'
import {
  CACHE_MAX_AGE_DAYS,
  CACHE_TTL_HOURS,
  LIVE_HOUR_CAP_PER_VISITOR,
  LIVE_MONTH_CAP,
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
import {searchPlaces} from './places.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

/** Shown with live results. Google asks for this when its data appears in a list. */
const GOOGLE_ATTRIBUTION = 'Google Maps'

function reply(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {status, headers: {...CORS, 'Content-Type': 'application/json'}})
}

type CacheRow = {
  source: 'sample' | 'places'
  payload: NearbyShop[] | null
  fetched_at: string
  attributions: string[] | null
}

/** A one-way hash of the caller's IP and the month. The IP itself is never stored. */
async function visitorHash(req: Request) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('cf-connecting-ip') || 'unknown'
  const month = new Date().toISOString().slice(0, 7)
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`nearby:${month}:${ip}`))
  return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('')
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
  const placesKey = Deno.env.get('GOOGLE_PLACES_KEY')

  const base = {cacheKey, bucketKm, center}
  const fetchedAt = new Date()
  const expiresAt = new Date(fetchedAt.getTime() + CACHE_TTL_HOURS * 3600_000)
  const cacheRow = {
    cache_key: cacheKey,
    kind,
    lat_cell: latCell,
    lng_cell: lngCell,
    radius_bucket: bucketKm,
    center_lat: center.lat,
    center_lng: center.lng,
    fetch_radius_km: fetchRadiusKm(bucketKm),
    fetched_at: fetchedAt.toISOString(),
    expires_at: expiresAt.toISOString(),
  }

  // ---------- Live shops ----------
  if (placesKey) {
    // No database, no limit check, no Google call.
    if (!db) return reply(503, {error: 'not_ready'})

    const {data: verdict, error: limitError} = await db.rpc('nearby_take_call', {
      p_visitor: await visitorHash(req),
      p_month_cap: LIVE_MONTH_CAP,
      p_hour_cap: LIVE_HOUR_CAP_PER_VISITOR,
    })
    if (limitError) {
      console.warn('nearby_take_call failed', limitError.code)
      return reply(503, {error: 'not_ready'})
    }
    if (verdict === 'month_cap' || verdict === 'visitor_cap') {
      return reply(200, {
        ...base,
        shops: [],
        source: 'places',
        cached: false,
        fetchedAt: fetchedAt.toISOString(),
        attributions: [],
        paused: verdict,
      } satisfies NearbyResponse)
    }

    let shops: NearbyShop[]
    try {
      shops = await searchPlaces(placesKey, kind, center, fetchRadiusKm(bucketKm))
    } catch (e) {
      // The message is a short code like "places_403". No body, no key.
      console.warn('places search failed', e instanceof Error ? e.message : 'unknown')
      return reply(502, {error: 'places_failed'})
    }

    // Ids and coordinates only. The payload stays empty for Google results.
    const {error} = await db.from('nearby_cache').upsert({
      ...cacheRow,
      source: 'places',
      place_ids: shops.map(s => s.id),
      place_points: shops.map(s => ({id: s.id, lat: s.lat, lng: s.lng})),
      payload: null,
      attributions: [GOOGLE_ATTRIBUTION],
    })
    if (error) console.warn('nearby_cache write failed', error.code)
    const cutoff = new Date(fetchedAt.getTime() - CACHE_MAX_AGE_DAYS * 86400_000).toISOString()
    await db.from('nearby_cache').delete().lt('fetched_at', cutoff)

    return reply(200, {
      ...base,
      shops,
      source: 'places',
      cached: false,
      fetchedAt: fetchedAt.toISOString(),
      attributions: [GOOGLE_ATTRIBUTION],
    } satisfies NearbyResponse)
  }

  // ---------- Sample shops (no key set) ----------
  if (db) {
    const {data} = await db
      .from('nearby_cache')
      .select('source, payload, fetched_at, attributions')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle<CacheRow>()
    if (data?.source === 'sample' && Array.isArray(data.payload)) {
      return reply(200, {
        ...base,
        shops: data.payload,
        source: 'sample',
        cached: true,
        fetchedAt: data.fetched_at,
        attributions: data.attributions ?? [],
      } satisfies NearbyResponse)
    }
  }

  const shops = sampleShops(kind, center, fetchRadiusKm(bucketKm))
  if (db) {
    const {error} = await db.from('nearby_cache').upsert({
      ...cacheRow,
      source: 'sample',
      place_ids: shops.map(s => s.id),
      place_points: shops.map(s => ({id: s.id, lat: s.lat, lng: s.lng})),
      payload: shops,
      attributions: [],
    })
    if (error) console.warn('nearby_cache write failed', error.code)
    const cutoff = new Date(fetchedAt.getTime() - CACHE_MAX_AGE_DAYS * 86400_000).toISOString()
    await db.from('nearby_cache').delete().lt('fetched_at', cutoff)
  }

  return reply(200, {
    ...base,
    shops,
    source: 'sample',
    cached: false,
    fetchedAt: fetchedAt.toISOString(),
    attributions: [],
  } satisfies NearbyResponse)
})
