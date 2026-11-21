// The /nearby page's shared rules: categories, the cache key, and distance filtering.
// The cache-key rules live in supabase/functions/_shared/nearby-key.ts so the Edge Function
// and the app always agree on them.
import type {ItemKind} from './kinds'
import {haversine, type Coords} from './geo'
import {NEARBY_KINDS, type NearbyKind, type NearbyShop} from '../../supabase/functions/_shared/nearby-key'

export * from '../../supabase/functions/_shared/nearby-key'

// Fails to typecheck if a board kind is ever not a real item kind.
const _kindsAreItemKinds: readonly ItemKind[] = NEARBY_KINDS
void _kindsAreItemKinds

export type ShopWithKm = NearbyShop & {km: number}

/** Adds the distance from the person's own point, and drops shops outside the radius. */
export function withinRadius(shops: NearbyShop[], from: Coords, radiusKm: number): ShopWithKm[] {
  return shops
    .map(s => ({...s, km: haversine([from.lat, from.lng], [s.lat, s.lng])}))
    .filter(s => s.km <= radiusKm)
}

export function asNearbyKind(value: string | null | undefined, fallback: NearbyKind = 'car'): NearbyKind {
  return (NEARBY_KINDS as readonly string[]).includes(value ?? '') ? (value as NearbyKind) : fallback
}

/** How many shops the board shows. */
export const BOARD_SIZE = 10

/**
 * Board order until the Proof Score lands (lib/proof-score.ts): closest first, then more
 * public reviews. Only distance and reviews are read. Nothing a shop pays for is.
 */
export function rankByDistance(shops: ShopWithKm[]): ShopWithKm[] {
  return [...shops].sort((a, b) => a.km - b.km || (b.reviews ?? 0) - (a.reviews ?? 0)).slice(0, BOARD_SIZE)
}

/**
 * One fact per shop that stands out in this list. Each line is computed from the list itself,
 * and each goes to one shop only. A shop with nothing that stands out gets no line.
 */
export function standoutLines(shops: ShopWithKm[]): Map<string, string> {
  const lines = new Map<string, string>()
  const give = (shop: ShopWithKm | undefined, line: string) => {
    if (shop && !lines.has(shop.id)) lines.set(shop.id, line)
  }
  if (shops.length < 2) return lines
  give([...shops].sort((a, b) => a.km - b.km)[0], 'Closest to you')
  const rated = shops.filter(s => s.rating != null && (s.reviews ?? 0) > 0)
  give(
    [...rated].sort((a, b) => b.rating! - a.rating! || (b.reviews ?? 0) - (a.reviews ?? 0))[0],
    'Highest public rating in this list',
  )
  give([...rated].sort((a, b) => (b.reviews ?? 0) - (a.reviews ?? 0))[0], 'Most public reviews in this list')
  return lines
}

export function isSampleShop(shop: Pick<NearbyShop, 'id'>) {
  return shop.id.startsWith('sample-')
}

/** The town from an address like "276 Magsaysay Rd, Bacolod". Null when there isn't one. */
export function cityFromAddress(address: string | null) {
  const parts = (address ?? '').split(',').map(s => s.trim()).filter(Boolean)
  return parts.length > 1 ? parts[parts.length - 1] : null
}

/** Google Maps directions to the shop's pin. Same pattern as directionsUrl in lib/maps.ts. */
export function shopDirectionsUrl(shop: NearbyShop, from: Coords | null) {
  const params = new URLSearchParams({api: '1', destination: `${shop.lat},${shop.lng}`, travelmode: 'driving'})
  if (!isSampleShop(shop)) {
    params.set('destination', shop.name)
    params.set('destination_place_id', shop.id)
  }
  if (from) params.set('origin', `${from.lat},${from.lng}`)
  return `https://www.google.com/maps/dir/?${params}`
}

/** /files/new with the shop filled in. The file is only saved when the person submits. */
export function startFileUrl(shop: NearbyShop, kind: NearbyKind) {
  const params = new URLSearchParams({shop: shop.name, kind})
  const city = cityFromAddress(shop.address)
  if (city) params.set('city', city)
  if (!isSampleShop(shop)) params.set('placeId', shop.id)
  return `/files/new?${params}`
}

/** The phone number as a tel: link, or null when the shop has none. */
export function telUrl(phone: string | null) {
  const digits = (phone ?? '').replace(/[^\d+]/g, '')
  return digits.length >= 7 ? `tel:${digits}` : null
}

/** Today's line from the shop's weekly hours (Monday first, as Google lists them). */
export function todaysHours(hours: string[] | null, now = new Date()) {
  if (!hours || hours.length !== 7) return null
  return hours[(now.getDay() + 6) % 7] ?? null
}

/** "Open now", "Closed", or null when the hours are unknown. Text, so it never relies on colour. */
export function openLabel(openNow: boolean | null) {
  return openNow == null ? null : openNow ? 'Open now' : 'Closed'
}

export function formatDistance(km: number) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km < 10 ? km.toFixed(1) : Math.round(km)} km`
}
