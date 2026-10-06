import React from 'react'
import {Link} from 'react-router-dom'
import {Camera, Wrench} from '@/components/icons'
import {Button} from '@/components/ui'
import type {NextStep} from '@/lib/next-step'

/**
 * The one primary action for a repair, with a short mechanic-friend line under it.
 * Pass `to` for a link, `onAction` for a button, or `onPhoto` to open the camera.
 */
export function Coach({
  step,
  to,
  onAction,
  onPhoto,
  busy,
  tone = 'card',
  title,
}: {
  step: NextStep
  to?: string
  onAction?: () => void
  onPhoto?: (file: File) => void
  busy?: boolean
  tone?: 'card' | 'hero'
  title?: React.ReactNode
}) {
  const id = React.useId()
  return (
    <section className={`coach coach--${tone}`} aria-labelledby={id}>
      <p id={id} className="coach__eyebrow">
        Next step
      </p>
      {title && <p className="coach__title">{title}</p>}
      {onPhoto ? (
        <PhotoButton onPick={onPhoto} busy={busy}>
          {step.label}
        </PhotoButton>
      ) : to ? (
        <Link to={to} className="btn btn--primary btn--lg">
          {step.label}
        </Link>
      ) : (
        <Button size="lg" onClick={onAction} loading={busy}>
          {step.label}
        </Button>
      )}
      <p className="coach__line">
        <Wrench size={16} aria-hidden /> {step.line}
      </p>
    </section>
  )
}

/** Opens the back camera on phones, and the file picker on computers. */
export function PhotoButton({
  onPick,
  busy,
  children,
  variant = 'primary',
  size = 'lg',
}: {
  onPick: (file: File) => void
  busy?: boolean
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
  size?: 'md' | 'lg'
}) {
  const input = React.useRef<HTMLInputElement>(null)
  return (
    <>
      <input
        ref={input}
        type="file"
        accept="image/*,application/pdf"
        capture="environment"
        className="visually-hidden"
        tabIndex={-1}
        aria-hidden
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) onPick(file)
          e.target.value = ''
        }}
      />
      <Button variant={variant} size={size} loading={busy} onClick={() => input.current?.click()}>
        <Camera size={20} aria-hidden /> {children}
      </Button>
    </>
  )
}
