import {Navigate, Outlet, useLocation} from 'react-router-dom'
import {useSession} from '@/state/session'
import {Spinner} from './ui'

/** Repairs and Account need a Google sign-in. Everyone else goes to the sign-in page first. */
export function RequireAuth() {
  const {session, isLoading, isGuest} = useSession()
  const location = useLocation()

  if (isLoading) return <Spinner />
  if (!session || isGuest) {
    const next = location.pathname + location.search
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />
  }
  return <Outlet />
}

export function safeNext(next: string | null, fallback = '/') {
  // Only allow paths inside this app.
  return next && next.startsWith('/') && !next.startsWith('//') ? next : fallback
}
