import React from 'react'
import {Link, Outlet} from 'react-router-dom'
import {useSession} from '@/state/session'
import {Alert, Spinner} from './ui'

/** Starts a guest session when needed, so you can try files without a phone. */
export function RequireAuth() {
  const {session, isLoading, tryAsGuest} = useSession()
  const [error, setError] = React.useState('')
  const started = React.useRef(false)

  React.useEffect(() => {
    if (isLoading || session || started.current) return
    started.current = true
    tryAsGuest().catch(e => setError(e instanceof Error ? e.message : 'We could not start a guest session.'))
  }, [isLoading, session, tryAsGuest])

  if (isLoading || (!session && !error)) return <Spinner />
  if (error) {
    return (
      <div className="container page" style={{maxWidth: 460}}>
        <div className="card card--pad stack">
          <h1 style={{fontSize: 'var(--text-xl)'}}>Turn on guest sign-in</h1>
          <Alert>{error}</Alert>
          <p className="muted small">
            In Supabase open Authentication, then Sign In / Providers. Enable Anonymous. Refresh this page.
          </p>
          <Link to="/" className="btn btn--secondary">
            Back to Home
          </Link>
        </div>
      </div>
    )
  }
  return <Outlet />
}

export function safeNext(next: string | null, fallback = '/') {
  // Only allow paths inside this app.
  return next && next.startsWith('/') && !next.startsWith('//') ? next : fallback
}
