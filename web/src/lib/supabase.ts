import {createClient} from '@supabase/supabase-js'
import type {AppDatabase} from '@/types/repair-proof'
import {SUPABASE_ANON_KEY, SUPABASE_URL} from './env'

// When the env is missing, App renders a setup screen and never calls this
// client, so the placeholder values are never used for requests.
export const supabase = createClient<AppDatabase>(
  SUPABASE_URL || 'http://localhost',
  SUPABASE_ANON_KEY || 'missing-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  },
)
