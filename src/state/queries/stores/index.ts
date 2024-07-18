import {haversine} from '#/lib/geo/haversine'
import {supabase} from '#/lib/supabase'
import {logger} from '#/logger'
import {
  Coordinates,
  Coords,
  GooglePlaceDto,
  NearbyStoresServices,
  StoreCategory,
} from '#/types/automate'
import {useInfiniteQuery, useQuery} from '@tanstack/react-query'
import {useEffect, useRef} from 'react'
import {GOOGLE_MAP_KEY} from 'react-native-dotenv'

export const RQKEY = (coord: Coords | null) => ['nearby-store', coord]

export function useGetNearbyStoreQuery(
  coord: Coords | null,
  service_ids: number[],
) {
  return useQuery({
    queryKey: RQKEY(coord),
    queryFn: async () => {
      const {data, error} = await supabase
        .rpc(
          'get_nearby_stores',
          coord
            ? {_lat: coord.lat, _lng: coord.lng, _service_ids: service_ids}
            : {_lat: 0, _lng: 0, _service_ids: service_ids},
        )
        .returns<NearbyStoresServices[]>()

      if (error) {
        logger.error('ServiceError', {error})

        throw error
      }

      return data
    },
  })
}

export function useGetStoreOpenDaysQuery({id}: {id: string}) {
  return useQuery({
    queryKey: ['store-availability', id],
    queryFn: async () => {
      const {data, error} = await supabase
        .rpc('get_store_available_slots', {
          storeid: id,
        })
        .not('available_timeslots', 'is', null)

      if (error) {
        logger.error('useGetStoreOpenDaysQuery', {error})
        throw error
      }
      return data
    },
    enabled: !!id,
  })
}

export function useStoreQuery(storeId: string) {
  return useQuery({
    queryKey: ['store', {id: storeId}],
    queryFn: async () => {
      const {data, error} = await supabase
        .from('store')
        .select(
          'id, name, address, store_img, banner_img, store_logo, outside_img, business_hours, contact_no, latitude, longitude, categories(id, name)',
        )
        .eq('id', storeId)
        .single()

      if (error) {
        logger.error('useStoreQuery', {error})
        throw error
      }

      return data
    },
  })
}

export function useSearchStoresQuery({
  lat,
  lng,
  keyword,
}: {
  keyword: string
  lng: number | null
  lat: number | null
}) {
  return useQuery({
    queryKey: ['store-searches', keyword],
    queryFn: async () => {
      const {data, error} = await supabase.rpc('search_nearby_stores', {
        _lat: lat!,
        _lng: lng!,
        _search: keyword,
      })
      if (error) {
        logger.error('useSearchStoresQuery', {error})
        throw error
      }
      return data
    },
  })
}

// export function useGooglePlacesRepairShopQuery({
//   textQuery = '',
//   location,
// }: {
//   textQuery: string;
//   location: Coords | null;
// }) {
//   return useQuery({
//     queryKey: ['google-places', textQuery],
//     queryFn: async () => {
//       return await searchGooglePlacesRepairShop({textQuery, location});
//     },
//   });
// }

const PAGE_SIZE = 20
async function searchGooglePlacesRepairShop({
  textQuery = '',
  location,
  pageToken = null,
}: {
  textQuery: string
  location: Coords | null
  pageToken: string | null
}) {
  logger.debug('Hello World')
  if (!location) throw new Error('Missing location fields')
  if (!GOOGLE_MAP_KEY) {
    throw new Error('Missing Google API Key')
  }

  const headers = {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': GOOGLE_MAP_KEY,
    'X-Goog-FieldMask':
      'places.id,places.userRatingCount,places.displayName,places.location,places.photos,places.shortFormattedAddress,places.types,places.googleMapsUri,places.rating,nextPageToken',
  }

  try {
    const response = await fetch(
      'https://places.googleapis.com/v1/places:searchText',
      {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          languageCode: 'en',
          textQuery: textQuery,
          strictTypeFiltering: true,
          includedType: 'car_repair',
          rankPreference: 'RELEVANCE',
          locationBias: {
            circle: {
              center: {
                latitude: location.lat,
                longitude: location.lng,
              },
              radius: 500.0,
            },
          },
          pageSize: PAGE_SIZE,
          pageToken: pageToken,
        }),
      },
    )

    const responseJson = await response.json()
    const responseTyped = responseJson.places as GooglePlaceDto[]

    const hasNextPage = (responseTyped?.length || 0) >= PAGE_SIZE
    const nextPageToken = responseJson?.nextPageToken as string
    // Filter based on types

    const filteredData = responseTyped.filter(
      place => place.userRatingCount > 3,
    )

    return {
      places: filteredData.map(data => ({
        ...data,
        dist_meters: haversine(
          [location.lat, location.lng],
          [data.location.latitude, data.location.longitude],
        ),
      })),
      nextPageToken: hasNextPage ? nextPageToken : nextPageToken ?? null,
    }
  } catch (error: any) {
    throw new Error(error)
  }
}

type RQPageParam = string | null

export function useListGooglePlacesQuery({
  textQuery,
  location,
}: {
  textQuery: string
  location: Coords | null
}) {
  const lastPageCountRef = useRef(0)
  const query = useInfiniteQuery({
    queryKey: ['places-list', textQuery, location],
    queryFn: async ({pageParam}) => {
      const data = await searchGooglePlacesRepairShop({
        textQuery,
        location,
        pageToken: pageParam,
      })
      return data
    },
    initialPageParam: null as RQPageParam,
    getNextPageParam: lastPage => lastPage.nextPageToken,
  })

  useEffect(() => {
    const {isFetching, hasNextPage, data} = query
    if (isFetching || !hasNextPage) {
      return
    }
    // avoid double fires of fetchNextPage()
    if (
      lastPageCountRef.current !== 0 &&
      lastPageCountRef.current === data?.pages?.length
    ) {
      return
    }

    // fetch next page if we haven't gotten a full page of content
    let count = 0
    for (const page of data?.pages || []) {
      count += page.places.length
    }
    if (count < PAGE_SIZE && (data?.pages.length || 0) < 6) {
      query.fetchNextPage()
      lastPageCountRef.current = data?.pages?.length || 0
    }
  }, [query])

  return query
}
