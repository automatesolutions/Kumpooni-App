import React from 'react'
import {Link, Navigate, useNavigate, useSearchParams} from 'react-router-dom'
import {useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import {NEXT_KEY, useSession} from '@/state/session'
import {hasCompleteProfile, profileSchema, useUpdateProfileMutation, type ProfileForm} from '@/state/queries/profile'
import {errorMessage} from '@/lib/format'
import {Alert, Button, Spinner} from '@/components/ui'
import {BrandGoogle} from '@/components/icons'
import {safeNext} from '@/components/RequireAuth'

function AuthCard({children}: React.PropsWithChildren) {
  return (
    <div className="container page" style={{maxWidth: 460}}>
      <div className="card card--pad stack" style={{padding: 'var(--space-8)', gap: 'var(--space-5)'}}>
        <img src="/images/kumpooni-logo.png" alt="Kumpooni" width={180} style={{alignSelf: 'center'}} />
        {children}
      </div>
    </div>
  )
}

export function LoginPage() {
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'), '/files')
  const {session, isGuest, signInWithGoogle} = useSession()
  const [error, setError] = React.useState('')
  const [busy, setBusy] = React.useState(false)

  if (session && !isGuest) return <Navigate to={next} replace />

  const google = async () => {
    setError('')
    setBusy(true)
    try {
      await signInWithGoogle(next)
      // The browser now leaves for Google, so keep the spinner on.
    } catch (e) {
      setError(errorMessage(e))
      setBusy(false)
    }
  }

  return (
    <AuthCard>
      <div>
        <h1 style={{fontSize: 'var(--text-xl)'}}>Sign in to Kumpooni</h1>
        <p className="muted" style={{marginTop: 'var(--space-2)'}}>
          Sign in to see your repairs. Your files stay safe and open on any phone or computer.
        </p>
      </div>
      {error && <Alert>{error}</Alert>}
      <Button type="button" size="lg" block loading={busy} onClick={google}>
        <BrandGoogle size={20} aria-hidden />
        Continue with Google
      </Button>
      <p className="small muted" style={{textAlign: 'center'}}>
        By continuing you accept the{' '}
        <Link className="link" to="/terms">
          terms
        </Link>{' '}
        and the{' '}
        <Link className="link" to="/privacy">
          privacy policy
        </Link>
        .
      </p>
    </AuthCard>
  )
}

/** Google sends people back here. Go on to the page they wanted, or ask their name first. */
export function AuthCallbackPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [next] = React.useState(() => {
    try {
      return safeNext(sessionStorage.getItem(NEXT_KEY), '/files')
    } catch {
      return '/files'
    }
  })
  const {session, isLoading, signInWithGoogle} = useSession()
  const [failed] = React.useState(() => readAuthError(params))
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    if (failed || isLoading || !session || session.user.is_anonymous) return
    let live = true
    hasCompleteProfile(session.user.id).then(complete => {
      if (live) navigate(complete ? next : `/welcome?next=${encodeURIComponent(next)}`, {replace: true})
    })
    return () => {
      live = false
    }
  }, [failed, isLoading, session, next, navigate])

  // Still swapping the code for a session.
  if (!failed && (isLoading || (session && !session.user.is_anonymous))) return <Spinner />

  const taken = failed?.code === 'identity_already_exists' || /already linked/i.test(failed?.message ?? '')

  const retry = async () => {
    setError('')
    setBusy(true)
    try {
      await signInWithGoogle(next, {fresh: taken})
    } catch (e) {
      setError(errorMessage(e))
      setBusy(false)
    }
  }

  return (
    <AuthCard>
      <div>
        <h1 style={{fontSize: 'var(--text-xl)'}}>{taken ? 'You already have an account' : "We couldn't sign you in"}</h1>
        <p className="muted" style={{marginTop: 'var(--space-2)'}}>
          {taken
            ? 'This Google account already has Kumpooni files. If you sign in to it, the files you made while trying the app stay behind.'
            : failed?.message || 'Google sign-in did not finish. Try again.'}
        </p>
      </div>
      {error && <Alert>{error}</Alert>}
      <Button type="button" size="lg" block loading={busy} onClick={retry}>
        <BrandGoogle size={20} aria-hidden />
        {taken ? 'Sign in to that account' : 'Try Google again'}
      </Button>
      <Link to="/" className="btn btn--secondary btn--lg">
        Back to Home
      </Link>
    </AuthCard>
  )
}

/** Supabase puts OAuth errors in the query string, or in the hash for older flows. */
function readAuthError(query: URLSearchParams) {
  const hash = new URLSearchParams(window.location.hash.slice(1))
  const pick = (key: string) => query.get(key) ?? hash.get(key)
  const code = pick('error_code') ?? pick('error')
  if (!code) return null
  return {code, message: pick('error_description') ?? ''}
}

