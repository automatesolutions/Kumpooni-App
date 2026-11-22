import {describe, expect, it} from 'vitest'
import {
  PLACES_FIELD_MASK,
  boxAround,
  placesRequest,
  toNearbyShop,
} from '../../supabase/functions/nearby-shops/places'
import {mapsSearchUrl} from './nearby'

const place = {
  id: 'ChIJ123',
  displayName: {text: 'Real Auto Shop'},
  formattedAddress: 'P-3, Cabadbaran City, Agusan del Norte',
  location: {latitude: 9.12, longitude: 125.53},
  rating: 4.6,
  userRatingCount: 88,
  nationalPhoneNumber: '0917 123 4567',
  googleMapsUri: 'https://maps.google.com/?cid=1',
  currentOpeningHours: {openNow: true},
  regularOpeningHours: {
    weekdayDescriptions: [
      'Monday: 8:00 AM – 5:00 PM',
      'Tuesday: 8:00 AM – 5:00 PM',
      'Wednesday: 8:00 AM – 5:00 PM',
      'Thursday: 8:00 AM – 5:00 PM',
      'Friday: 8:00 AM – 5:00 PM',
      'Saturday: 8:00 AM – 12:00 PM',
      'Sunday: Closed',
    ],
  },
}

describe('live Google places', () => {
  it('maps a Google place to a shop, with hours written "to"', () => {
    const shop = toNearbyShop(place)!
    expect(shop).toMatchObject({id: 'ChIJ123', name: 'Real Auto Shop', rating: 4.6, reviews: 88, openNow: true})
    expect(shop.hours?.[0]).toBe('Monday: 8:00 AM to 5:00 PM')
    expect(shop.hours?.[6]).toBe('Sunday: Closed')
  })

  it('keeps unknowns as null instead of guessing', () => {
    const shop = toNearbyShop({id: 'x', displayName: {text: 'Bare'}, location: {latitude: 9, longitude: 125}})!
    expect(shop).toMatchObject({rating: null, reviews: null, phone: null, openNow: null, hours: null, address: null})
  })

  it('drops shops that closed for good or have no point', () => {
    expect(toNearbyShop({...place, businessStatus: 'CLOSED_PERMANENTLY'})).toBeNull()
    expect(toNearbyShop({...place, location: undefined})).toBeNull()
  })

  it('asks only for fields in the Enterprise search SKU', () => {
    expect(PLACES_FIELD_MASK).not.toMatch(/reviews|photos|editorialSummary|priceLevel/)
    expect(PLACES_FIELD_MASK.split(',')).toContain('places.userRatingCount')
  })

  it('uses Nearby Search for typed kinds and Text Search with a box for the rest', () => {
    const c = {lat: 9.12, lng: 125.54}
    const car = placesRequest('car', c, 6.6)
    expect(car.url).toMatch(/searchNearby$/)
    expect(car.body).toMatchObject({includedTypes: ['car_repair'], maxResultCount: 20})
    const aircon = placesRequest('aircon', c, 6.6)
    expect(aircon.url).toMatch(/searchText$/)
    expect(aircon.body).toMatchObject({pageSize: 20, textQuery: 'aircon repair and cleaning service'})
  })

  it('builds a box that holds the circle', () => {
    const box = boxAround({lat: 9.12, lng: 125.54}, 6.6)
    expect(box.high.latitude - 9.12).toBeCloseTo(6.6 / 110.574, 5)
    expect(box.low.longitude).toBeLessThan(125.54)
  })

  it('sends Google Maps the rounded grid point, not the exact one', () => {
    const url = mapsSearchUrl('car', {lat: 9.12391, lng: 125.53481})
    expect(url).toContain('/@9.12,125.54,14z')
    expect(url).toContain('car%20repair%20shop')
  })
})
