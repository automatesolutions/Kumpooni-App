import {GOOGLE_MAPS_KEY} from './env'

export type Coords = {lat: number; lng: number}

export type Address = {
  formatted_address: string
  main_text: string
  secondary_text: string
}

/** Distance in kilometres between two points. */
export function haversine([lat1, lon1]: number[], [lat2, lon2]: number[]) {
  const rad = (deg: number) => (Math.PI / 180) * deg
  const dLat = rad(lat2 - lat1)
  const dLon = rad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(rad(lat1)) * Math.cos(rad(lat2))
  return 6371 * 2 * Math.asin(Math.sqrt(a))
}

export function splitAddress(formatted: string): Address {
  const [main, ...rest] = formatted.split(',')
  return {
    formatted_address: formatted,
    main_text: main.trim(),
    secondary_text: rest.join(',').trim(),
  }
}

export function getBrowserPosition(): Promise<Coords> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error("This browser can't share your location."))
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({lat: pos.coords.latitude, lng: pos.coords.longitude}),
      err => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(
            new Error(
              'Location access is off. Turn it on in your browser settings, or search for your address.',
            ),
          )
        } else {
          reject(new Error("We couldn't find your location. Search for your address instead."))
        }
      },
      {enableHighAccuracy: true, timeout: 15000, maximumAge: 60000},
    )
  })
}

export async function reverseGeocode(coords: Coords): Promise<Address | null> {
  if (!GOOGLE_MAPS_KEY) return null
  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
  url.searchParams.set('latlng', `${coords.lat},${coords.lng}`)
  url.searchParams.set('key', GOOGLE_MAPS_KEY)
  const res = await fetch(url)
  const json = await res.json()
  const result = json?.results?.[0]
  return result ? splitAddress(result.formatted_address) : null
}

export type PlaceSuggestion = {
  placeId: string
  mainText: string
  secondaryText: string
}

export async function autocompleteAddress(input: string): Promise<PlaceSuggestion[]> {
  if (!GOOGLE_MAPS_KEY || input.trim().length < 3) return []
  const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_MAPS_KEY,
    },
    body: JSON.stringify({input, includedRegionCodes: ['ph'], languageCode: 'en'}),
  })
  const json = await res.json()
  return (json?.suggestions ?? [])
    .map((s: any) => s.placePrediction)
    .filter(Boolean)
    .map((p: any) => ({
      placeId: p.placeId,
      mainText: p.structuredFormat?.mainText?.text ?? p.text?.text ?? '',
      secondaryText: p.structuredFormat?.secondaryText?.text ?? '',
    }))
}

export async function getPlaceLocation(
  placeId: string,
): Promise<{coords: Coords; formatted: string}> {
  const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: {
      'X-Goog-Api-Key': GOOGLE_MAPS_KEY ?? '',
      'X-Goog-FieldMask': 'location,formattedAddress',
    },
  })
  const json = await res.json()
  if (!json?.location) throw new Error("We couldn't load that address. Try another one.")
  return {
    coords: {lat: json.location.latitude, lng: json.location.longitude},
    formatted: json.formattedAddress ?? '',
  }
}

/** A typed place in the Philippines to coordinates. Uses Google when there is a key, else OpenStreetMap. */
export async function geocodeText(text: string): Promise<{coords: Coords; label: string} | null> {
  const q = text.trim()
  if (q.length < 2) return null
  if (GOOGLE_MAPS_KEY) {
    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
    url.searchParams.set('address', q)
    url.searchParams.set('region', 'ph')
    url.searchParams.set('components', 'country:PH')
    url.searchParams.set('key', GOOGLE_MAPS_KEY)
    const json = await (await fetch(url)).json()
    const r = json?.results?.[0]
    if (r) return {coords: {lat: r.geometry.location.lat, lng: r.geometry.location.lng}, label: r.formatted_address}
  }
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('limit', '1')
  url.searchParams.set('countrycodes', 'ph')
  url.searchParams.set('q', q)
  const json = await (await fetch(url, {headers: {'Accept-Language': 'en'}})).json()
  const r = json?.[0]
  return r ? {coords: {lat: Number(r.lat), lng: Number(r.lon)}, label: r.display_name} : null
}

export function placePhotoUrl(photoName: string, maxWidth = 640) {
  return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxWidth}&key=${GOOGLE_MAPS_KEY}`
}
