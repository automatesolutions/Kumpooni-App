import React, { useCallback } from 'react'
import { AuthError, AuthResponse, Session } from '@supabase/supabase-js'
import * as persisted from 'state/persisted'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '#/lib/supabase'
import { logger } from '#/logger'
import { useLoggedOutViewControls } from '../shell/logged-out'

export type SessionState = {
  isInitialLoad: boolean
  session: Session | null
}
type StateContext = SessionState & {
  hasSession: boolean
}

const StateContext = React.createContext<StateContext>({
  isInitialLoad: true,
  session: null,
  hasSession: false,
})

export type ApiContext = {
  createAccount: (props: {}) => Promise<void>
  loginWithPhone: (phone: string) => Promise<void>
  logout: () => Promise<void>
}

const ApiContext = React.createContext<ApiContext>({
  createAccount: async () => {},
  loginWithPhone: async () => {},
  logout: async () => {},
})

export function Provider({ children }: React.PropsWithChildren<{}>) {
  const [state, setState] = React.useState<SessionState>({
    isInitialLoad: true,
    session: null, // assume logged out to start
  })
  const [error, setError] = React.useState<AuthError | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  const createAccount = useCallback<
    ApiContext['createAccount']
  >(async () => {}, [])

  const loginWithPhone = useCallback<ApiContext['loginWithPhone']>(
    async phone => {
      try {
        await supabase.auth.signInWithOtp({ phone })
      } catch (error) {
        throw new Error('Failed to login with your phone number')
      }
    },
    [supabase],
  )

  const logout = useCallback<ApiContext['logout']>(async () => {
    try {
      await supabase.auth.signOut()
      setState(prev => ({ ...prev, session: null }))
    } catch (error) {
      throw new Error('Failed to logout')
    }
  }, [supabase])

  const stateContext = React.useMemo(
    () => ({
      ...state,
      hasSession: !!state.session,
    }),
    [state],
  )
  const api = React.useMemo(
    () => ({ createAccount, loginWithPhone, logout }),
    [createAccount, loginWithPhone, logout],
  )

  React.useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        logger.debug('setting state in getSession')
        setState(s => ({
          ...s,
          session,
          isInitialLoad: false,
        }))
      })
      .catch(error => {
        logger.error('Error: ', error)
        setError(new AuthError(error.message))
      })
      .finally(() => setIsLoading(false))
  }, [setState])

  React.useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      logger.debug('setting state in AuthStateChange', {
        event: _event,
        data: session,
      })
      setState(s => ({
        ...s,
        session,
        isInitialLoad: false,
      }))
    })
    return () => {
      subscription.unsubscribe()
    }
  }, [setState])
  return (
    <StateContext.Provider value={stateContext}>
      <ApiContext.Provider value={api}>{children}</ApiContext.Provider>
    </StateContext.Provider>
  )
}

export function useSession() {
  return React.useContext(StateContext)
}

export function useSessionApi() {
  return React.useContext(ApiContext)
}

export function useRequireAuth() {
  const { hasSession } = useSession()
  const { setShowLoggedOut } = useLoggedOutViewControls()

  return React.useCallback(
    (fn: () => void) => {
      if (hasSession) {
        fn()
      } else {
        setShowLoggedOut(true)
      }
    },
    [hasSession, setShowLoggedOut],
  )
}
