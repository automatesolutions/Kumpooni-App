import React from 'react'
import type {Session} from '@supabase/supabase-js'
import {useQueryClient} from '@tanstack/react-query'
import {supabase} from '@/lib/supabase'
import {useCartStore} from '@/stores/cart'
import {useShopCartStore} from '@/stores/shop-cart'
import {useVehicleStore} from '@/stores/vehicle'

type SessionContext = {
  session: Session | null
  isLoading: boolean
  /** True for an old guest session (Supabase anonymous sign-in). Guests must sign in with Google. */
  isGuest: boolean
  /**
   * Leaves for Google, then comes back to /auth/callback. A guest keeps their files,
   * because Google is linked to the guest account instead of starting a new one.
   */
  signInWithGoogle: (next: string, opts?: {fresh?: boolean}) => Promise<void>
  /** Sends a one-time code by SMS. `phone` includes the country code, for example 639171234567. */
  sendCode: (phone: string) => Promise<void>
  verifyCode: (phone: string, code: string) => Promise<Session>
  signOut: () => Promise<void>
}

/** Where to go after Google sends you back. Read by the /auth/callback page. */
export const NEXT_KEY = 'kumpooni.auth.next'

const Context = React.createContext<SessionContext | null>(null)

export function SessionProvider({children}: React.PropsWithChildren) {
  const [session, setSession] = React.useState<Session | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const queryClient = useQueryClient()

  React.useEffect(() => {
    supabase.auth
      .getSession()
      .then(({data}) => setSession(data.session))
      .finally(() => setIsLoading(false))

    const {data} = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setIsLoading(false)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const value = React.useMemo<SessionContext>(
    () => ({
      session,
      isLoading,
      isGuest: !!session?.user.is_anonymous,
      signInWithGoogle: async (next, opts) => {
        // Supabase only accepts redirect URLs on its allow list, and a query string breaks an exact match.
        // So the return URL stays plain, and the page to open next waits in this tab's storage.
        const redirectTo = `${window.location.origin}/auth/callback`
        try {
          sessionStorage.setItem(NEXT_KEY, next)
        } catch {
          // Storage is blocked. The callback falls back to Repairs.
        }
        const signIn = () => supabase.auth.signInWithOAuth({provider: 'google', options: {redirectTo}})
        let {error} =
          session?.user.is_anonymous && !opts?.fresh
            ? await supabase.auth.linkIdentity({provider: 'google', options: {redirectTo}})
            : await signIn()
        // Linking keeps a guest's files, but needs Manual linking on in Supabase.
        // When it's off, sign in normally. The guest files stay behind.
        if (error?.code === 'manual_linking_disabled') ({error} = await signIn())
        if (error) throw new Error(`We couldn't open Google sign-in. ${error.message}`)
      },
      sendCode: async phone => {
        const {error} = await supabase.auth.signInWithOtp({phone})
        if (error) throw new Error(`We couldn't send the code. ${error.message}`)
      },
      verifyCode: async (phone, token) => {
        const {data, error} = await supabase.auth.verifyOtp({phone, token, type: 'sms'})
        if (error || !data.session) {
          throw new Error(
            error?.message?.match(/expired|invalid/i)
              ? 'That code is wrong or has expired. Check it, or send a new one.'
              : `We couldn't sign you in. ${error?.message ?? ''}`.trim(),
          )
        }
        return data.session
      },
      signOut: async () => {
        await supabase.auth.signOut()
        useCartStore.getState().clear()
        useShopCartStore.getState().clear()
        useVehicleStore.getState().select(null)
        queryClient.clear()
        setSession(null)
      },
    }),
    [session, isLoading, queryClient],
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useSession() {
  const ctx = React.useContext(Context)
  if (!ctx) throw new Error('useSession must be used inside SessionProvider')
  return ctx
}

export function useUserId() {
  return useSession().session?.user.id ?? ''
}
