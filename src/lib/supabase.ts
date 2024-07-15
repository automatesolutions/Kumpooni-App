import { MMKV } from 'react-native-mmkv'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from 'react-native-dotenv'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Database } from '#/types/supabase'

// const storage = new MMKV({ id: 'supabase-storage' })

// const mmkvStorageConfig = {
//   setItem: (key: string, data: any) => storage.set(key, data),
//   getItem: (key: string) => storage.getString(key),
//   removeItem: (key: string) => storage.delete(key),
// }

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      storage: AsyncStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  },
)
