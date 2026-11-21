import {describe, expect, it} from 'vitest'
import {
  GRID_DEG,
  GRID_MARGIN_KM,
  NEARBY_KINDS,
  NEARBY_SEARCH,
  RADIUS_BUCKETS_KM,
  fetchRadiusKm,
  gridCell,
  inPhilippines,
  nearbyCacheKey,
  radiusBucket,
  withinRadius,
  BOARD_SIZE,
  rankByDistance,
  standoutLines,
  startFileUrl,
  telUrl,
} from './nearby'
import {haversine} from './geo'
import {sampleShops} from '../../supabase/functions/nearby-shops/sample'

describe('radius buckets', () => {
  it('rounds the slider up to the next bucket', () => {
    expect(radiusBucket(2)).toBe(5)
    expect(radiusBucket(5)).toBe(5)
    expect(radiusBucket(5.1)).toBe(10)
    expect(radiusBucket(10)).toBe(10)
    expect(radiusBucket(12)).toBe(15)
    expect(radiusBucket(16)).toBe(25)
    expect(radiusBucket(25)).toBe(25)
  })

  it('clamps values outside 2 to 25 km', () => {
    expect(radiusBucket(0)).toBe(5)
    expect(radiusBucket(-3)).toBe(5)
    expect(radiusBucket(80)).toBe(25)
    expect(radiusBucket(Number.NaN)).toBe(5)
  })

  it('searches past the bucket by the grid margin', () => {
    for (const b of RADIUS_BUCKETS_KM) expect(fetchRadiusKm(b)).toBeCloseTo(b + GRID_MARGIN_KM)
  })
})

describe('cache key', () => {
  // Manila City Hall area.
  const lat = 14.5995
  const lng = 120.9842

  it('has the kind:latCell:lngCell:bucket shape', () => {
    expect(nearbyCacheKey('car', lat, lng, 8)).toBe('car:730:6049:10')
  })

  it('gives two points in the same cell and bucket the same key', () => {
    const a = nearbyCacheKey('car', 14.5995, 120.9842, 7)
    const b = nearbyCacheKey('car', 14.5951, 120.9871, 9.5) // about 600 m away, same bucket
    expect(a).toBe(b)
  })

  it('gives a radius that crosses a bucket a different key', () => {
    expect(nearbyCacheKey('car', lat, lng, 10)).not.toBe(nearbyCacheKey('car', lat, lng, 10.5))
    expect(nearbyCacheKey('car', lat, lng, 5)).not.toBe(nearbyCacheKey('car', lat, lng, 6))
  })

  it('gives another cell or another kind a different key', () => {
    expect(nearbyCacheKey('car', lat, lng, 5)).not.toBe(nearbyCacheKey('car', lat + GRID_DEG, lng, 5))
    expect(nearbyCacheKey('car', lat, lng, 5)).not.toBe(nearbyCacheKey('aircon', lat, lng, 5))
  })

  it('reaches the whole circle from anywhere in the cell', () => {
    // The worst case is the corner of a cell, at the Philippines' northern tip.
    const {center} = gridCell(20.99, 121.99)
    const corner = {lat: center.lat + GRID_DEG / 2, lng: center.lng + GRID_DEG / 2}
    expect(haversine([center.lat, center.lng], [corner.lat, corner.lng])).toBeLessThan(GRID_MARGIN_KM)
  })
})

describe('search map and bounds', () => {
  it('has a search for every board kind and leaves out "other"', () => {
    for (const k of NEARBY_KINDS) {
      const s = NEARBY_SEARCH[k]
      expect(Boolean(s.includedType || s.textQuery)).toBe(true)
    }
    expect((NEARBY_KINDS as readonly string[]).includes('other')).toBe(false)
  })

  it('accepts Philippine points only', () => {
    expect(inPhilippines(14.5995, 120.9842)).toBe(true) // Manila
    expect(inPhilippines(7.0731, 125.6128)).toBe(true) // Davao
    expect(inPhilippines(1.3521, 103.8198)).toBe(false) // Singapore
    expect(inPhilippines(Number.NaN, 120)).toBe(false)
  })
})

describe('sample shops', () => {
  const center = gridCell(14.5995, 120.9842).center

  it('returns the same shops for the same input', () => {
    expect(sampleShops('car', center, 6.6)).toEqual(sampleShops('car', center, 6.6))
  })

  it('places at least one shop outside the radius, so filtering can be seen', () => {
    const shops = sampleShops('phone', center, 5)
    const inside = withinRadius(shops, center, 5)
    expect(inside.length).toBeGreaterThanOrEqual(10)
    expect(inside.length).toBeLessThan(shops.length)
    expect(inside.every(s => s.km <= 5)).toBe(true)
  })
})

describe('board helpers', () => {
  const at = (id: string, km: number, rating: number | null, reviews: number | null) =>
    ({id, name: `Shop ${id}`, address: null, lat: 0, lng: 0, rating, reviews, phone: null, mapsUri: null, openNow: null, hours: null, km})

  it('sends only the grid centre, which maps back to the same cell', () => {
    const {latCell, lngCell, center} = gridCell(14.5995, 120.9842)
    const again = gridCell(center.lat, center.lng)
    expect([again.latCell, again.lngCell]).toEqual([latCell, lngCell])
    expect(nearbyCacheKey('car', center.lat, center.lng, 7)).toBe(nearbyCacheKey('car', 14.5995, 120.9842, 7))
  })

  it('ranks closest first, keeps 10, and reads nothing else', () => {
    const shops = Array.from({length: 12}, (_, i) => at(`s${i}`, 12 - i, 4, 10))
    const ranked = rankByDistance(shops)
    expect(ranked).toHaveLength(BOARD_SIZE)
    expect(ranked[0].km).toBe(1)
  })

  it('gives each standout line to one shop, computed from the list', () => {
    const lines = standoutLines([at('a', 0.5, 4.1, 20), at('b', 3, 4.9, 50), at('c', 4, 4.5, 900)])
    expect(lines.get('a')).toBe('Closest to you')
    expect(lines.get('b')).toBe('Highest public rating in this list')
    expect(lines.get('c')).toBe('Most public reviews in this list')
  })

  it('never calls an unrated shop the highest rated', () => {
    const lines = standoutLines([at('a', 1, null, null), at('b', 2, 3.2, 4)])
    expect(lines.get('a')).toBe('Closest to you')
    expect(lines.get('b')).toBe('Highest public rating in this list')
  })

  it('fills the start-file link, with a place id only for real shops', () => {
    const real = {...at('ChIJabc', 1, 4, 10), name: 'Real Shop', address: '276 Magsaysay Rd, Bacolod'}
    const url = new URL(startFileUrl(real, 'aircon'), 'https://x.test')
    expect(url.pathname).toBe('/files/new')
    expect(url.searchParams.get('shop')).toBe('Real Shop')
    expect(url.searchParams.get('city')).toBe('Bacolod')
    expect(url.searchParams.get('placeId')).toBe('ChIJabc')
    expect(url.searchParams.get('kind')).toBe('aircon')
    const sample = new URL(startFileUrl(at('sample-car-1', 1, 4, 10), 'car'), 'https://x.test')
    expect(sample.searchParams.has('placeId')).toBe(false)
  })

  it('hides Call when there is no usable number', () => {
    expect(telUrl(null)).toBeNull()
    expect(telUrl('n/a')).toBeNull()
    expect(telUrl('0917 555 1037')).toBe('tel:09175551037')
  })
})
