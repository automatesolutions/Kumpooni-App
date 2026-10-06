import {GOOGLE_MAPS_KEY} from './env'
import {haversine, type Coords} from './geo'
import type {OfficeRow} from '@/types/repair-proof'

declare global {
  interface Window {
    __kumpooniMapsReady?: () => void
    gm_authFailure?: () => void
  }
}

let loading: Promise<typeof google.maps> | null = null
let authFailed = false
const authListeners = new Set<() => void>()

/** Google calls this when the key is wrong or Maps JavaScript API is off for it. */
window.gm_authFailure = () => {
  authFailed = true
  authListeners.forEach(fn => fn())
}

export function onMapsAuthFailure(fn: () => void) {
  if (authFailed) fn()
  authListeners.add(fn)
  return () => {
    authListeners.delete(fn)
  }
}

/** Loads the Maps JavaScript API once. Rejects when there is no key. */
export function loadGoogleMaps(): Promise<typeof google.maps> {
  if (!GOOGLE_MAPS_KEY) return Promise.reject(new Error('no_key'))
  if (authFailed) return Promise.reject(new Error('auth_failed'))
  if (typeof window.google?.maps?.importLibrary === 'function') return Promise.resolve(window.google.maps)
  loading ??= new Promise((resolve, reject) => {
    window.__kumpooniMapsReady = () => resolve(window.google.maps)
    const script = document.createElement('script')
    script.src =
      'https://maps.googleapis.com/maps/api/js' +
      `?key=${encodeURIComponent(GOOGLE_MAPS_KEY!)}&v=weekly&loading=async&region=PH&language=en` +
      '&callback=__kumpooniMapsReady'
    script.async = true
    script.onerror = () => {
      loading = null
      script.remove()
      reject(new Error("The map didn't load. Check your connection and try again."))
    }
    document.head.appendChild(script)
  })
  return loading
}

export type NearOffice = OfficeRow & {km: number}

/** Used to order offices before we know where the person is. */
export const MANILA: Coords = {lat: 14.5995, lng: 120.9842}

export function nearestOffices(offices: OfficeRow[], from: Coords | null): NearOffice[] {
  if (!from) {
    // No location yet: Manila's office first, km unknown so no distance is shown.
    return offices
      .map(o => ({...o, km: haversine([MANILA.lat, MANILA.lng], [o.lat, o.lng])}))
      .sort((a, b) => a.km - b.km)
      .map(o => ({...o, km: NaN}))
  }
  return offices
    .map(o => ({...o, km: haversine([from.lat, from.lng], [o.lat, o.lng])}))
    .sort((a, b) => a.km - b.km)
}

/** Satellite view in Google Earth on the web. Needs no key. */
export function earthUrl({lat, lng}: Coords) {
  return `https://earth.google.com/web/@${lat},${lng},40a,350d,35y,0h,60t,0r`
}

/** Google Maps searched by name and address, which beats an approximate pin. */
export function mapsSearchUrl(office: Pick<OfficeRow, 'name' | 'address'>) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${office.name}, ${office.address}`)}`
}

export function directionsUrl(office: Pick<OfficeRow, 'name' | 'address'>, from: Coords | null, mode: 'driving' | 'walking' = 'driving') {
  const params = new URLSearchParams({
    api: '1',
    destination: `${office.name}, ${office.address}`,
    travelmode: mode,
  })
  if (from) params.set('origin', `${from.lat},${from.lng}`)
  return `https://www.google.com/maps/dir/?${params}`
}

export function staticMapUrl(office: Pick<OfficeRow, 'lat' | 'lng'>, from: Coords | null) {
  if (!GOOGLE_MAPS_KEY) return null
  const params = new URLSearchParams({
    size: '640x320',
    scale: '2',
    maptype: 'hybrid',
    key: GOOGLE_MAPS_KEY,
  })
  params.append('markers', `color:red|label:D|${office.lat},${office.lng}`)
  if (from) params.append('markers', `color:blue|label:Y|${from.lat},${from.lng}`)
  else params.set('zoom', '17')
  return `https://maps.googleapis.com/maps/api/staticmap?${params}`
}

export function formatKm(km: number) {
  if (!Number.isFinite(km)) return ''
  return km < 1 ? `${Math.round(km * 1000)} m away` : `${km < 10 ? km.toFixed(1) : Math.round(km)} km away`
}
