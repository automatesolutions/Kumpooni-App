import {haversine} from '#/lib/geo/haversine'
import {Coords, GooglePlaceDto} from '#/types/automate'
import {useQuery} from '@tanstack/react-query'

import {GOOGLE_MAP_KEY} from 'react-native-dotenv'
import {STALE} from '..'

const RQKEY = (args: {location: Coords | null; query: string}) => [
  'list-parts',
  args,
]

const PAGE_SIZE = 20

const fetchPartsShops = async ({
  query,
  location,
  pageToken = null,
}: {
  query: string
  location: Coords | null
  pageToken?: string | null
}) => {
  if (!location) throw new Error('Missing location fields')
  if (!GOOGLE_MAP_KEY) {
    throw new Error('Missing Google API Key')
  }

  const headers = {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': GOOGLE_MAP_KEY,
    'X-Goog-FieldMask':
      'places.id,places.regularOpeningHours,places.nationalPhoneNumber,places.internationalPhoneNumber,places.userRatingCount,places.displayName,places.location,places.photos,places.shortFormattedAddress,places.types,places.googleMapsUri,places.rating,nextPageToken',
  }

  try {
    const response = await fetch(
      'https://places.googleapis.com/v1/places:searchText',
      {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          languageCode: 'en',
          textQuery: query,
          strictTypeFiltering: true,
          minRating: 3.0,
          includedType: 'auto_parts_store',
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

    return {
      places: responseTyped.map(data => ({
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
export function useListPartShopQuery({
  query,
  location,
}: {
  query: string
  location: Coords | null
}) {
  return useQuery({
    queryKey: RQKEY({query, location}),
    queryFn: async () => {
      const data = await fetchPartsShops({location, query})
      return data.places ?? []
    },
    staleTime: STALE.INFINITY,
  })
}
