import React from 'react'
import {Link, useNavigate, useParams, useSearchParams} from 'react-router-dom'
import {useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import {z} from 'zod'
import dayjs from 'dayjs'
import {
  AlertTriangle,
  Camera,
  FileText,
  Mail,
  MessageCircle,
  Pencil,
  Plus,
  Printer,
  Receipt,
  Scale,
  Sparkles,
  Trash2,
  Upload,
} from '@/components/icons'
import {Alert, Button, Dialog, EmptyState, ErrorState, PageHead, Spinner} from '@/components/ui'
import {OfficeMap} from '@/components/OfficeMap'
import {Coach} from '@/components/NextStep'
import {failedVisits, nextStep, problemKnown, shopKnown} from '@/lib/next-step'
import {VehicleIcon} from '@/routes/Vehicles'
import {
  ATTACHMENT_LABEL,
  DEALER_PHRASES,
  HINT_FOOTER,
  OLD_PARTS_LABEL,
  RESULT_LABEL,
  days,
  fileClocks,
  fileHints,
  itemTitle,
  phraseLabel,
  sortVisits,
  stayWords,
} from '@/lib/repair'
import type {VehicleKind} from '@/types/repair-proof'
import {kindGroup} from '@/lib/kinds'
import {errorMessage, formatDate, formatPrice, plural} from '@/lib/format'
import {useUserId} from '@/state/session'
import {
  useDeleteAttachmentMutation,
  useDeleteFileMutation,
  useDeleteVisitMutation,
  useFileQuery,
  useOfficesQuery,
  useSaveFileMutation,
  useSaveVisitMutation,
  useSignedUrls,
  useUploadAttachmentMutation,
  type RepairFileDetail,
} from '@/state/queries/repair'
import {toast} from '@/stores/ui'
import type {
  AttachmentKind,
  AttachmentRow,
  JobSlipRow,
  OldParts,
  RepairFileRow,
  VisitResult,
  VisitRow,
} from '@/types/repair-proof'

export function slipLink(code: string) {
  return `${window.location.origin}/s/${code}`
}

export async function copyText(text: string, done = 'Link copied.') {
  try {
    await navigator.clipboard.writeText(text)
    toast(done)
  } catch {
    toast("We couldn't copy it. Select the text and copy it yourself.", 'error')
  }
}

export function FileDetailPage() {
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
        <EmptyState
          title="We couldn't find this file"
          action={
            <Link to="/files" className="btn btn--secondary">
              See your repairs
            </Link>
          }>
          It may have been deleted, or it belongs to another account.
        </EmptyState>
      </div>
    )
  }
  return <FileView file={file} />
}

/** Three to four lines the shop can read in Messenger: shop, job, price limit, link. */
export function messengerText(file: Pick<RepairFileRow, 'shop_name'>, slip: Pick<JobSlipRow, 'job_text' | 'peso_cap' | 'public_code'>) {
  const job = slip.job_text.replace(/\s+/g, ' ').trim()
  return [
    shopKnown(file.shop_name) ? `Job slip for ${file.shop_name}` : 'Job slip',
    `Job: ${job.length > 140 ? `${job.slice(0, 139)}…` : job}`,
    slip.peso_cap != null ? `Price limit: ${formatPrice(slip.peso_cap)}. Call me before going over.` : '',
    slipLink(slip.public_code),
  ]
    .filter(Boolean)
    .join('\n')
}

