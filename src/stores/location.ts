import {create} from 'zustand'
// import { AddressItem } from '../types/automate'
import {createJSONStorage, persist} from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Geolocation from 'react-native-geolocation-service'
import {haversine} from '#/lib/geo/haversine'
import {logger} from '#/logger'

import {Coords} from '#/types/automate'
import {useLocationPermission} from '#/components/hooks/usePermission'
import {useReverseGeoCode} from '#/state/queries/geo'

export type Address = {
  formatted_address: string
  main_text: string
  secondary_text: string
}
interface LocationStore {
  isLoading: boolean
  location: Coords | null
  address: Address | null
  setLocation: (location: Coords | null) => void
  setIsLoading: (isLoading: boolean) => void
  setLocationAndAddress: (location: Coords, address: Address) => void
  getCurrentLocation: () => Promise<boolean>
  clearLocation: () => void
}

export const useLocationStore = create(
  persist<LocationStore>(
    (set, get) => ({
      isLoading: false,
      setIsLoading: isLoading => set({isLoading}),
      location: null,
      address: null,
      setLocation: (location: Coords | null) => {
        set({location, isLoading: false})
        return
      },
      setLocationAndAddress: (location: Coords, address: Address) => {
        set({location, address})
      },
      getCurrentLocation: async () => {
        const {requestLocationAccessIfNeeded} = useLocationPermission()
        const hasLocationPermission = await requestLocationAccessIfNeeded()
        console.log('hasLocationPermission', hasLocationPermission)
        set({isLoading: true})
        const lastLocation = get().location
        if (hasLocationPermission) {
          return new Promise(resolve => {
            Geolocation.getCurrentPosition(
              async position => {
                const {latitude, longitude} = position.coords

                if (
                  lastLocation &&
                  haversine(
                    [latitude, longitude],
                    [lastLocation.lat, lastLocation.lng],
                  ) <= 5
                ) {
                  logger.debug(
                    'getCurrentLocation is within 5km range no update happen',
                  )
                  set({isLoading: false})
                  resolve(true)
                }
                console.log('cooridnates', {latitude, longitude})
                useReverseGeoCode({lat: latitude, lng: longitude})
                  .then(result => {
                    if (result) {
                      const [main_text, ...rest] =
                        result.formatted_address.split(',')
                      logger.debug('Setting state in useReverseGeoCode')
                      set({
                        location: {lat: latitude, lng: longitude},
                        address: {
                          formatted_address: result.formatted_address,
                          main_text: main_text,
                          secondary_text: rest.join('') ?? '',
                        },
                        isLoading: false,
                      })
                      resolve(true)
                    }
                  })
                  .catch(error => {
                    logger.error('useReverseCoder Error: ', error)
                  })
              },
              error => {
                logger.error('GeoCode Error:', {message: error})
                set({isLoading: false})
                resolve(false)
              },
              {
                accuracy: {
                  android: 'high',
                  ios: 'best',
                },
                enableHighAccuracy: true,
                maximumAge: 15000,
                timeout: 15000,
                distanceFilter: 0,
                forceRequestLocation: true,
                forceLocationManager: false,
                showLocationDialog: true,
              },
            )
          })
        }
        logger.debug('Nothing happen')
        return false
      },
      clearLocation: () => set({location: null, address: null}),
    }),
    {
      name: 'location-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
)
