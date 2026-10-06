import React from 'react'
import {Link, useParams} from 'react-router-dom'
import {useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import {z} from 'zod'
import dayjs from 'dayjs'
import {Camera, Check, Copy, ExternalLink, Lock, MessageCircle, Plus, Trash2, Upload, X} from '@/components/icons'
import {Alert, Button, EmptyState, ErrorState, PageHead, Spinner} from '@/components/ui'
import {copyText, messengerText, slipLink} from '@/routes/FileDetail'
import {itemTitle, ownerOf} from '@/lib/repair'
import {errorMessage, formatDate, formatPrice} from '@/lib/format'
import {supabase} from '@/lib/supabase'
import {useSession, useUserId} from '@/state/session'
import {
  BUCKET,
  useDeleteAttachmentMutation,
  useFileQuery,
  usePublicSlipQuery,
  useSaveSlipMutation,
  useSignedUrls,
  useUploadAttachmentMutation,
  type RepairFileDetail,
} from '@/state/queries/repair'
import {toast} from '@/stores/ui'
import type {SlipExtra} from '@/types/repair-proof'

const pesoField = z
  .string()
  .trim()
  .refine(v => v === '' || (/^\d+(\.\d{1,2})?$/.test(v) && Number(v) > 0), 'Enter an amount in pesos, like 4500.')

const slipSchema = z.object({
  job_text: z
    .string()
    .trim()
    .min(10, 'Write what the shop may do, in a sentence or two.')
    .max(1000, 'Keep it under 1,000 characters.'),
  peso_cap: pesoField,
  dropoff_at: z.string(),
  owner_name: z.string().trim().max(80, 'Keep it under 80 characters.'),
  owner_mobile: z.string().trim().max(20, 'Keep it under 20 characters.'),
})
type SlipForm = z.infer<typeof slipSchema>

export function SlipEditorPage() {
  const {id} = useParams()
  const {data: file, isLoading, error, refetch} = useFileQuery(id)
  if (isLoading) return <Spinner />
  if (error) {
    return (
      <div className="container page">
        <ErrorState error={error} onRetry={refetch} />
      </div>
    )
  }
  if (!file) {
    return (
      <div className="container page">
        <EmptyState title="We couldn't find this file" action={<Link to="/files" className="btn btn--secondary">See your repairs</Link>} />
      </div>
    )
  }
  return <SlipEditor file={file} />
}

function SlipEditor({file}: {file: RepairFileDetail}) {
  const {session} = useSession()
  const owner = ownerOf(session?.user)
  const slip = file.job_slip
  const save = useSaveSlipMutation(file.id)
  const [extras, setExtras] = React.useState<SlipExtra[]>(slip?.extras ?? [])

  const {
    register,
    handleSubmit,
    formState: {errors},
  } = useForm<SlipForm>({
    resolver: zodResolver(slipSchema),
    defaultValues: {
      job_text: slip?.job_text ?? `Check and fix: ${file.problem}. Call me before doing anything else.`,
      peso_cap: slip?.peso_cap != null ? String(slip.peso_cap) : file.peso_cap != null ? String(file.peso_cap) : '',
      dropoff_at: slip?.dropoff_at ? dayjs(slip.dropoff_at).format('YYYY-MM-DDTHH:mm') : dayjs().format('YYYY-MM-DDTHH:mm'),
      owner_name: slip?.owner_name ?? owner.name,
      owner_mobile: slip?.owner_mobile ?? owner.mobile ?? '',
    },
  })

  const persist = (values: SlipForm, nextExtras: SlipExtra[], done?: string) =>
    save.mutate(
      {
        job_text: values.job_text,
        peso_cap: values.peso_cap ? Number(values.peso_cap) : null,
        dropoff_at: values.dropoff_at ? dayjs(values.dropoff_at).toISOString() : null,
        owner_name: values.owner_name || null,
        owner_mobile: values.owner_mobile || null,
        extras: nextExtras,
      },
      {
        onSuccess: () => done && toast(done),
        onError: e => toast(errorMessage(e), 'error'),
      },
    )

  const onSubmit = handleSubmit(v => persist(v, extras, slip ? 'Slip saved.' : 'Slip ready. Send the link to the shop.'))
  const updateExtras = (next: SlipExtra[], done: string) => {
    setExtras(next)
    if (slip) handleSubmit(v => persist(v, next, done))()
  }

  return (
    <div className="container page" style={{maxWidth: 720}}>
      <PageHead
        back={{to: `/files/${file.id}`, label: 'Back to the file'}}
        title="Job slip"
        description="What the shop may do and your price limit, written before they start. The shop sees it through a link. They can't change it."
      />

      {slip && <ShareBox file={file} slip={slip} />}

      <form className="card card--pad stack" onSubmit={onSubmit} noValidate style={{gap: 'var(--space-5)'}}>
        <div className="field">
          <label className="label" htmlFor="job_text">
            What the shop may do
          </label>
          <textarea id="job_text" className="textarea" rows={4} aria-invalid={!!errors.job_text} {...register('job_text')} />
          <p className="help">Name the job. Say “call me first” for anything else.</p>
          {errors.job_text && <p className="error-text">{errors.job_text.message}</p>}
        </div>
        <div className="form-row">
          <div className="field">
            <label className="label" htmlFor="slip_cap">
              Price limit, ₱
            </label>
            <input id="slip_cap" className="input" inputMode="decimal" placeholder="4500" aria-invalid={!!errors.peso_cap} {...register('peso_cap')} />
            <p className="help">They call you before going over this.</p>
            {errors.peso_cap && <p className="error-text">{errors.peso_cap.message}</p>}
          </div>
          <div className="field">
            <label className="label" htmlFor="dropoff_at">
              Drop-off
            </label>
            <input id="dropoff_at" type="datetime-local" className="input" {...register('dropoff_at')} />
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label className="label" htmlFor="owner_name">
              Your name
            </label>
            <input id="owner_name" className="input" autoComplete="name" {...register('owner_name')} />
            {errors.owner_name && <p className="error-text">{errors.owner_name.message}</p>}
          </div>
          <div className="field">
            <label className="label" htmlFor="owner_mobile">
              Your mobile
            </label>
            <input id="owner_mobile" className="input" inputMode="tel" autoComplete="tel" {...register('owner_mobile')} />
            {errors.owner_mobile && <p className="error-text">{errors.owner_mobile.message}</p>}
          </div>
        </div>
        <p className="small muted row">
          <Lock size={16} aria-hidden /> The shop sees your name and mobile on the slip. Leave them blank to hide them.
        </p>
        {save.error && <Alert>{errorMessage(save.error, "We couldn't save the slip. Try again.")}</Alert>}
        <Button type="submit" size="lg" block loading={save.isPending}>
          {slip ? 'Save changes' : 'Make the slip'}
        </Button>
      </form>

      <BeforePhotos file={file} />
      {slip ? (
        <Extras extras={extras} onChange={updateExtras} busy={save.isPending} />
      ) : (
        <p className="small muted" style={{marginTop: 'var(--space-6)'}}>
          After you make the slip, you can log extra work the shop asks for and answer yes or no.
        </p>
      )}
    </div>
  )
}

function ShareBox({file, slip}: {file: RepairFileDetail; slip: NonNullable<RepairFileDetail['job_slip']>}) {
  const url = slipLink(slip.public_code)
  const text = messengerText(file, slip)
  return (
    <section className="share-box" aria-labelledby="share-title">
      <p id="share-title" className="strong">
        Send this to the shop
      </p>
      <p className="share-box__msg">{text}</p>
      <Button size="lg" onClick={() => copyText(text, 'Copied. Paste it in Messenger.')}>
        <MessageCircle size={20} aria-hidden /> Copy for Messenger
      </Button>
      <div className="share-box__row">
        <input className="input" readOnly value={url} aria-label="Shop link" onFocus={e => e.currentTarget.select()} />
        <Button variant="secondary" onClick={() => copyText(url)}>
          <Copy size={18} aria-hidden /> Copy link
        </Button>
      </div>
      <a href={`/s/${slip.public_code}`} target="_blank" rel="noreferrer" className="link small row" style={{gap: 'var(--space-1)', minHeight: 'var(--tap)'}}>
        See what the shop sees <ExternalLink size={14} aria-hidden />
      </a>
    </section>
  )
}

function BeforePhotos({file}: {file: RepairFileDetail}) {
  const userId = useUserId()
  const upload = useUploadAttachmentMutation(file.id)
  const del = useDeleteAttachmentMutation(file.id)
  const input = React.useRef<HTMLInputElement>(null)
  const photos = file.attachments.filter(a => a.kind === 'before_photo')
  const {data: urls} = useSignedUrls(photos.map(p => p.storage_path))

  return (
    <section className="stack" aria-labelledby="before-title" style={{gap: 'var(--space-3)', marginTop: 'var(--space-8)'}}>
      <h2 id="before-title" className="section-title row">
        <Camera size={22} aria-hidden /> Before photos
      </h2>
      <p className="small" style={{color: 'var(--ink-2)'}}>
        Take them at drop-off: the dashboard with the odometer, each side, and the problem area. They show on the slip.
      </p>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        capture="environment"
        className="visually-hidden"
        onChange={e => {
          const files = Array.from(e.target.files ?? [])
          if (files.length)
            upload.mutate(
              {userId, files, kind: 'before_photo', caption: null},
              {onSuccess: () => toast(files.length === 1 ? 'Photo added.' : `${files.length} photos added.`)},
            )
          e.target.value = ''
        }}
      />
      <div>
        <Button variant="secondary" onClick={() => input.current?.click()} loading={upload.isPending}>
          <Upload size={18} aria-hidden /> Add before photos
        </Button>
      </div>
      {upload.error && <Alert>{errorMessage(upload.error)}</Alert>}
      {photos.length > 0 && (
        <ul className="proof-grid proof-grid--sm">
          {photos.map(p => (
            <li key={p.id} className="proof">
              <div className="proof__thumb">{urls?.[p.storage_path] ? <img src={urls[p.storage_path]} alt="Before photo" /> : <span className="skel" style={{position: 'absolute', inset: 0}} aria-hidden />}</div>
              <button
                type="button"
                className="icon-btn proof__del"
                aria-label="Delete this photo"
                disabled={del.isPending}
                onClick={() => del.mutate(p, {onError: e => toast(errorMessage(e), 'error')})}>
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function Extras({extras, onChange, busy}: {extras: SlipExtra[]; onChange: (next: SlipExtra[], done: string) => void; busy: boolean}) {
  const [text, setText] = React.useState('')
  const [cap, setCap] = React.useState('')
  const [err, setErr] = React.useState('')

  const add = (e: React.FormEvent) => {
    e.preventDefault()
    if (text.trim().length < 3) return setErr('Write what they want to add.')
    if (cap && !/^\d+(\.\d{1,2})?$/.test(cap.trim())) return setErr('Enter an amount in pesos, like 1200.')
    setErr('')
    onChange(
      [
        ...extras,
        {
          id: crypto.randomUUID(),
          text: text.trim(),
          cap: cap ? Number(cap) : null,
          answer: null,
          answered_at: null,
          added_at: new Date().toISOString(),
        },
      ],
      'Extra added. Answer yes or no below.',
    )
    setText('')
    setCap('')
  }

  const answer = (x: SlipExtra, a: 'yes' | 'no') =>
    onChange(
      extras.map(e => (e.id === x.id ? {...e, answer: a, answered_at: new Date().toISOString()} : e)),
      a === 'yes' ? 'You said yes. It shows on the slip with the time.' : 'You said no. It shows on the slip with the time.',
    )

  return (
    <section className="stack" aria-labelledby="extras-title" style={{gap: 'var(--space-3)', marginTop: 'var(--space-8)'}}>
      <h2 id="extras-title" className="section-title">
        Extra work the shop asks for
      </h2>
      <p className="small" style={{color: 'var(--ink-2)'}}>
        When the shop calls about more work, write it here, then say yes or no. The time is saved with your answer.
      </p>
      <form className="card card--pad stack" onSubmit={add} noValidate style={{gap: 'var(--space-3)'}}>
        <div className="form-row">
          <div className="field" style={{flex: 2}}>
            <label className="label" htmlFor="extra_text">
              What they want to add
            </label>
            <input id="extra_text" className="input" placeholder="Replace the rear brake pads" value={text} onChange={e => setText(e.target.value)} />
          </div>
          <div className="field">
            <label className="label" htmlFor="extra_cap">
              Their price, ₱
            </label>
            <input id="extra_cap" className="input" inputMode="decimal" placeholder="1800" value={cap} onChange={e => setCap(e.target.value)} />
          </div>
        </div>
        {err && <p className="error-text">{err}</p>}
        <div>
          <Button type="submit" variant="secondary" loading={busy}>
            <Plus size={18} aria-hidden /> Add the extra
          </Button>
        </div>
      </form>
      {extras.length > 0 && (
        <ul className="stack" style={{listStyle: 'none', gap: 'var(--space-2)'}}>
          {extras.map(x => (
            <li key={x.id} className="extra">
              <div style={{flex: 1, minWidth: 0}}>
                <p className="strong">{x.text}</p>
                <p className="xsmall muted">
                  Asked {dayjs(x.added_at).format('D MMM, h:mm A')}
                  {x.cap != null ? ` · ${formatPrice(x.cap)}` : ''}
                </p>
              </div>
              {x.answer ? (
                <span className={`answer answer--${x.answer}`}>
                  {x.answer === 'yes' ? <Check size={16} aria-hidden /> : <X size={16} aria-hidden />}
                  {x.answer === 'yes' ? 'Yes' : 'No'}, {dayjs(x.answered_at).format('D MMM, h:mm A')}
                </span>
              ) : (
                <div className="row" style={{gap: 'var(--space-2)'}}>
                  <Button size="sm" variant="secondary" disabled={busy} onClick={() => answer(x, 'yes')}>
                    Yes, do it
                  </Button>
                  <Button size="sm" variant="ghost" disabled={busy} onClick={() => answer(x, 'no')}>
                    No
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/** What the shop sees at /s/:code. Read-only, no sign-in. */
export function PublicSlipPage() {
  const {code} = useParams()
  const {data: slip, isLoading, error, refetch} = usePublicSlipQuery(code)

  if (isLoading) return <Spinner />
  if (error) {
    return (
      <div className="container page">
        <ErrorState error={error} onRetry={refetch} />
      </div>
    )
  }
  if (!slip) {
    return (
      <div className="container page" style={{maxWidth: 640}}>
        <EmptyState title="This slip isn't here" action={<Link to="/" className="btn btn--secondary">Go to Kumpooni</Link>}>
          The link may be wrong, or the owner deleted the file.
        </EmptyState>
      </div>
    )
  }

  const vehicle = slip.vehicle
    ? itemTitle({
        kind: slip.vehicle.kind,
        year_model: slip.vehicle.year_model,
        make_text: slip.vehicle.make,
        model_text: slip.vehicle.model,
      })
    : ''

  return (
    <div className="container page slip-page" style={{maxWidth: 720}}>
      <header className="slip-head">
        <p className="eyebrow">Job slip</p>
        <h1>{slip.shop_name}</h1>
        <p className="muted">
          {[vehicle, slip.vehicle?.plate_no].filter(Boolean).join(' · ')}
          {slip.dropoff_at ? ` · Dropped off ${dayjs(slip.dropoff_at).format('D MMM YYYY, h:mm A')}` : ''}
        </p>
      </header>

      <section className="card card--pad stack" style={{gap: 'var(--space-4)'}}>
        <div>
          <h2 className="label">The owner allows this work</h2>
          <p className="slip-job">{slip.job_text}</p>
        </div>
        {slip.peso_cap != null && (
          <div className="slip-cap">
            <span>Price limit</span>
            <strong>{formatPrice(slip.peso_cap)}</strong>
            <small>Call the owner before going over this amount.</small>
          </div>
        )}
        {(slip.owner_name || slip.owner_mobile) && (
          <p className="small">
            Owner: <span className="strong">{slip.owner_name}</span>
            {slip.owner_mobile ? (
              <>
                {' · '}
                <a href={`tel:${slip.owner_mobile.replace(/[^\d+]/g, '')}`} className="link">
                  {slip.owner_mobile}
                </a>
              </>
            ) : null}
          </p>
        )}
      </section>

      {slip.extras.length > 0 && (
        <section className="stack" style={{gap: 'var(--space-3)', marginTop: 'var(--space-6)'}}>
          <h2 className="section-title">Extra work asked for</h2>
          <ul className="stack" style={{listStyle: 'none', gap: 'var(--space-2)'}}>
            {slip.extras.map(x => (
              <li key={x.id} className="extra">
                <div style={{flex: 1, minWidth: 0}}>
                  <p className="strong">{x.text}</p>
                  <p className="xsmall muted">
                    Asked {dayjs(x.added_at).format('D MMM, h:mm A')}
                    {x.cap != null ? ` · ${formatPrice(x.cap)}` : ''}
                  </p>
                </div>
                <span className={`answer answer--${x.answer ?? 'wait'}`}>
                  {x.answer === 'yes'
                    ? `Approved ${dayjs(x.answered_at).format('D MMM, h:mm A')}`
                    : x.answer === 'no'
                      ? `Not approved ${dayjs(x.answered_at).format('D MMM, h:mm A')}`
                      : 'Not approved yet'}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {slip.photos.length > 0 && <PublicPhotos photos={slip.photos} />}

      <p className="xsmall muted" style={{marginTop: 'var(--space-8)'}}>
        Written by the owner on {formatDate(slip.created_at, 'D MMM YYYY')}
        {slip.updated_at !== slip.created_at ? `, last changed ${dayjs(slip.updated_at).format('D MMM YYYY, h:mm A')}` : ''}. Shops can't edit this
        page. Made with <Link to="/" className="link">Kumpooni</Link>.
      </p>
    </div>
  )
}

function PublicPhotos({photos}: {photos: {path: string; caption: string | null}[]}) {
  const [urls, setUrls] = React.useState<Record<string, string>>({})
  React.useEffect(() => {
    let cancelled = false
    supabase.storage
      .from(BUCKET)
      .createSignedUrls(
        photos.map(p => p.path),
        3600,
      )
      .then(({data}) => {
        if (cancelled || !data) return
        const map: Record<string, string> = {}
        for (const d of data) if (d.path && d.signedUrl) map[d.path] = d.signedUrl
        setUrls(map)
      })
    return () => {
      cancelled = true
    }
  }, [photos])

  return (
    <section className="stack" style={{gap: 'var(--space-3)', marginTop: 'var(--space-6)'}}>
      <h2 className="section-title">Before photos</h2>
      <ul className="proof-grid proof-grid--sm">
        {photos.map(p => (
          <li key={p.path} className="proof">
            <a className="proof__thumb" href={urls[p.path]} target="_blank" rel="noreferrer" aria-label="Open before photo">
              {urls[p.path] ? <img src={urls[p.path]} alt={p.caption ?? 'Before photo'} /> : <span className="skel" style={{position: 'absolute', inset: 0}} aria-hidden />}
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
