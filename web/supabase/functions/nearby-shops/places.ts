// Live shops from Google Places API (New). Used only when the GOOGLE_PLACES_KEY secret is set.
// Plain TypeScript (fetch only), so the tests can load the mapping too.
//
// Cost: every field below is in the Nearby Search / Text Search "Enterprise" SKU
// ($35 per 1,000 after 1,000 free a month, checked 2026-11-21). Do not add review, photo
// or "atmosphere" fields: they move every search to a dearer SKU.
//
// Google's terms: names, ratings, phones and hours may be shown but not stored.
// Only place ids and coordinates go into nearby_cache.
import {NEARBY_SEARCH, type NearbyKind, type NearbyShop} from '../_shared/nearby-key.ts'

export const PLACES_FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.rating',
  'places.userRatingCount',
  'places.nationalPhoneNumber',
  'places.googleMapsUri',
  'places.currentOpeningHours.openNow',
  'places.regularOpeningHours.weekdayDescriptions',
  'places.businessStatus',
].join(',')

/** At most 20 per search: one search, one charge. */
const MAX_RESULTS = 20

export type GooglePlace = {
  id?: string
  displayName?: {text?: string}
  formattedAddress?: string
  location?: {latitude?: number; longitude?: number}
  rating?: number
  userRatingCount?: number
  nationalPhoneNumber?: string
  googleMapsUri?: string
  currentOpeningHours?: {openNow?: boolean}
  regularOpeningHours?: {weekdayDescriptions?: string[]}
  businessStatus?: string
}

/** Google writes "8:00 AM – 6:00 PM". The page says "8:00 AM to 6:00 PM". */
function tidyHours(line: string) {
  return line.replace(/\s*[–—-]\s*/g, ' to ').replace(/ | /g, ' ')
}

/** One Google place as a NearbyShop. Null for closed-for-good shops or ones missing an id or point. */
export function toNearbyShop(p: GooglePlace): NearbyShop | null {
  const lat = p.location?.latitude
  const lng = p.location?.longitude
  if (!p.id || !p.displayName?.text || typeof lat !== 'number' || typeof lng !== 'number') return null
  if (p.businessStatus === 'CLOSED_PERMANENTLY') return null
  const hours = p.regularOpeningHours?.weekdayDescriptions
  return {
    id: p.id,
    name: p.displayName.text,
    address: p.formattedAddress ?? null,
    lat,
    lng,
    rating: typeof p.rating === 'number' ? p.rating : null,
    reviews: typeof p.userRatingCount === 'number' ? p.userRatingCount : null,
    phone: p.nationalPhoneNumber ?? null,
    mapsUri: p.googleMapsUri ?? null,
    openNow: typeof p.currentOpeningHours?.openNow === 'boolean' ? p.currentOpeningHours.openNow : null,
    hours: hours && hours.length === 7 ? hours.map(tidyHours) : null,
  }
}

/** A box around a circle. Text Search can only be limited to a box, not a circle. */
export function boxAround(center: {lat: number; lng: number}, radiusKm: number) {
  const dLat = radiusKm / 110.574
  const dLng = radiusKm / (111.32 * Math.cos((center.lat * Math.PI) / 180))
  return {
    low: {latitude: center.lat - dLat, longitude: center.lng - dLng},
    high: {latitude: center.lat + dLat, longitude: center.lng + dLng},
  }
}

/** The request for one kind: Nearby Search when Google has a type for it, Text Search otherwise. */
export function placesRequest(kind: NearbyKind, center: {lat: number; lng: number}, radiusKm: number) {
  const search = NEARBY_SEARCH[kind]
  if (search.includedType) {
    return {
      url: 'https://places.googleapis.com/v1/places:searchNearby',
      body: {
        includedTypes: [search.includedType],
        maxResultCount: MAX_RESULTS,
        rankPreference: 'DISTANCE',
        languageCode: 'en',
        regionCode: 'PH',
        locationRestriction: {
          circle: {center: {latitude: center.lat, longitude: center.lng}, radius: Math.min(radiusKm * 1000, 50000)},
        },
      },
    }
  }
  return {
    url: 'https://places.googleapis.com/v1/places:searchText',
    body: {
      textQuery: search.textQuery,
      pageSize: MAX_RESULTS,
      rankPreference: 'DISTANCE',
      languageCode: 'en',
      regionCode: 'PH',
      locationRestriction: {rectangle: boxAround(center, radiusKm)},
    },
  }
}

/** One live search. Throws with a short code; never includes the key or the response body. */
export async function searchPlaces(
  key: string,
  kind: NearbyKind,
  center: {lat: number; lng: number},
  radiusKm: number,
): Promise<NearbyShop[]> {
  const {url, body} = placesRequest(kind, center, radiusKm)
  const res = await fetch(url, {
    method: 'POST',
    headers: {'Content-Type': 'application/json', 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': PLACES_FIELD_MASK},
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`places_${res.status}`)
  const json = (await res.json()) as {places?: GooglePlace[]}
  const seen = new Set<string>()
  return (json.places ?? [])
    .map(toNearbyShop)
    .filter((s): s is NearbyShop => !!s && !seen.has(s.id) && !!seen.add(s.id))
}
