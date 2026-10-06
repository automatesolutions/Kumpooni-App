import React from 'react'
import {Link, Navigate, useNavigate, useSearchParams} from 'react-router-dom'
import {useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import {useSession} from '@/state/session'
import {hasCompleteProfile, profileSchema, useUpdateProfileMutation, type ProfileForm} from '@/state/queries/profile'
import {errorMessage} from '@/lib/format'
import {Alert, Button} from '@/components/ui'
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
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'), '/files/new')
  const {session, tryAsGuest} = useSession()
  const [error, setError] = React.useState('')
  const [busy, setBusy] = React.useState(false)

  if (session) return <Navigate to={next} replace />

  const start = async () => {
    setError('')
    setBusy(true)
    try {
      await tryAsGuest()
      navigate(next, {replace: true})
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthCard>
      <div>
        <h1 style={{fontSize: 'var(--text-xl)'}}>Try the app</h1>
        <p className="muted" style={{marginTop: 'var(--space-2)'}}>
          No phone or password. Open a repair file, add a visit, and see the letter and map.
        </p>
      </div>
      {error && <Alert>{error}</Alert>}
      <Button type="button" size="lg" block loading={busy} onClick={start}>
        Start without an account
      </Button>
      <p className="xsmall muted" style={{textAlign: 'center'}}>
        Phone sign-in comes later. For now this is so you can see how it works.
      </p>
    </AuthCard>
  )
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
  } = useForm<ProfileForm>({resolver: zodResolver(profileSchema)})

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
