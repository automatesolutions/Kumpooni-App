function env(name: 'VITE_SUPABASE_URL' | 'VITE_SUPABASE_ANON_KEY' | 'VITE_GOOGLE_MAPS_KEY') {
  const raw = import.meta.env[name]
  if (typeof raw !== 'string') return undefined
  const value = raw.trim()
  return value || undefined
}

export const SUPABASE_URL = env('VITE_SUPABASE_URL')
export const SUPABASE_ANON_KEY = env('VITE_SUPABASE_ANON_KEY')
export const GOOGLE_MAPS_KEY = env('VITE_GOOGLE_MAPS_KEY')

export const IS_CONFIGURED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
export const MISSING_ENV = [
  !SUPABASE_URL ? 'VITE_SUPABASE_URL' : '',
  !SUPABASE_ANON_KEY ? 'VITE_SUPABASE_ANON_KEY' : '',
].filter(Boolean)
export const HAS_MAPS = Boolean(GOOGLE_MAPS_KEY)

// Store used for "OrderDelivery" services, as in the mobile app.
export const DELIVERY_STORE = {
  id: '5fb344c6-f65c-444f-8aa5-2396508356fd',
  name: 'Auto-Mate',
}

export const APP_VERSION = '0.1.0'