function FileView({file}: {file: RepairFileDetail}) {
  const visits = sortVisits(file.visits)
  const clocks = fileClocks(file, visits)
  const kind = file.vehicle?.kind ?? null
  const hints = fileHints(kind, clocks)
  const closed = file.status === 'closed'
  const step = nextStep(file)
  const last = visits[visits.length - 1]
  // The letter, the hints, and the office map only matter once a repair has failed twice.
  const complaintTime = failedVisits(visits) >= 2 || file.letters.length > 0
  // The slip matters before drop-off, or once it exists.
  const slipTime = !!file.job_slip || visits.length === 0
  const canAsk = visits.length > 0 || file.attachments.some(a => a.caption?.trim())
  const missing = !shopKnown(file.shop_name) || !problemKnown(file.problem)

  const userId = useUserId()
  const upload = useUploadAttachmentMutation(file.id)
  const save = useSaveFileMutation()
  const navigate = useNavigate()
  const [visitEditing, setVisitEditing] = React.useState<VisitRow | 'new' | null>(null)
  const [params, setParams] = useSearchParams()

  // Home links here with ?do=visit so "Log this trip" opens the form straight away.
  React.useEffect(() => {
    if (params.get('do') !== 'visit') return
    setVisitEditing(last && !last.date_out ? last : 'new')
    setParams({}, {replace: true})
  }, [params, setParams, last])

  const act = () => {
    if (!step) return
    if (step.id === 'trip' || step.id === 'another') setVisitEditing('new')
    else if (step.id === 'pickup' && last) setVisitEditing(last)
    else if (step.id === 'complaint') navigate(`/files/${file.id}/letter`)
    else if (step.id === 'close') {
      save.mutate(
        {id: file.id, values: {status: 'closed'}},
        {
          onSuccess: () => toast('File closed. You can reopen it any time.'),
          onError: e => toast(errorMessage(e), 'error'),
        },
      )
    }
  }

  const savePhoto = (photo: File) =>
    upload.mutate(
      {userId, files: [photo], kind: 'estimate', caption: null},
      {
        onSuccess: () => toast('Quote saved to the file.'),
        onError: e => toast(errorMessage(e, "We couldn't save the photo. Try again."), 'error'),
      },
    )

  const complain = (
    <>
      {hints.length > 0 && <Hints hints={hints} />}
      <ComplainCard file={file} />
    </>
  )
  const slip = <SlipCard file={file} />

  return (
    <div className="container page">
      <PageHead
        back={{to: '/files', label: 'Your repairs'}}
        title={file.problem}
        description={
          <span className="row" style={{gap: 'var(--space-2)', flexWrap: 'wrap'}}>
            <VehicleIcon kind={kind} size={18} />
            <span>
              {shopKnown(file.shop_name) ? file.shop_name : 'Shop not added yet'}
              {file.shop_city ? `, ${file.shop_city}` : ''}
              {file.vehicle ? ` · ${itemTitle(file.vehicle)}` : ''}
              {file.vehicle?.plate_no ? ` · ${file.vehicle.plate_no}` : ''}
            </span>
            {closed && <span className="tag">Closed</span>}
          </span>
        }
        actions={
          <Link to={`/files/${file.id}/edit`} className="btn btn--secondary">
            <Pencil size={18} aria-hidden /> Edit
          </Link>
        }
      />

      <div className="split split--flow">
        <div className="stack" style={{gap: 'var(--space-8)'}}>
          <div className="stack" style={{gap: 'var(--space-3)'}}>
            {step && (
              <Coach
                step={step}
                busy={upload.isPending || save.isPending}
                onPhoto={step.id === 'quote' ? savePhoto : undefined}
                onAction={step.id === 'quote' ? undefined : act}
              />
            )}
            {missing && (
              <p className="small muted">
                {!shopKnown(file.shop_name) && !problemKnown(file.problem)
                  ? "The shop and what's wrong aren't in the file yet."
                  : !shopKnown(file.shop_name)
                    ? "The shop isn't in the file yet."
                    : "What's wrong isn't in the file yet."}{' '}
                <Link to={`/files/${file.id}/edit`} className="link">
                  Add them now
                </Link>
              </p>
            )}
          </div>
          {visits.length > 0 && <Clocks clocks={clocks} quoted={file.peso_cap} kind={kind} />}
          <Visits file={file} visits={visits} editing={visitEditing} setEditing={setVisitEditing} />
          <Proof file={file} />
        </div>
        <aside className="stack" style={{gap: 'var(--space-5)'}} aria-label="More for this file">
          {complaintTime && complain}
          {slipTime && slip}
          {canAsk && (
            <Link to={`/ask?file=${file.id}`} className="card card--pad card--link row ask-link">
              <Sparkles size={20} aria-hidden />
              <span>
                <span className="strong">Ask this file</span>
                <span className="small muted" style={{display: 'block'}}>
                  Answers from your visits and photo notes only.
                </span>
              </span>
            </Link>
          )}
          <details className="more">
            <summary>More for this file</summary>
            <div className="stack" style={{gap: 'var(--space-5)', marginTop: 'var(--space-4)'}}>
              {!slipTime && slip}
              {!complaintTime && complain}
              <FileActions file={file} />
            </div>
          </details>
        </aside>
      </div>
    </div>
  )
}

