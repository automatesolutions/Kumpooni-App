// Sample shops for building and testing the /nearby page without calling Google.
// Names are made up. The page labels this data as sample shops.
// The shapes follow the saved Places API (New) responses in placesApi/, mapped to NearbyShop.
import {type NearbyKind, type NearbyShop} from '../_shared/nearby-key.ts'

const PREFIXES = [
  'Bayanihan',
  'Mabuhay',
  'Kanto',
  'Tulay',
  'Sampaguita',
  'Narra',
  'Bagong Araw',
  'Lakbay',
  'Masagana',
  'Silangan',
  'Dalisay',
  'Bituin',
]

const TRADE: Record<NearbyKind, string> = {
  car: 'Auto Care',
  motorcycle: 'Moto Shop',
  home: 'Home Fix',
  construction: 'Builders',
  electrical: 'Electrical Services',
  aircon: 'Aircon Services',
  appliance: 'Appliance Repair',
  computer: 'Computer Repair',
  phone: 'Phone Repair',
}

// Picked to cover the cases the ranking has to get right:
// a 5.0 with 3 reviews, a 4.6 with 400, a shop with no rating, and one outside the radius.
const RATINGS: (number | null)[] = [4.6, 5.0, 4.2, null, 4.8, 3.9, 4.4, 4.7, 4.1, 4.5, 3.6, 4.3]
const REVIEWS: (number | null)[] = [400, 3, 85, null, 210, 40, 12, 150, 60, 95, 22, 300]
/** Share of the search radius. Above 1 is outside it. */
const REACH = [0.35, 0.1, 0.55, 0.25, 0.8, 0.15, 0.45, 0.95, 0.65, 0.3, 1.15, 0.7]
const OPEN: (boolean | null)[] = [true, true, false, null, true, false, true, true, false, true, true, false]

const WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

/** Spreads sample shops around a point, out to a bit past the radius. Same input, same shops. */
export function sampleShops(kind: NearbyKind, center: {lat: number; lng: number}, radiusKm: number): NearbyShop[] {
  const kmPerDegLat = 110.574
  const kmPerDegLng = 111.32 * Math.cos((center.lat * Math.PI) / 180)
  return PREFIXES.map((prefix, i) => {
    const km = REACH[i] * radiusKm
    const bearing = (i * 137.5 * Math.PI) / 180 // golden angle, so pins do not line up
    const lat = center.lat + (km * Math.cos(bearing)) / kmPerDegLat
    const lng = center.lng + (km * Math.sin(bearing)) / kmPerDegLng
    const closesSat = i % 3 === 0
    return {
      id: `sample-${kind}-${i + 1}`,
      name: `${prefix} ${TRADE[kind]}`,
      address: `Sample address ${i + 1}`,
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      rating: RATINGS[i],
      reviews: REVIEWS[i],
      phone: i % 4 === 2 ? null : `0917 555 ${String(1000 + i * 37).slice(-4)}`,
      mapsUri: null,
      openNow: OPEN[i],
      hours:
        OPEN[i] === null
          ? null
          : WEEK.map(d =>
              d === 'Sunday' || (closesSat && d === 'Saturday') ? `${d}: Closed` : `${d}: 8:00 AM to 6:00 PM`,
            ),
    }
  })
}
