// Shared by the nearby-shops Edge Function (Deno) and the web app (Vite).
// Plain TypeScript only: no Deno, browser, or npm imports, so both sides can load it.

/** Kinds shown on the /nearby board. "other" is left out on purpose: there is no useful search for it. */
export const NEARBY_KINDS = [
  'car',
  'motorcycle',
  'home',
  'construction',
  'electrical',
  'aircon',
  'appliance',
  'computer',
  'phone',
] as const
export type NearbyKind = (typeof NEARBY_KINDS)[number]

export function isNearbyKind(value: unknown): value is NearbyKind {
  return typeof value === 'string' && (NEARBY_KINDS as readonly string[]).includes(value)
}

/**
 * How each kind is searched once live calls are on.
 * Types were checked against Google's Table A on 2026-11-21. Most repair trades have
 * no type there, so they use a text query that people in the Philippines would type.
 */
export const NEARBY_SEARCH: Record<NearbyKind, {includedType?: string; textQuery?: string}> = {
  car: {includedType: 'car_repair'},
  motorcycle: {textQuery: 'motorcycle repair shop'},
  home: {textQuery: 'home repair contractor'},
  construction: {textQuery: 'construction contractor'},
  electrical: {includedType: 'electrician'},
  aircon: {textQuery: 'aircon repair and cleaning service'},
  appliance: {textQuery: 'appliance repair shop'},
  computer: {textQuery: 'computer repair shop'},
  phone: {textQuery: 'cellphone repair shop'},
}

/** The radius slider. */
export const RADIUS_MIN_KM = 2
export const RADIUS_MAX_KM = 25
export const RADIUS_DEFAULT_KM = 5

/** Slider values fall into these buckets. One bucket shares one search. */
export const RADIUS_BUCKETS_KM = [5, 10, 15, 25] as const

/** Grid size in degrees. 0.02° is about 2.2 km, so people near each other share a search. */
export const GRID_DEG = 0.02

/**
 * A search is centred on the middle of a grid cell, not on the person.
 * Half a cell's diagonal is about 1.57 km in the Philippines, so adding 1.6 km
 * to the search radius covers the person's full circle from anywhere in the cell.
 */
export const GRID_MARGIN_KM = 1.6

/** How long a cache row counts as fresh. */
export const CACHE_TTL_HOURS = 24

/** Google allows coordinates to be kept for up to 30 days. Rows older than this are deleted. */
export const CACHE_MAX_AGE_DAYS = 30

/**
 * Live Google searches allowed per month, for the whole site. 1,000 is Google's free amount
 * for the search SKU we use, so the cost stays at $0. Raise it only after a yes on the cost.
 */
export const LIVE_MONTH_CAP = 1000

/** Live searches one visitor can start in an hour. Stops one person or a bot using up the month. */
export const LIVE_HOUR_CAP_PER_VISITOR = 20

/** A rough box around the Philippines. Requests outside it are refused. */
export const PH_BOUNDS = {minLat: 4, maxLat: 22, minLng: 116, maxLng: 127.5}

export function clampRadius(km: number) {
  if (!Number.isFinite(km)) return RADIUS_DEFAULT_KM
  return Math.min(RADIUS_MAX_KM, Math.max(RADIUS_MIN_KM, km))
}

/** The smallest bucket that holds the radius, after clamping to 2 to 25 km. */
export function radiusBucket(km: number): number {
  const r = clampRadius(km)
  return RADIUS_BUCKETS_KM.find(b => r <= b) ?? RADIUS_BUCKETS_KM[RADIUS_BUCKETS_KM.length - 1]
}

/** How far the search reaches for a bucket, in km, including the grid margin. */
export function fetchRadiusKm(bucketKm: number) {
  return bucketKm + GRID_MARGIN_KM
}

// Math.round gives -0 for small negatives, which would print as "0" anyway; `|| 0` keeps it tidy.
const toCell = (deg: number) => Math.round(deg / GRID_DEG) || 0

export function gridCell(lat: number, lng: number) {
  const latCell = toCell(lat)
  const lngCell = toCell(lng)
  return {
    latCell,
    lngCell,
    // Rounded so the centre does not pick up float noise like 14.600000000000001.
    center: {lat: Number((latCell * GRID_DEG).toFixed(5)), lng: Number((lngCell * GRID_DEG).toFixed(5))},
  }
}

export function inPhilippines(lat: number, lng: number) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= PH_BOUNDS.minLat &&
    lat <= PH_BOUNDS.maxLat &&
    lng >= PH_BOUNDS.minLng &&
    lng <= PH_BOUNDS.maxLng
  )
}

/** kind:latCell:lngCell:bucket, for example "car:730:6049:10". */
export function nearbyCacheKey(kind: NearbyKind, lat: number, lng: number, radiusKm: number) {
  const {latCell, lngCell} = gridCell(lat, lng)
  return `${kind}:${latCell}:${lngCell}:${radiusBucket(radiusKm)}`
}

/** One shop as the function returns it. Same shape for sample and live data. */
export type NearbyShop = {
  /** Google place id when live; "sample-..." for sample data. */
  id: string
  name: string
  address: string | null
  lat: number
  lng: number
  /** Google rating, 0 to 5. Null when the shop has none. */
  rating: number | null
  /** Number of public ratings. Null when unknown. */
  reviews: number | null
  phone: string | null
  mapsUri: string | null
  /** From the shop's own hours. Null when the hours are unknown. */
  openNow: boolean | null
  /** One line per day, as the source gives them. */
  hours: string[] | null
}

export type NearbyResponse = {
  shops: NearbyShop[]
  /** "sample" until live calls are turned on. */
  source: 'sample' | 'places'
  cached: boolean
  cacheKey: string
  bucketKm: number
  /** Where the search was centred: the middle of the grid cell. */
  center: {lat: number; lng: number}
  fetchedAt: string
  /** Attribution lines the page must show for this data. Empty for sample data. */
  attributions: string[]
  /**
   * Why live results aren't shown, when they aren't: this month's free searches are used up,
   * or this visitor searched too often. Sample shops are not sent in that case.
   */
  paused?: 'month_cap' | 'visitor_cap'
}
