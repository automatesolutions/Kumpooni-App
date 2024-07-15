import { MMKV } from 'react-native-mmkv'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'

import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProviderProps } from '@tanstack/react-query-persist-client'
import AsyncStorage from '@react-native-async-storage/async-storage'

// any query keys in this array will be persisted to AsyncStorage
const STORED_CACHE_QUERY_KEYS = ['cache-storage']

export const cacheStorage = new MMKV({ id: STORED_CACHE_QUERY_KEYS[0] })

const ONE_DAY = 1000 * 60 * 60 * 24
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      structuralSharing: false,
      retry: false,
    },
  },
})

// export const persistedQueryStorage = {
//   setItem(key: string, value: string) {
//     cacheStorage.set(key, value)
//   },
//   getItem(key: string) {
//     const value = cacheStorage.getString(key)
//     return value === undefined ? null : value
//   },
//   removeItem(key: string) {
//     cacheStorage.delete(key)
//   },
// }

export const asyncStoragePersister = createAsyncStoragePersister({
  key: 'queryCache',
  storage: AsyncStorage,
})

export const dehydrateOptions: PersistQueryClientProviderProps['persistOptions']['dehydrateOptions'] =
  {
    shouldDehydrateMutation: (_: any) => false,
    shouldDehydrateQuery: query => {
      return STORED_CACHE_QUERY_KEYS.includes(String(query.queryKey[0]))
    },
  }
