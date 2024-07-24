import axios from 'axios'
import {useQuery} from '@tanstack/react-query'
import {GOOGLE_MAP_KEY} from 'react-native-dotenv'
import {logger} from '#/logger'
import {GeocodingResponse, GeocodingResult} from '#/types'
import {STALE} from '..'
import {Coords} from '#/types/automate'

class CannotFetchError extends Error {}

export const getReverseGeocoding = async (coords: Coords | null) => {
  if (!coords) return null
  const latLong = `${coords.lat},${coords.lng}`
  const apiUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latLong}&result_type=street_address&key=${GOOGLE_MAP_KEY}`
  const response = await axios.get<GeocodingResponse>(apiUrl)
  logger.debug('useReverseGeocoding', {data: response.data})
  if (response.data.status !== 'OK') {
    throw new CannotFetchError('Couldn\t fetch location')
  }

  return response.data.results[0]
}

export const useReverseGeoCode = ({
  lat,
  lng,
}: Coords): Promise<GeocodingResult | null> => {
  return new Promise(resolve => {
    return axios({
      method: 'get',
      url: `https://maps.googleapis.com/maps/api/geocode/json`,
      params: {
        latlng: `${lat},${lng}`,
        result_type:
          'street_address|administrative_area_level_1|administrative_area_level_2',
        key: GOOGLE_MAP_KEY,
      },
    }).then(response => {
      const result: GeocodingResult = response.data.results[0]
      // console.log('Result', result)
      if (!result) {
        return resolve(null)
      }
      resolve(result)
    })
  })
}
export function useReverseGeocoding(location: Coords | null) {
  return useQuery({
    staleTime: STALE.INFINITY,
    queryKey: ['userLocation', location],
    queryFn: async () => await getReverseGeocoding(location),
    retry: 1,
  })
}
// async function getNearbyRepairShops(location: Coords | null) {
//   if (!location) throw new Error('Missing location fields')
//   if (!GOOGLE_MAP_KEY) {
//     throw new Error('Missing Google API Key')
//   }

//   const headers = {
//     'Content-Type': 'application/json',
//     'X-Goog-Api-Key': GOOGLE_MAP_KEY,
//     'X-Goog-FieldMask':
//       'places.id,places.displayName,places.shortFormattedAddress,places.types,places.googleMapsUri',
//   }

//   const acceptableTypes = ['bar', 'restaurant', 'food']

//   try {
//     const response = await fetch(
//       'https://places.googleapis.com/v1/places:searchNearby',
//       {
//         method: 'POST',
//         headers: headers,
//         body: JSON.stringify({
//           languageCode: 'en',
//           textQuery: query,
//           // New York City
//           locationRestriction: {
//             rectangle: {
//               low: {
//                 latitude: 40.477398,
//                 longitude: -74.259087,
//               },
//               high: {
//                 latitude: 40.91618,
//                 longitude: -73.70018,
//               },
//             },
//           },
//           maxResultCount: 15,
//         }),
//       },
//     )

//     const responseJson = await response.json()
//     const responseTyped = responseJson.places as GooglePlaceDto[]

//     const filteredData = responseTyped.filter(place => {
//       return place.types.some(type => acceptableTypes.includes(type))
//     })

//     return filteredData.map(
//       place =>
//         new GooglePlaceDto({
//           id: place.id,
//           displayName: place.displayName,
//           googleMapsUri: place.googleMapsUri,
//           shortFormattedAddress: place.shortFormattedAddress,
//           types: place.types,
//         }),
//     )
//   } catch (error) {
//     throw new Error(error)
//   }
// }

// export function useGooglePlacesQuery(location: Coords | null) {
//   return useQuery({
//     queryKey: ['nearby-repairs'],
//     queryFn: async () => await getNearbyRepairShops(location),
//   })
// }