export function VerifyPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const phone = params.get('phone') ?? ''
  const next = safeNext(params.get('next'))
  const {verifyCode, sendCode} = useSession()
  const [code, setCode] = React.useState('')
  const [error, setError] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [countdown, setCountdown] = React.useState(60)

  React.useEffect(() => {
    if (countdown <= 0) return
    const t = window.setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => window.clearTimeout(t)
  }, [countdown])

  const verify = React.useCallback(
    async (value: string) => {
      setBusy(true)
      setError('')
      try {
        const session = await verifyCode(phone, value)
        const complete = await hasCompleteProfile(session.user.id)
        navigate(complete ? next : `/welcome?next=${encodeURIComponent(next)}`, {replace: true})
      } catch (e) {
        setError(errorMessage(e))
        setCode('')
      } finally {
        setBusy(false)
      }
    },
    [phone, next, verifyCode, navigate],
  )

  if (!phone) return <Navigate to="/login" replace />

  const display = `+${phone.slice(0, 2)} ${phone.slice(2, 5)} ${phone.slice(5, 8)} ${phone.slice(8)}`

  return (
    <AuthCard>
      <div>
        <h1 style={{fontSize: 'var(--text-xl)'}}>Enter the code</h1>
        <p className="muted" style={{marginTop: 'var(--space-2)'}}>
          We sent a 6-digit code to <span className="strong num">{display}</span>.{' '}
          <Link to={`/login?next=${encodeURIComponent(next)}`} className="link">
            Change number
          </Link>
        </p>
      </div>
      <form
        className="stack"
        onSubmit={e => {
          e.preventDefault()
          if (code.length === 6) verify(code)
        }}>
        <div className="field">
          <label className="label" htmlFor="otp">
            Verification code
          </label>
          <input
            id="otp"
            className="input otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            autoFocus
            value={code}
            aria-invalid={!!error}
            onChange={e => {
              const v = e.target.value.replace(/\D/g, '').slice(0, 6)
              setCode(v)
              if (v.length === 6 && !busy) verify(v)
            }}
          />
        </div>
        {error && <Alert>{error}</Alert>}
        <Button type="submit" size="lg" block loading={busy} disabled={code.length !== 6}>
          Verify and sign in
        </Button>
      </form>
      <p className="small muted" style={{textAlign: 'center'}} aria-live="polite">
        {countdown > 0 ? (
          <>Didn't get it? You can send a new code in {countdown}s.</>
        ) : (
          <button
            type="button"
            className="link"
            style={{minHeight: 'var(--tap)'}}
            onClick={async () => {
              setError('')
              try {
                await sendCode(phone)
                setCountdown(60)
              } catch (e) {
                setError(errorMessage(e))
              }
            }}>
            Send a new code
          </button>
        )}
      </p>
    </AuthCard>
  )
}

export function WelcomePage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))
  const {session} = useSession()
  const update = useUpdateProfileMutation()
  const {
    register,
    handleSubmit,
    formState: {errors},
  } = useForm<ProfileForm>({resolver: zodResolver(profileSchema), defaultValues: namesFromGoogle(session?.user.user_metadata)})

  const onSubmit = handleSubmit(values => {
    update.mutate(
      {id: session!.user.id, changes: values},
      {
        onSuccess: () => {
          const after = next === '/' ? '/files/new' : next
          navigate(`/account/vehicles/new?next=${encodeURIComponent(after)}&welcome=1`)
        },
      },
    )
  })

  return (
    <AuthCard>
      <div>
        <h1 style={{fontSize: 'var(--text-xl)'}}>What's your name?</h1>
        <p className="muted" style={{marginTop: 'var(--space-2)'}}>
          It goes on your job slips and letters. You can change it on each one.
        </p>
      </div>
      <form className="stack" onSubmit={onSubmit} noValidate>
        <div className="field">
          <label className="label" htmlFor="first_name">
            First name
          </label>
          <input
            id="first_name"
            className="input"
            autoComplete="given-name"
            autoFocus
            aria-invalid={!!errors.first_name}
            {...register('first_name')}
          />
          {errors.first_name && <p className="error-text">{errors.first_name.message}</p>}
        </div>
        <div className="field">
          <label className="label" htmlFor="last_name">
            Last name
          </label>
          <input
            id="last_name"
            className="input"
            autoComplete="family-name"
            aria-invalid={!!errors.last_name}
            {...register('last_name')}
          />
          {errors.last_name && <p className="error-text">{errors.last_name.message}</p>}
        </div>
        {update.error && <Alert>{errorMessage(update.error)}</Alert>}
        <Button type="submit" size="lg" block loading={update.isPending}>
          Continue
        </Button>
      </form>
    </AuthCard>
  )
}

/** Google gives one full name. Guess first and last so the form is filled in, and let people fix it. */
function namesFromGoogle(meta: Record<string, unknown> | undefined): Partial<ProfileForm> {
  const full = String(meta?.full_name ?? meta?.name ?? '').trim()
  if (!full) return {}
  const parts = full.split(/\s+/)
  if (parts.length === 1) return {first_name: parts[0]}
  return {first_name: parts.slice(0, -1).join(' '), last_name: parts[parts.length - 1]}
}
