import {useInfiniteQuery, useQuery} from '@tanstack/react-query'
import {supabase} from '@/lib/supabase'
import {GOOGLE_MAPS_KEY} from '@/lib/env'
import {type Coords, haversine} from '@/lib/geo'
import type {GooglePlace, NearbyStore, SearchStore, StoreDetail} from '@/types/app'
import {STALE} from './catalog'

/** Kumpooni shops near the person that offer the chosen services, with prices. */
export function useNearbyQuotesQuery(coords: Coords | null, serviceIds: number[]) {
  return useQuery({
    queryKey: ['nearby-store', coords, serviceIds],
    enabled: !!coords && serviceIds.length > 0,
    queryFn: async () => {
      const {data, error} = await supabase.rpc('get_nearby_stores', {
        _lat: coords!.lat,
        _lng: coords!.lng,
        _service_ids: serviceIds,
      })
      if (error) throw error
      return (data ?? []) as unknown as NearbyStore[]
    },
  })
}

export function useSearchStoresQuery(coords: Coords | null, keyword: string) {
  return useQuery({
    queryKey: ['store-searches', keyword, coords],
    enabled: !!coords,
    queryFn: async () => {
      const {data, error} = await supabase.rpc('search_nearby_stores', {
        _lat: coords!.lat,
        _lng: coords!.lng,
        _search: keyword,
      })
      if (error) throw error
      return (data ?? []) as SearchStore[]
    },
  })
}

export function useStoreQuery(storeId: string) {
  return useQuery({
    queryKey: ['store', {id: storeId}],
    enabled: !!storeId,
    queryFn: async () => {
      const {data, error} = await supabase
        .from('store')
        .select(
          'id, name, address, store_img, banner_img, store_logo, outside_img, business_hours, contact_no, latitude, longitude, categories(id, name)',
        )
        .eq('id', storeId)
        .single()
      if (error) throw error
      return data as unknown as StoreDetail
    },
  })
}

export type TimeSlots = {
  available_date: string
  available_timeslots: string[]
  week_day: string
}

export function useStoreSlotsQuery(storeId: string) {
  return useQuery({
    queryKey: ['store-availability', storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const {data, error} = await supabase
        .rpc('get_store_available_slots', {storeid: storeId})
        .not('available_timeslots', 'is', null)
      if (error) throw error
      return (data ?? []) as TimeSlots[]
    },
  })
}

/* ---------- Google Places: shops not on Kumpooni yet ---------- */

const PAGE_SIZE = 20
const PLACES_FIELDS = [
  'places.id',
  'places.displayName',
  'places.shortFormattedAddress',
  'places.googleMapsUri',
  'places.photos',
  'places.rating',
  'places.userRatingCount',
  'places.location',
  'places.nationalPhoneNumber',
  'places.regularOpeningHours',
  'nextPageToken',
].join(',')

async function searchPlaces({
  textQuery,
  includedType,
  coords,
  pageToken,
  minRating,
}: {
  textQuery: string
  includedType: 'car_repair' | 'auto_parts_store'
  coords: Coords
  pageToken?: string | null
  minRating?: number
}) {
  if (!GOOGLE_MAPS_KEY) throw new Error('Google Maps key is missing.')
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_MAPS_KEY,
      'X-Goog-FieldMask': PLACES_FIELDS,
    },
    body: JSON.stringify({
      languageCode: 'en',
      textQuery,
      includedType,
      strictTypeFiltering: true,
      rankPreference: 'RELEVANCE',
      minRating,
      locationBias: {
        circle: {center: {latitude: coords.lat, longitude: coords.lng}, radius: 500},
      },
      pageSize: PAGE_SIZE,
      pageToken: pageToken ?? undefined,
    }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json?.error?.message ?? 'Google Places request failed.')
  const places = ((json.places ?? []) as GooglePlace[]).map(p => ({
    ...p,
    dist_meters:
      haversine([coords.lat, coords.lng], [p.location.latitude, p.location.longitude]) * 1000,
  }))
  return {places, nextPageToken: (json.nextPageToken as string | undefined) ?? null}
}

export function useNearbyRepairPlacesQuery(coords: Coords | null) {
  return useInfiniteQuery({
    queryKey: ['places-list', coords],
    enabled: !!coords && !!GOOGLE_MAPS_KEY,
    staleTime: STALE.HOUR,
    initialPageParam: null as string | null,
    queryFn: async ({pageParam}) => {
      const page = await searchPlaces({
        textQuery: 'auto repair shop, car repair and maintenance service',
        includedType: 'car_repair',
        coords: coords!,
        pageToken: pageParam,
      })
      return {...page, places: page.places.filter(p => (p.userRatingCount ?? 0) > 3)}
    },
    getNextPageParam: last => last.nextPageToken,
  })
}

export function usePartsShopsQuery(coords: Coords | null, query: string) {
  return useQuery({
    queryKey: ['list-parts', {coords, query}],
    enabled: !!coords && !!GOOGLE_MAPS_KEY && !!query,
    staleTime: STALE.HOUR,
    queryFn: async () => {
      const {places} = await searchPlaces({
        textQuery: query,
        includedType: 'auto_parts_store',
        coords: coords!,
        minRating: 3,
      })
      return places
    },
  })
}
