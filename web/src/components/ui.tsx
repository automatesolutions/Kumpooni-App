import React from 'react'
import {Link} from 'react-router-dom'
import {AlertCircle, Check, ChevronLeft, Minus, Plus, Star, X} from '@/components/icons'
import {errorMessage} from '@/lib/format'
import {statusLabel} from '@/lib/constants'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  block?: boolean
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  block,
  loading,
  className = '',
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const cls = [
    'btn',
    `btn--${variant}`,
    size !== 'md' && `btn--${size}`,
    block && 'btn--block',
    className,
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <button className={cls} disabled={disabled || loading} aria-busy={loading} {...rest}>
      {loading && <span className="spinner" aria-hidden />}
      {children}
    </button>
  )
}

export function Spinner({label = 'Loading'}: {label?: string}) {
  return (
    <div className="center-load" role="status">
      <span className="spinner spinner--lg" aria-hidden />
      <span className="visually-hidden">{label}</span>
    </div>
  )
}

export function Skeleton({
  height = 16,
  width = '100%',
  radius,
  style,
}: {
  height?: number | string
  width?: number | string
  radius?: number | string
  style?: React.CSSProperties
}) {
  return <div className="skel" aria-hidden style={{height, width, borderRadius: radius, ...style}} />
}

export function CardSkeletons({count = 6, height = 120}: {count?: number; height?: number}) {
  return (
    <div className="grid grid--cards" role="status" aria-label="Loading">
      {Array.from({length: count}).map((_, i) => (
        <Skeleton key={i} height={height} radius="var(--radius-md)" />
      ))}
    </div>
  )
}

export function EmptyState({
  image,
  icon,
  title,
  children,
  action,
}: {
  image?: string
  icon?: React.ReactNode
  title: string
  children?: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="empty">
      {image ? (
        <img src={image} alt="" />
      ) : icon ? (
        <div className="empty__icon" aria-hidden>
          {icon}
        </div>
      ) : null}
      <h2>{title}</h2>
      {children && <p>{children}</p>}
      {action}
    </div>
  )
}

export function ErrorState({error, onRetry}: {error: unknown; onRetry?: () => void}) {
  return (
    <EmptyState
      icon={<AlertCircle size={28} />}
      title="This didn't load"
      action={
        onRetry && (
          <Button variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        )
      }>
      {errorMessage(error)}
    </EmptyState>
  )
}

export function Alert({children}: React.PropsWithChildren) {
  return (
    <div className="alert" role="alert">
      <AlertCircle size={18} aria-hidden />
      <div>{children}</div>
    </div>
  )
}

export function BackLink({to, children}: {to: string; children: React.ReactNode}) {
  return (
    <Link to={to} className="back-link">
      <ChevronLeft size={18} aria-hidden />
      {children}
    </Link>
  )
}

export function PageHead({
  title,
  description,
  back,
  actions,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  back?: {to: string; label: string}
  actions?: React.ReactNode
}) {
  return (
    <>
      {back && <BackLink to={back.to}>{back.label}</BackLink>}
      <header className="page-head">
        <div>
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </div>
        {actions}
      </header>
    </>
  )
}

export function Stepper({
  value,
  min = 1,
  max = 99,
  onChange,
  label,
}: {
  value: number
  min?: number
  max?: number
  onChange: (value: number) => void
  label: string
}) {
  return (
    <div className="stepper" role="group" aria-label={label}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Decrease quantity">
        <Minus size={18} />
      </button>
      <output aria-live="polite">{value}</output>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Increase quantity">
        <Plus size={18} />
      </button>
    </div>
  )
}

export function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
}) {
  return (
    <label className="check">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span aria-hidden>
        <Check size={14} strokeWidth={3} />
      </span>
      <span className="visually-hidden">{label}</span>
    </label>
  )
}

export function Rating({value, count}: {value?: number | null; count?: number | null}) {
  if (!value) return <span className="muted small">No ratings yet</span>
  return (
    <span className="rating small">
      <Star size={14} aria-hidden />
      {value.toFixed(1)}
      {count != null && <span className="muted">({count})</span>}
      <span className="visually-hidden"> out of 5</span>
    </span>
  )
}

export function StatusBadge({status}: {status: string | null}) {
  const key = status ?? 'scheduled'
  return <span className={`status status--${key}`}>{statusLabel(key)}</span>
}

/** Native <dialog>: Esc closes it and focus stays inside while open. */
export function Dialog({
  open,
  onClose,
  title,
  children,
  labelledBy,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  labelledBy?: string
}) {
  const ref = React.useRef<HTMLDialogElement>(null)
  const titleId = React.useId()

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className="dlg"
      aria-labelledby={labelledBy ?? titleId}
      onClose={onClose}
      onClick={e => {
        // Clicking the backdrop closes the dialog.
        if (e.target === ref.current) onClose()
      }}>
      {open && (
        <>
          <div className="dlg__head">
            <h2 id={titleId} style={{fontSize: 'var(--text-lg)'}}>
              {title}
            </h2>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
              <X size={20} />
            </button>
          </div>
          <div className="dlg__body">{children}</div>
        </>
      )}
    </dialog>
  )
}