function Clocks({
  clocks,
  quoted,
  kind,
}: {
  clocks: ReturnType<typeof fileClocks>
  quoted: number | null
  kind: VehicleKind | null
}) {
  return (
    <section aria-label="Repair clocks" className="clocks clocks--small">
      <div className="clock">
        <span className="clock__num">{clocks.attempts}</span>
        <span className="clock__label">{clocks.attempts === 1 ? 'Visit for this problem' : 'Visits for this problem'}</span>
      </div>
      <div className={`clock ${clocks.daysInShop >= 30 ? 'clock--warn' : ''}`}>
        <span className="clock__num">{clocks.daysInShop}</span>
        <span className="clock__label">
          {clocks.daysInShop === 1 ? 'Day' : 'Days'} {stayWords(kind).at}{clocks.stillInside ? ', still counting' : ''}
        </span>
      </div>
      <div className="clock">
        <span className="clock__num">{clocks.daysSinceFirst}</span>
        <span className="clock__label">{clocks.daysSinceFirst === 1 ? 'Day' : 'Days'} since you first told them</span>
      </div>
      <div className="clock">
        <span className="clock__num clock__num--money">{formatPrice(clocks.amountPaid)}</span>
        <span className="clock__label">Paid so far{quoted ? `, quoted ${formatPrice(quoted)}` : ''}</span>
      </div>
    </section>
  )
}

function Hints({hints}: {hints: ReturnType<typeof fileHints>}) {
  return (
    <section className="stack" aria-label="What your record shows" style={{gap: 'var(--space-3)'}}>
      {hints.map(h => (
        <div key={h.id} className="hint">
          <Scale size={22} aria-hidden />
          <div>
            <h3>{h.title}</h3>
            <p>{h.body}</p>
            <p className="xsmall muted">{HINT_FOOTER}</p>
          </div>
        </div>
      ))}
    </section>
  )
}

function Visits({
  file,
  visits,
  editing,
  setEditing,
}: {
  file: RepairFileDetail
  visits: VisitRow[]
  editing: VisitRow | 'new' | null
  setEditing: (v: VisitRow | 'new' | null) => void
}) {
  const [deleting, setDeleting] = React.useState<VisitRow | null>(null)
  const del = useDeleteVisitMutation(file.id)
  const showPhrases =
    file.vehicle?.kind === 'motorcycle' || kindGroup(file.vehicle?.kind) === 'device' || file.show_dealer_phrases
  const stay = stayWords(file.vehicle?.kind)

  return (
    <section className="stack" aria-labelledby="visits-title" style={{gap: 'var(--space-4)'}}>
      <div className="section-head" style={{marginBottom: 0}}>
        <h2 id="visits-title" className="section-title">
          Visits
        </h2>
        {visits.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setEditing('new')}>
            <Plus size={16} aria-hidden /> Add a visit
          </Button>
        )}
      </div>
      {visits.length === 0 ? (
        <div className="card card--pad stack" style={{gap: 'var(--space-3)'}}>
          <p className="strong">No visits yet</p>
          <p className="small" style={{color: 'var(--ink-2)'}}>
            Add one each time the shop works on this problem. Write what you told them and what they said.
          </p>
          <div>
            <Button variant="secondary" onClick={() => setEditing('new')}>
              <Plus size={18} aria-hidden /> Add a visit
            </Button>
          </div>
        </div>
      ) : (
        <ol className="timeline">
          {visits.map((v, i) => (
            <li key={v.id} className="visit">
              <div className="visit__head">
                <div>
                  <p className="strong">
                    Visit {i + 1} · {formatDate(v.date_in, 'D MMM YYYY')}
                    {v.date_out ? ` to ${formatDate(v.date_out, 'D MMM YYYY')}` : ''}
                  </p>
                  <p className="small muted">
                    {v.date_out
                      ? `${days(Math.max(0, dayjs(v.date_out).diff(dayjs(v.date_in), 'day')))} ${stay.at}`
                      : stay.still}
                    {v.amount_paid ? ` · Paid ${formatPrice(v.amount_paid)}` : ''}
                  </p>
                </div>
                {v.result && <span className={`result result--${v.result}`}>{RESULT_LABEL[v.result]}</span>}
              </div>
              {v.story && (
                <p>
                  <span className="visit__k">You told them</span> {v.story}
                </p>
              )}
              {v.shop_said && (
                <p>
                  <span className="visit__k">They said or did</span> {v.shop_said}
                </p>
              )}
              {v.phrases.length > 0 && (
                <ul className="chips chips--wrap" aria-label="What the dealer said">
                  {v.phrases.map(p => (
                    <li key={p} className="tag tag--warn">
                      {phraseLabel(p)}
                    </li>
                  ))}
                </ul>
              )}
              <div className="row" style={{gap: 'var(--space-1)'}}>
                <Button variant="ghost" size="sm" onClick={() => setEditing(v)}>
                  <Pencil size={16} aria-hidden /> Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setDeleting(v)}>
                  <Trash2 size={16} aria-hidden /> Delete
                </Button>
              </div>
            </li>
          ))}
        </ol>
      )}

      <Dialog
        open={editing != null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? `Add visit ${visits.length + 1}` : 'Edit the visit'}>
        {editing != null && (
          <VisitForm
            file={file}
            visit={editing === 'new' ? null : editing}
            showPhrases={showPhrases}
            onDone={() => setEditing(null)}
          />
        )}
      </Dialog>

      <Dialog open={!!deleting} onClose={() => setDeleting(null)} title="Delete this visit?">
        <p>The clocks will update. This can't be undone.</p>
        <div className="dlg__foot">
          <Button variant="ghost" onClick={() => setDeleting(null)}>
            Keep it
          </Button>
          <Button
            variant="danger"
            loading={del.isPending}
            onClick={() =>
              deleting &&
              del.mutate(deleting.id, {
                onSuccess: () => {
                  setDeleting(null)
                  toast('Visit deleted.')
                },
                onError: e => toast(errorMessage(e), 'error'),
              })
            }>
            Delete visit
          </Button>
        </div>
      </Dialog>
    </section>
  )
}

