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
  /** True for a guest session (Supabase anonymous sign-in). */
  isGuest: boolean
  /** Starts a guest session so you can try files without a phone. */
  tryAsGuest: () => Promise<Session>
  /** Sends a one-time code by SMS. `phone` includes the country code, for example 639171234567. */
  sendCode: (phone: string) => Promise<void>
  verifyCode: (phone: string, code: string) => Promise<Session>
  signOut: () => Promise<void>
}

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
      tryAsGuest: async () => {
        const {data, error} = await supabase.auth.signInAnonymously()
        if (error || !data.session) {
          throw new Error(
            error?.message?.match(/anonymous/i)
              ? 'Turn on Anonymous in Supabase: Authentication, Sign In / Providers. Then try again.'
              : `We couldn't start a guest session. ${error?.message ?? ''}`.trim(),
          )
        }
        return data.session
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
