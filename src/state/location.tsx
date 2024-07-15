// import { Address, Coords } from '#/types/automate'

// import React, { useCallback } from 'react'
// import * as persisted from '#/state/persisted'
// import Geolocation from 'react-native-geolocation-service'
// import { haversine } from '#/lib/geo/haversine'
// import { logger } from '#/logger'
// import { af } from 'date-fns/locale'
// import { boolean } from 'zod'
// import { useReverseGeoCode } from '#/queries/geo'
// type LocationState = {
//   geo: Coords | undefined
//   address: Address | undefined
// }
// type StateContext = LocationState & {
//   isLoading: boolean
// }
// type ApiContext = {
//   getCurrentLocation: () => Promise<void>
// }

// const stateContext = React.createContext<StateContext>({
//   geo: undefined,
//   address: undefined,
//   isLoading: false,
// })
// const apiContext = React.createContext<ApiContext>({
//   getCurrentLocation: async () => {},
// })

// export function Provider({ children }: React.PropsWithChildren<{}>) {
//   const [state, setState] = React.useState<StateContext>({
//     address: persisted.get('location').address,
//     geo: persisted.get('location').geo,
//     isLoading: false,
//   })
//   const getCurrentLocation = useCallback(async () => {
//     setState(s => ({ ...s, isLoading: true }))
//     const lastGeoLocation = persisted.get('location')?.geo
//     return new Promise(resolve => {
//       Geolocation.getCurrentPosition(
//         position => {
//           const { latitude, longitude } = position.coords

//           if (
//             lastGeoLocation &&
//             haversine(
//               [latitude, longitude],
//               [lastGeoLocation.lat, lastGeoLocation.lng],
//             ) <= 5
//           ) {
//             logger.debug(
//               'getCurrentLocation is within 5km range no update happen',
//             )
//             setState(state => ({ ...state, isLoading: false }))
//           }

//           useReverseGeoCode({ lat: latitude, lng: longitude }).then(result => {
//             if (result) {
//               const [main_text, ...rest] = result.formatted_address.split(',')
//               setState({
//                 geo: { lat: latitude, lng: longitude },
//                 address: {
//                   formatted_address: result.formatted_address,
//                   main_text: main_text,
//                   secondary_text: rest.join('') ?? '',
//                 },
//                 isLoading: false,
//               })
//             }
//           })
//         },
//         error => {
//           setState(state => ({ ...state, isLoading: false }))
//         },
//         {
//           accuracy: {
//             android: 'high',
//             ios: 'best',
//           },
//           enableHighAccuracy: true,
//           maximumAge: 15000,
//           timeout: 15000,
//           distanceFilter: 0,
//           forceRequestLocation: true,
//           forceLocationManager: false,
//           showLocationDialog: true,
//         },
//       )
//     })
//   }, [setState])
//   const api = React.useMemo(
//     () => ({
//       getCurrentLocation,
//     }),
//     [getCurrentLocation],
//   )

//   React.useEffect(() => {
//     return persisted.onUpdate(() => {
//       setState(s => ({
//         ...s,
//         ...persisted.get('location'),
//       }))
//     })
//   }, [setState])
//   return (
//     <stateContext.Provider value={state}>
//       <apiContext.Provider value={api}>{children}</apiContext.Provider>
//     </stateContext.Provider>
//   )
// }