const visitSchema = z
  .object({
    date_in: z
      .string()
      .min(1, 'Enter the day you dropped it off.')
      .refine(v => !dayjs(v).isAfter(dayjs(), 'day'), 'This date is in the future.'),
    still_inside: z.boolean(),
    date_out: z.string(),
    story: z.string().trim().max(1000, 'Keep it under 1,000 characters.'),
    shop_said: z.string().trim().max(1000, 'Keep it under 1,000 characters.'),
    result: z.enum(['', 'fixed', 'not_fixed', 'worse', 'waiting_parts']),
    amount_paid: z
      .string()
      .trim()
      .refine(v => v === '' || (/^\d+(\.\d{1,2})?$/.test(v) && Number(v) >= 0), 'Enter an amount in pesos, like 1200.'),
    phrases: z.array(z.string()),
  })
  .superRefine((v, ctx) => {
    if (v.still_inside) return
    if (!v.date_out) {
      ctx.addIssue({code: 'custom', path: ['date_out'], message: 'Enter the day it was done, or tick the box below.'})
    } else if (v.date_in && dayjs(v.date_out).isBefore(dayjs(v.date_in), 'day')) {
      ctx.addIssue({code: 'custom', path: ['date_out'], message: 'This is before the drop-off date.'})
    } else if (dayjs(v.date_out).isAfter(dayjs(), 'day')) {
      ctx.addIssue({code: 'custom', path: ['date_out'], message: 'This date is in the future.'})
    }
  })
type VisitForm = z.infer<typeof visitSchema>

