import React from 'react'
import {Link, useParams, useSearchParams} from 'react-router-dom'
import {AlertTriangle, Copy, FileText, Mail, Printer, Sparkles} from '@/components/icons'
import {Alert, Button, EmptyState, ErrorState, PageHead, Spinner} from '@/components/ui'
import {OfficeMap} from '@/components/OfficeMap'
import {copyText} from '@/routes/FileDetail'
import {
  LETTER_DISCLAIMER,
  LETTER_TYPE_LABEL,
  REMEDY_LABEL,
  composeLetter,
  letterBlocker,
  letterFrame,
  recipientLines,
  templateBody,
  type LetterContext,
  type LetterOptions,
} from '@/lib/letter'
import {ownerOf} from '@/lib/repair'
import type {Coords} from '@/lib/geo'
import {errorMessage, timeAgo} from '@/lib/format'
import {useSession} from '@/state/session'
import {
  draftErrorMessage,
  useDraftLetterMutation,
  useFileQuery,
  useOfficesQuery,
  useSaveLetterMutation,
  type RepairFileDetail,
} from '@/state/queries/repair'
import {toast} from '@/stores/ui'
import type {LetterLanguage, LetterRow, LetterType, Remedy} from '@/types/repair-proof'

export function LetterPage() {
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
  return <LetterEditor file={file} />
}