function VisitForm({
  file,
  visit,
  showPhrases,
  onDone,
}: {
  file: RepairFileDetail
  visit: VisitRow | null
  showPhrases: boolean
  onDone: () => void
}) {
  const save = useSaveVisitMutation(file.id)
  const saveFile = useSaveFileMutation()
  const today = dayjs().format('YYYY-MM-DD')
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: {errors},
  } = useForm<VisitForm>({
    resolver: zodResolver(visitSchema),
    defaultValues: {
      date_in: visit?.date_in ?? today,
      still_inside: visit ? !visit.date_out : true,
      date_out: visit?.date_out ?? '',
      story: visit?.story ?? '',
      shop_said: visit?.shop_said ?? '',
      result: visit?.result ?? '',
      amount_paid: visit?.amount_paid != null ? String(visit.amount_paid) : '',
      phrases: visit?.phrases ?? [],
    },
  })
  const stillInside = watch('still_inside')
  const phrases = watch('phrases')
  const result = watch('result')

  const onSubmit = handleSubmit(v => {
    save.mutate(
      {
        id: visit?.id,
        values: {
          date_in: v.date_in,
          date_out: v.still_inside ? null : v.date_out,
          story: v.story || null,
          shop_said: v.shop_said || null,
          result: (v.result || null) as VisitResult | null,
          amount_paid: v.amount_paid ? Number(v.amount_paid) : null,
          phrases: v.phrases,
        },
      },
      {
        onSuccess: () => {
          toast(visit ? 'Visit updated.' : 'Visit added.')
          onDone()
        },
      },
    )
  })

  return (
    <form className="stack" onSubmit={onSubmit} noValidate style={{gap: 'var(--space-4)'}}>
      <div className="form-row">
        <div className="field">
          <label className="label" htmlFor="date_in">
            Dropped off
          </label>
          <input id="date_in" type="date" className="input" max={today} aria-invalid={!!errors.date_in} {...register('date_in')} />
          {errors.date_in && <p className="error-text">{errors.date_in.message}</p>}
        </div>
        <div className="field">
          <label className="label" htmlFor="date_out">
            Got it back
          </label>
          <input
            id="date_out"
            type="date"
            className="input"
            max={today}
            disabled={stillInside}
            aria-invalid={!!errors.date_out}
            {...register('date_out')}
          />
          {errors.date_out && <p className="error-text">{errors.date_out.message}</p>}
        </div>
      </div>
      <label className="row small" style={{minHeight: 'var(--tap)', cursor: 'pointer'}}>
        <input type="checkbox" className="box" {...register('still_inside')} />
        {stayWords(file.vehicle?.kind).still}
      </label>

      <div className="field">
        <label className="label" htmlFor="story">
          What you told them
        </label>
        <textarea id="story" className="textarea" rows={3} placeholder="Same warm air after 10 minutes on the highway." {...register('story')} />
        {errors.story && <p className="error-text">{errors.story.message}</p>}
      </div>
      <div className="field">
        <label className="label" htmlFor="shop_said">
          What they said or did
        </label>
        <textarea id="shop_said" className="textarea" rows={3} placeholder="Recharged the freon. Said it should be fine now." {...register('shop_said')} />
        {errors.shop_said && <p className="error-text">{errors.shop_said.message}</p>}
      </div>

      <fieldset className="field" style={{border: 0, padding: 0, margin: 0}}>
        <legend className="label">How it went</legend>
        <div className="chips chips--wrap" role="radiogroup">
          {(Object.keys(RESULT_LABEL) as VisitResult[]).map(r => (
            <button
              key={r}
              type="button"
              role="radio"
              className="chip"
              aria-checked={result === r}
              onClick={() => setValue('result', result === r ? '' : r)}>
              {RESULT_LABEL[r]}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="field">
        <label className="label" htmlFor="amount_paid">
          Paid this visit, ₱ <span className="muted">(optional)</span>
        </label>
        <input id="amount_paid" className="input" inputMode="decimal" placeholder="0" aria-invalid={!!errors.amount_paid} {...register('amount_paid')} />
        {errors.amount_paid && <p className="error-text">{errors.amount_paid.message}</p>}
      </div>

      {showPhrases ? (
        <fieldset className="field" style={{border: 0, padding: 0, margin: 0}}>
          <legend className="label">Did the dealer say any of these?</legend>
          <div className="chips chips--wrap">
            {DEALER_PHRASES.map(p => {
              const on = phrases.includes(p.id)
              return (
                <button
                  key={p.id}
                  type="button"
                  className="chip"
                  aria-pressed={on}
                  onClick={() => setValue('phrases', on ? phrases.filter(x => x !== p.id) : [...phrases, p.id])}>
                  {p.label}
                </button>
              )
            })}
          </div>
          <p className="help">Tap the ones you heard. They go into your timeline word for word.</p>
        </fieldset>
      ) : (
        <button
          type="button"
          className="link small"
          style={{alignSelf: 'flex-start', minHeight: 'var(--tap)'}}
          disabled={saveFile.isPending}
          onClick={() => saveFile.mutate({id: file.id, values: {show_dealer_phrases: true}})}>
          Track what the dealer says
        </button>
      )}

      {save.error && <Alert>{errorMessage(save.error, "We couldn't save the visit. Try again.")}</Alert>}
      <div className="dlg__foot" style={{marginTop: 0}}>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={save.isPending}>
          {visit ? 'Save changes' : 'Add visit'}
        </Button>
      </div>
    </form>
  )
}

const KIND_ORDER: AttachmentKind[] = ['estimate', 'job_order', 'receipt', 'before_photo', 'old_part', 'chat', 'other']

function Proof({file}: {file: RepairFileDetail}) {
  const userId = useUserId()
  const upload = useUploadAttachmentMutation(file.id)
  const del = useDeleteAttachmentMutation(file.id)
  const saveFile = useSaveFileMutation()
  const [kind, setKind] = React.useState<AttachmentKind>(file.attachments.length ? 'receipt' : 'estimate')
  const [caption, setCaption] = React.useState('')
  const [deleting, setDeleting] = React.useState<AttachmentRow | null>(null)
  const [viewing, setViewing] = React.useState<AttachmentRow | null>(null)
  const input = React.useRef<HTMLInputElement>(null)
  const items = [...file.attachments].sort(
    (a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) || a.created_at.localeCompare(b.created_at),
  )
  const {data: urls} = useSignedUrls(items.map(a => a.storage_path))

  const onFiles = (list: FileList | null) => {
    const files = Array.from(list ?? [])
    if (!files.length) return
    upload.mutate(
      {userId, files, kind, caption: caption.trim() || null},
      {
        onSuccess: () => {
          toast(files.length === 1 ? 'Saved to the file.' : `${files.length} files saved.`)
          setCaption('')
        },
      },
    )
    if (input.current) input.current.value = ''
  }

  return (
    <section className="stack" aria-labelledby="proof-title" style={{gap: 'var(--space-4)'}}>
      <h2 id="proof-title" className="section-title">
        Proof
      </h2>
      <div className="card card--pad stack" style={{gap: 'var(--space-4)'}}>
        <div className="form-row">
          <div className="field">
            <label className="label" htmlFor="att-kind">
              What is it?
            </label>
            <select id="att-kind" className="select" value={kind} onChange={e => setKind(e.target.value as AttachmentKind)}>
              {KIND_ORDER.map(k => (
                <option key={k} value={k}>
                  {ATTACHMENT_LABEL[k]}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="label" htmlFor="att-caption">
              Note <span className="muted">(optional)</span>
            </label>
            <input
              id="att-caption"
              className="input"
              maxLength={140}
              placeholder="Quote from Sept 12, signed by Mark"
              value={caption}
              onChange={e => setCaption(e.target.value)}
            />
          </div>
        </div>
        <input
          ref={input}
          id="att-file"
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          multiple
          className="visually-hidden"
          onChange={e => onFiles(e.target.files)}
        />
        <div className="row" style={{flexWrap: 'wrap'}}>
          <Button variant="secondary" onClick={() => input.current?.click()} loading={upload.isPending}>
            <Upload size={18} aria-hidden /> Add a photo or PDF
          </Button>
          <span className="small muted">JPG, PNG, WebP, or PDF, up to 10 MB each.</span>
        </div>
        {upload.error && <Alert>{errorMessage(upload.error, "We couldn't save that file. Try again.")}</Alert>}
      </div>

      {items.length === 0 ? (
        <p className="small muted row">
          <Camera size={18} aria-hidden /> Start with the written quote. Then the job order and receipts.
        </p>
      ) : (
        <ul className="proof-grid">
          {items.map(a => {
            const url = urls?.[a.storage_path]
            const isPdf = a.mime_type === 'application/pdf'
            return (
              <li key={a.id} className="proof">
                <button
                  type="button"
                  className="proof__thumb"
                  onClick={() => (isPdf ? url && window.open(url, '_blank', 'noopener') : setViewing(a))}
                  aria-label={`Open ${ATTACHMENT_LABEL[a.kind]}${a.caption ? `: ${a.caption}` : ''}`}>
                  {isPdf ? (
                    <FileText size={32} aria-hidden />
                  ) : url ? (
                    <img src={url} alt="" loading="lazy" />
                  ) : (
                    <span className="skel" style={{position: 'absolute', inset: 0}} aria-hidden />
                  )}
                </button>
                <div className="proof__meta">
                  <span className="strong small">{ATTACHMENT_LABEL[a.kind]}</span>
                  {a.caption && <span className="xsmall muted">{a.caption}</span>}
                  <span className="xsmall muted">{formatDate(a.taken_at ?? a.created_at, 'D MMM YYYY')}</span>
                </div>
                <button type="button" className="icon-btn proof__del" aria-label={`Delete ${ATTACHMENT_LABEL[a.kind]}`} onClick={() => setDeleting(a)}>
                  <Trash2 size={16} />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <div className="card card--pad stack" style={{gap: 'var(--space-3)'}}>
        <h3 className="row" style={{fontSize: 'var(--text-md)'}}>
          <Receipt size={20} aria-hidden /> Old parts
        </h3>
        <p className="small" style={{color: 'var(--ink-2)'}}>
          Ask the shop to hand back the parts they replaced. If they refuse, mark it here.
        </p>
        <div className="segmented" role="group" aria-label="Did you ask for the old parts?">
          {(Object.keys(OLD_PARTS_LABEL) as OldParts[]).map(o => (
            <button
              key={o}
              type="button"
              aria-pressed={file.old_parts === o}
              disabled={saveFile.isPending}
              onClick={() =>
                saveFile.mutate(
                  {id: file.id, values: {old_parts: o}},
                  {onError: e => toast(errorMessage(e), 'error')},
                )
              }>
              {OLD_PARTS_LABEL[o]}
            </button>
          ))}
        </div>
      </div>

      <Dialog open={!!viewing} onClose={() => setViewing(null)} title={viewing ? ATTACHMENT_LABEL[viewing.kind] : ''}>
        {viewing && urls?.[viewing.storage_path] && (
          <div className="stack" style={{gap: 'var(--space-3)'}}>
            <img src={urls[viewing.storage_path]} alt={viewing.caption ?? ATTACHMENT_LABEL[viewing.kind]} className="proof__full" />
            {viewing.caption && <p className="small">{viewing.caption}</p>}
          </div>
        )}
      </Dialog>

      <Dialog open={!!deleting} onClose={() => setDeleting(null)} title="Delete this file?">
        <p>It will be removed from the repair file and from storage. This can't be undone.</p>
        <div className="dlg__foot">
          <Button variant="ghost" onClick={() => setDeleting(null)}>
            Keep it
          </Button>
          <Button
            variant="danger"
            loading={del.isPending}
            onClick={() =>
              deleting &&
              del.mutate(deleting, {
                onSuccess: () => {
                  setDeleting(null)
                  toast('Deleted.')
                },
                onError: e => toast(errorMessage(e), 'error'),
              })
            }>
            Delete
          </Button>
        </div>
      </Dialog>
    </section>
  )
}

function SlipCard({file}: {file: RepairFileDetail}) {
  const slip = file.job_slip
  const pending = slip?.extras.filter(x => !x.answer).length ?? 0
  return (
    <section className="card card--pad stack" aria-labelledby="slip-title" style={{gap: 'var(--space-3)'}}>
      <h2 id="slip-title" className="card-title row">
        <FileText size={20} aria-hidden /> Job slip
      </h2>
      {slip ? (
        <>
          <p className="small" style={{color: 'var(--ink-2)'}}>
            {slip.job_text.length > 120 ? `${slip.job_text.slice(0, 120)}…` : slip.job_text}
          </p>
          <p className="meta">
            {slip.peso_cap != null && <span>Up to {formatPrice(slip.peso_cap)}</span>}
            <span>{plural(slip.extras.length, 'extra')}</span>
            {pending > 0 && <span>{pending} waiting for your answer</span>}
          </p>
          <div className="row" style={{flexWrap: 'wrap', gap: 'var(--space-2)'}}>
            <Button variant="secondary" size="sm" onClick={() => copyText(messengerText(file, slip), 'Copied. Paste it in Messenger.')}>
              <MessageCircle size={16} aria-hidden /> Copy for Messenger
            </Button>
            <Link to={`/files/${file.id}/slip`} className="btn btn--ghost btn--sm">
              <Pencil size={16} aria-hidden /> Edit
            </Link>
          </div>
        </>
      ) : (
        <>
          <p className="small" style={{color: 'var(--ink-2)'}}>
            Write what the shop may do and your price limit before they start. Send them the link.
          </p>
          <Link to={`/files/${file.id}/slip`} className="btn btn--secondary">
            Make a job slip
          </Link>
        </>
      )}
    </section>
  )
}

function ComplainCard({file}: {file: RepairFileDetail}) {
  const {data: offices, isLoading, error} = useOfficesQuery()
  const [officeId, setOfficeId] = React.useState<number | null>(null)
  const navigate = useNavigate()
  const thin = !shopKnown(file.shop_name) || file.visits.length === 0
  const latest = file.letters[0]

  return (
    <section className="card card--pad stack" aria-labelledby="complain-title" style={{gap: 'var(--space-3)'}}>
      <h2 id="complain-title" className="card-title row">
        <Mail size={20} aria-hidden /> Where to complain
      </h2>
      <p className="small" style={{color: 'var(--ink-2)'}}>
        Talk to the shop first. If that fails, DTI can call them to a meeting. It's free.
      </p>
      {isLoading ? (
        <div className="skel" style={{height: 120, borderRadius: 'var(--radius-md)'}} aria-hidden />
      ) : error ? (
        <p className="small muted">The office list didn't load. You can still draft the letter.</p>
      ) : offices?.length ? (
        <OfficeMap
          offices={offices}
          selectedId={officeId}
          onSelect={setOfficeId}
          compact
          autoLocate={false}
          onUse={o => navigate(`/files/${file.id}/letter?office=${o.id}`)}
          useLabel="Write to this office"
        />
      ) : null}
      {thin && (
        <p className="note row" style={{alignItems: 'flex-start'}}>
          <AlertTriangle size={16} aria-hidden style={{flexShrink: 0, marginTop: 2}} /> Add the shop and at least one visit first. The letter only uses what's in this file.
        </p>
      )}
      <Link
        to={`/files/${file.id}/letter${officeId ? `?office=${officeId}` : ''}`}
        className={`btn btn--primary ${thin ? 'is-disabled' : ''}`}
        aria-disabled={thin}
        onClick={e => thin && e.preventDefault()}>
        {latest ? 'Open your draft letter' : 'Draft my complaint'}
      </Link>
    </section>
  )
}

function FileActions({file}: {file: RepairFileDetail}) {
  const save = useSaveFileMutation()
  const del = useDeleteFileMutation()
  const navigate = useNavigate()
  const [confirm, setConfirm] = React.useState(false)
  const closed = file.status === 'closed'

  return (
    <section className="stack" aria-label="File actions" style={{gap: 'var(--space-2)'}}>
      <Link to={`/files/${file.id}/pack`} className="btn btn--secondary btn--block">
        <Printer size={18} aria-hidden /> Save the timeline as PDF
      </Link>
      <Button
        variant="ghost"
        block
        loading={save.isPending}
        onClick={() =>
          save.mutate(
            {id: file.id, values: {status: closed ? 'open' : 'closed'}},
            {
              onSuccess: () => toast(closed ? 'File reopened.' : 'File closed. You can reopen it any time.'),
              onError: e => toast(errorMessage(e), 'error'),
            },
          )
        }>
        {closed ? 'Reopen the file' : 'Close the file, it is fixed'}
      </Button>
      <Button variant="ghost" block onClick={() => setConfirm(true)} style={{color: 'var(--brand-text)'}}>
        <Trash2 size={18} aria-hidden /> Delete the file
      </Button>
      <Dialog open={confirm} onClose={() => setConfirm(false)} title="Delete this repair file?">
        <p>
          This deletes {plural(file.visits.length, 'visit')}, {plural(file.attachments.length, 'photo or PDF', 'photos and PDFs')}, the job slip, and any
          letters. The shop link stops working. This can't be undone.
        </p>
        <div className="dlg__foot">
          <Button variant="ghost" onClick={() => setConfirm(false)}>
            Keep it
          </Button>
          <Button
            variant="danger"
            loading={del.isPending}
            onClick={() =>
              del.mutate(file, {
                onSuccess: () => {
                  toast('File deleted.')
                  navigate('/files', {replace: true})
                },
                onError: e => toast(errorMessage(e), 'error'),
              })
            }>
            Delete file
          </Button>
        </div>
      </Dialog>
    </section>
  )
}