function LetterEditor({file}: {file: RepairFileDetail}) {
  const [params] = useSearchParams()
  const {session} = useSession()
  const owner = ownerOf(session?.user)
  const latest: LetterRow | undefined = file.letters[0]
  const {data: offices = [], isLoading: officesLoading} = useOfficesQuery()
  const draft = useDraftLetterMutation(file.id)
  const saveLetter = useSaveLetterMutation(file.id)

  const [letterId, setLetterId] = React.useState<string | undefined>(latest?.id)
  const [opts, setOpts] = React.useState<LetterOptions>({
    type: latest?.letter_type ?? 'dti',
    remedy: latest?.remedy ?? 'repair',
    language: latest?.language ?? 'en',
  })
  const [officeId, setOfficeId] = React.useState<number | null>(
    Number(params.get('office')) || latest?.office_id || null,
  )
  const [body, setBody] = React.useState(latest ? (latest.edited_text ?? latest.draft_text) : '')
  const [source, setSource] = React.useState<string | null>(latest?.model ?? null)
  const [savedBody, setSavedBody] = React.useState(body)
  const [where, setWhere] = React.useState<Coords | null>(null)
  const [draftError, setDraftError] = React.useState<string | null>(null)

  const ctx: LetterContext = {
    file,
    visits: file.visits,
    attachments: file.attachments,
    slip: file.job_slip,
    owner: {name: owner.name || 'Your name', mobile: owner.mobile},
  }
  const blocker = letterBlocker(ctx)
  const office = opts.type === 'dti' ? (offices.find(o => o.id === officeId) ?? null) : null
  const frame = letterFrame(ctx, opts, office)
  const full = body ? composeLetter(ctx, opts, office, body) : ''
  const dirty = body !== savedBody

  const set = <K extends keyof LetterOptions>(k: K, v: LetterOptions[K]) => setOpts(o => ({...o, [k]: v}))

  const askAi = () => {
    setDraftError(null)
    draft.mutate(
      {
        file_id: file.id,
        office_id: office?.id ?? null,
        letter_type: opts.type,
        remedy: opts.remedy,
        language: opts.language,
        owner_lat: where?.lat ?? null,
        owner_lng: where?.lng ?? null,
      },
      {
        onSuccess: row => {
          setLetterId(row.id)
          setBody(row.draft_text)
          setSavedBody(row.draft_text)
          setSource(row.model)
          toast('Draft ready. Read it and fix anything that is wrong.')
        },
        onError: e => setDraftError(draftErrorMessage((e as {code?: string}).code ?? 'failed')),
      },
    )
  }

  const useTemplate = () => {
    setDraftError(null)
    const text = templateBody(ctx, opts)
    saveLetter.mutate(
      {
        values: {
          office_id: office?.id ?? null,
          letter_type: opts.type,
          remedy: opts.remedy,
          language: opts.language,
          owner_lat: where?.lat ?? null,
          owner_lng: where?.lng ?? null,
          draft_text: text,
          model: 'template',
        },
      },
      {
        onSuccess: row => {
          setLetterId(row.id)
          setBody(text)
          setSavedBody(text)
          setSource('template')
          toast('Plain letter ready. Read it and fix anything that is wrong.')
        },
        onError: e => toast(errorMessage(e), 'error'),
      },
    )
  }

  const save = () =>
    saveLetter.mutate(
      {
        id: letterId,
        values: letterId
          ? {edited_text: body, office_id: office?.id ?? null, letter_type: opts.type, remedy: opts.remedy, language: opts.language}
          : {
              draft_text: body,
              model: 'template',
              office_id: office?.id ?? null,
              letter_type: opts.type,
              remedy: opts.remedy,
              language: opts.language,
            },
      },
      {
        onSuccess: row => {
          setLetterId(row.id)
          setSavedBody(body)
          toast('Letter saved.')
        },
        onError: e => toast(errorMessage(e), 'error'),
      },
    )

  // Mail apps cut long mailto links, so very long letters go in by paste.
  const mailto =
    office?.email && full
      ? `mailto:${office.email}?subject=${encodeURIComponent(frame.subject)}&body=${encodeURIComponent(
          full.length > 1800 ? 'Paste the letter here. Use “Copy” in Kumpooni first.' : full,
        )}`
      : null

  return (
    <div className="container page">
      <div className="no-print">
        <PageHead
          back={{to: `/files/${file.id}`, label: 'Back to the file'}}
          title="Your complaint letter"
          description="Built only from what's in this file. Nothing is sent until you send it."
        />
        <p className="disclaimer" role="note">
          <AlertTriangle size={18} aria-hidden /> {LETTER_DISCLAIMER}
        </p>
      </div>

      {blocker ? (
        <EmptyState
          title="Not enough in the file yet"
          action={
            <Link to={`/files/${file.id}`} className="btn btn--primary">
              Add a visit
            </Link>
          }>
          {blocker} The letter only uses facts you saved, so it needs at least one visit.
        </EmptyState>
      ) : (
        <div className="split letter-split">
          <div className="stack no-print" style={{gap: 'var(--space-6)'}}>
            <section className="card card--pad stack" aria-label="Letter options" style={{gap: 'var(--space-5)'}}>
              <Choice<LetterType>
                label="What kind of letter?"
                value={opts.type}
                onChange={v => set('type', v)}
                options={LETTER_TYPE_LABEL}
              />
              {opts.type !== 'records' && (
                <Choice<Remedy> label="What do you want?" value={opts.remedy} onChange={v => set('remedy', v)} options={REMEDY_LABEL} />
              )}
              <Choice<LetterLanguage>
                label="Language"
                value={opts.language}
                onChange={v => set('language', v)}
                options={{en: 'English', fil: 'Filipino'}}
                segmented
              />
            </section>

            {opts.type === 'dti' && (
              <section className="stack" aria-labelledby="office-title" style={{gap: 'var(--space-3)'}}>
                <h2 id="office-title" className="section-title">
                  Nearest DTI office
                </h2>
                {officesLoading ? (
                  <div className="skel" style={{height: 240, borderRadius: 'var(--radius-md)'}} aria-hidden />
                ) : offices.length ? (
                  <OfficeMap offices={offices} selectedId={officeId} onSelect={setOfficeId} onLocation={setWhere} />
                ) : (
                  <p className="note">The office list didn't load. The letter will say “DTI” without an address.</p>
                )}
                {file.vehicle?.kind === 'motorcycle' && (
                  <p className="note">For motorcycles, DTI uses the Consumer Act (RA 7394), not the Lemon Law.</p>
                )}
                {file.vehicle?.kind === 'construction' && (
                  <p className="note">
                    For a contractor, DTI may send you to PCAB (the contractor license board) or small claims court. The
                    letter still helps, so keep it.
                  </p>
                )}
              </section>
            )}

            <section className="card card--pad stack" aria-label="Make the draft" style={{gap: 'var(--space-3)'}}>
              <div className="row" style={{flexWrap: 'wrap', gap: 'var(--space-2)'}}>
                <Button size="lg" onClick={askAi} loading={draft.isPending}>
                  <Sparkles size={18} aria-hidden /> {body ? 'Draft it again' : 'Draft my complaint'}
                </Button>
                <Button size="lg" variant="secondary" onClick={useTemplate} loading={saveLetter.isPending && !letterId}>
                  <FileText size={18} aria-hidden /> Use the plain template
                </Button>
              </div>
              <p className="small muted">
                The AI only gets your file: dates, what you and the shop said, amounts, and what you uploaded. It can't add facts.
              </p>
              {draftError && <Alert>{draftError}</Alert>}
              {body && dirty && <p className="small muted">Drafting again replaces your edits. Save first if you want to keep them.</p>}
            </section>
          </div>

          <section className="stack" aria-label="Letter" style={{gap: 'var(--space-3)'}}>
            {body ? (
              <>
                <div className="letter no-print">
                  <pre className="letter__head">{frame.head}</pre>
                  <label htmlFor="letter-body" className="visually-hidden">
                    Letter body
                  </label>
                  <textarea
                    id="letter-body"
                    className="letter__body"
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    rows={Math.min(40, Math.max(14, body.split('\n').length + 4))}
                  />
                  {frame.foot && <pre className="letter__foot">{frame.foot}</pre>}
                </div>
                <p className="xsmall muted no-print">
                  {source === 'template' ? 'Plain template' : source ? 'AI draft' : 'Draft'}
                  {latest?.updated_at && !dirty ? `, saved ${timeAgo(latest.updated_at)}` : dirty ? ', not saved yet' : ''}. Edit the body above. The
                  addresses update when you change the office.
                </p>
                <div className="letter-actions no-print">
                  <Button onClick={save} loading={saveLetter.isPending && !!letterId} disabled={!dirty && !!letterId}>
                    Save the letter
                  </Button>
                  <Button variant="secondary" onClick={() => copyText(full, 'Letter copied.')}>
                    <Copy size={18} aria-hidden /> Copy
                  </Button>
                  <Button variant="secondary" onClick={() => window.print()}>
                    <Printer size={18} aria-hidden /> Save as PDF
                  </Button>
                  {mailto && (
                    <a className="btn btn--ghost" href={mailto}>
                      <Mail size={18} aria-hidden /> Open in email
                    </a>
                  )}
                </div>
                {opts.type === 'dti' && (
                  <p className="small muted no-print">
                    Attach copies of the documents listed in the letter. Bring a valid ID if you file in person. Get the{' '}
                    <Link to={`/files/${file.id}/pack`} className="link">
                      timeline PDF
                    </Link>{' '}
                    too.
                  </p>
                )}
                <pre className="print-only letter-print">{full}</pre>
                <p className="print-only xsmall">{LETTER_DISCLAIMER}</p>
              </>
            ) : (
              <div className="letter letter--empty no-print">
                <pre className="letter__head">{recipientPreview(opts.type, office, file)}</pre>
                <p className="muted">Your letter appears here. Pick the options, then draft it.</p>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

function recipientPreview(type: LetterType, office: Parameters<typeof recipientLines>[1], file: RepairFileDetail) {
  const to = recipientLines(type, office, file)
  return to.length ? to.join('\n') : 'For your own records'
}

function Choice<T extends string>({
  label,
  value,
  onChange,
  options,
  segmented,
}: {
  label: string
  value: T
  onChange: (v: T) => void
  options: Record<T, string>
  segmented?: boolean
}) {
  const id = React.useId()
  return (
    <div className="field">
      <span className="label" id={id}>
        {label}
      </span>
      <div className={segmented ? 'segmented' : 'chips chips--wrap'} role="radiogroup" aria-labelledby={id}>
        {(Object.keys(options) as T[]).map(k => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={value === k}
            aria-pressed={segmented ? value === k : undefined}
            className={segmented ? undefined : 'chip'}
            onClick={() => onChange(k)}>
            {options[k]}
          </button>
        ))}
      </div>
    </div>
  )
}
