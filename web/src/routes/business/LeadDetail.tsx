import React from 'react'
import {Link, useNavigate, useParams} from 'react-router-dom'
import {CalendarDays, Check, Lock, Photo, Trash2} from '@/components/icons'
import {businessError, roleAtLeast} from '@/lib/business'
import {activityText, dueState, SHARE_FIELD_INFO, sortStages, todayManila, warrantyFollowUpDate} from '@/lib/crm'
import {formatDate, formatPrice, timeAgo} from '@/lib/format'
import {ITEM_KINDS, kindLabel, type ItemKind} from '@/lib/kinds'
import {toast} from '@/stores/ui'
import {useMembersQuery, type MyShop} from '@/state/queries/business'
import {useChatPeopleQuery, useChatRealtime, useLeadChatQuery} from '@/state/queries/chat'
import {ChatThread} from '@/components/ChatThread'
import {
  useAddFollowUpMutation,
  useAddNoteMutation,
  useDeleteLeadMutation,
  useFollowUpDoneMutation,
  useLeadQuery,
  useSharedFileQuery,
  useSharedPhotoUrls,
  useStagesQuery,
  useUpdateCustomerMutation,
  useUpdateLeadMutation,
  type LeadDetail,
} from '@/state/queries/crm'
import type {PipelineStageRow, SharedFile} from '@/types/business'
import {Alert, Button, CardSkeletons, Dialog, EmptyState, ErrorState, PageHead, Spinner} from '@/components/ui'
import {shopLink, useCurrentShop} from './shared'

export function LeadDetailPage() {
  const {shop, isLoading, error, refetch} = useCurrentShop()
  if (isLoading) return <Spinner />
  if (error) return <ErrorState error={error} onRetry={refetch} />
  if (!shop) {
    return (
      <div className="container page">
        <EmptyState
          title="This shop isn't on your list"
          action={
            <Link to="/business" className="btn btn--secondary">
              Show my shops
            </Link>
          }
        />
      </div>
    )
  }
  return <Lead shop={shop} />
}

function Lead({shop}: {shop: MyShop}) {
  const {id = ''} = useParams()
  const {data, isLoading, error, refetch} = useLeadQuery(id)
  const {data: stages} = useStagesQuery(shop.id)
  const canEdit = roleAtLeast(shop.role, 'member')
  const {data: members} = useMembersQuery(shop.id, canEdit)
  const back = {to: shopLink('/business/leads', shop.id), label: 'Leads'}

  if (isLoading) {
    return (
      <div className="container page" style={{maxWidth: 1000}}>
        <CardSkeletons count={3} height={140} />
      </div>
    )
  }
  if (error) return <ErrorState error={error} onRetry={refetch} />
  if (!data || data.lead.org_id !== shop.id) {
    return (
      <div className="container page">
        <PageHead back={back} title="Lead not found" />
        <EmptyState title="This lead isn't here">It may have been deleted, or it isn't given to you.</EmptyState>
      </div>
    )
  }

  const ordered = sortStages(stages ?? [])
  const stageName = (sid: string | null) => ordered.find(s => s.id === sid)?.name ?? 'a removed stage'
  const personName = (uid: string | null) => {
    const m = members?.find(x => x.user_id === uid)
    return m ? (m.name ?? m.email) : 'someone on the team'
  }

  return (
    <div className="container page" style={{maxWidth: 1000}}>
      <PageHead back={back} title={data.lead.title} description={`Added ${formatDate(data.lead.created_at, 'D MMM YYYY')}`} />
      <div className="lead-layout">
        <div className="stack" style={{gap: 'var(--space-5)'}}>
          <JobCard shop={shop} detail={data} stages={ordered} canEdit={canEdit} members={members ?? []} />
          <LeadChat shop={shop} leadId={data.lead.id} />
          {data.lead.share_id && <SharedFileCard shareId={data.lead.share_id} canRead={canEdit} />}
          <Timeline shop={shop} detail={data} canEdit={canEdit} stageName={stageName} personName={personName} />
        </div>
        <div className="stack" style={{gap: 'var(--space-5)'}}>
          <CustomerCard shop={shop} detail={data} canEdit={canEdit} />
          <FollowUps shop={shop} detail={data} canEdit={canEdit} />
          {roleAtLeast(shop.role, 'admin') && <DeleteLead shop={shop} leadId={data.lead.id} />}
        </div>
      </div>
    </div>
  )
}

/** The team's chat about this job. Everyone who can see the lead can read and write here. */
function LeadChat({shop, leadId}: {shop: MyShop; leadId: string}) {
  const chat = useLeadChatQuery(leadId)
  const {data: people = []} = useChatPeopleQuery(shop.id)
  useChatRealtime(shop.id)
  return (
    <section className="card card--pad stack lead-chat" aria-labelledby="lead-chat-title" style={{gap: 'var(--space-3)'}}>
      <div className="row row--between">
        <h2 id="lead-chat-title" style={{fontSize: 'var(--text-lg)'}}>
          Team chat
        </h2>
        {chat.data && (
          <Link to={`${shopLink('/business/chat', shop.id)}&c=${chat.data}`} className="link small">
            Open in Chat
          </Link>
        )}
      </div>
      {chat.isLoading ? (
        <CardSkeletons count={2} height={56} />
      ) : chat.error ? (
        <ErrorState error={chat.error} onRetry={chat.refetch} />
      ) : (
        chat.data && (
          <ChatThread
            orgId={shop.id}
            channelId={chat.data}
            people={people}
            canModerate={roleAtLeast(shop.role, 'admin')}
            placeholder="Message the team about this job"
            emptyText="No messages yet. Everyone who can see this lead can read them."
          />
        )
      )}
    </section>
  )
}

function JobCard({
  shop,
  detail,
  stages,
  canEdit,
  members,
}: {
  shop: MyShop
  detail: LeadDetail
  stages: PipelineStageRow[]
  canEdit: boolean
  members: {user_id: string; name: string | null; email: string}[]
}) {
  const {lead} = detail
  const update = useUpdateLeadMutation(shop.id, lead.id)
  const [quote, setQuote] = React.useState(lead.quote_amount?.toString() ?? '')
  React.useEffect(() => setQuote(lead.quote_amount?.toString() ?? ''), [lead.quote_amount])
  const save = (patch: Parameters<typeof update.mutate>[0], msg: string) =>
    update.mutate(patch, {onSuccess: () => toast(msg)})
  const saveQuote = () => {
    const value = quote.trim() === '' ? null : Number(quote)
    if (value != null && (!Number.isFinite(value) || value < 0)) return toast('Enter the quote as a number, like 1800.', 'error')
    if (value !== lead.quote_amount) save({quote_amount: value}, 'Quote saved.')
  }

  const stage = stages.find(s => s.id === lead.stage_id)
  return (
    <section className="card card--pad stack" aria-labelledby="job-title" style={{gap: 'var(--space-4)'}}>
      <h2 id="job-title" style={{fontSize: 'var(--text-lg)'}}>
        The job
      </h2>
      {canEdit ? (
        <div className="lead-fields">
          <div className="field">
            <label className="label" htmlFor="job-stage">
              Stage
            </label>
            <select
              id="job-stage"
              className="select"
              value={lead.stage_id}
              disabled={update.isPending}
              onChange={e => save({stage_id: e.target.value}, `Moved to ${stages.find(s => s.id === e.target.value)?.name}.`)}>
              {stages.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="label" htmlFor="job-kind">
              Kind of repair
            </label>
            <select
              id="job-kind"
              className="select"
              value={lead.kind ?? ''}
              onChange={e => save({kind: (e.target.value || null) as ItemKind | null}, 'Saved.')}>
              <option value="">Not set</option>
              {ITEM_KINDS.map(k => (
                <option key={k} value={k}>
                  {kindLabel(k)}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="label" htmlFor="job-quote">
              Quote in pesos
            </label>
            <input
              id="job-quote"
              className="input"
              inputMode="decimal"
              value={quote}
              onChange={e => setQuote(e.target.value)}
              onBlur={saveQuote}
              onKeyDown={e => e.key === 'Enter' && saveQuote()}
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="job-assignee">
              Who's on it
            </label>
            <select
              id="job-assignee"
              className="select"
              value={lead.assignee_id ?? ''}
              onChange={e => save({assignee_id: e.target.value || null}, 'Saved.')}>
              <option value="">No one yet</option>
              {members.map(m => (
                <option key={m.user_id} value={m.user_id}>
                  {m.name ?? m.email}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        <dl className="small stack" style={{gap: 'var(--space-2)'}}>
          <div>
            <dt className="strong">Stage</dt>
            <dd>{stage?.name}</dd>
          </div>
          <div>
            <dt className="strong">Kind of repair</dt>
            <dd>{lead.kind ? kindLabel(lead.kind) : 'Not set'}</dd>
          </div>
          <div>
            <dt className="strong">Quote</dt>
            <dd>{lead.quote_amount != null ? formatPrice(lead.quote_amount) : 'No quote yet'}</dd>
          </div>
        </dl>
      )}
      {update.error && <Alert>{businessError(update.error, "We couldn't save that. Try again.")}</Alert>}
    </section>
  )
}

function SharedFileCard({shareId, canRead}: {shareId: string; canRead: boolean}) {
  const {data: file, isLoading, error, refetch} = useSharedFileQuery(canRead ? shareId : null)
  const paths = [...(file?.photos ?? []), ...(file?.estimates ?? [])].map(p => p.path)
  const {data: urls} = useSharedPhotoUrls(paths)

  return (
    <section className="card card--pad stack" aria-labelledby="shared-title" style={{gap: 'var(--space-3)'}}>
      <h2 id="shared-title" style={{fontSize: 'var(--text-lg)'}} className="row">
        <Lock size={18} aria-hidden /> Shared repair file
      </h2>
      {!canRead ? (
        <p className="small muted">Only members, admins, and owners can see what a customer shared.</p>
      ) : isLoading ? (
        <CardSkeletons count={1} height={100} />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : !file ? (
        <p className="small">The customer stopped sharing this repair file. You can still see the lead and your notes.</p>
      ) : (
        <SharedFileBody file={file} urls={urls ?? {}} />
      )}
    </section>
  )
}

function SharedFileBody({file, urls}: {file: SharedFile; urls: Record<string, string>}) {
  return (
    <>
      <p className="small muted">
        Read-only. Shared {formatDate(file.shared_at, 'D MMM YYYY')}:{' '}
        {file.fields.map(f => SHARE_FIELD_INFO[f as keyof typeof SHARE_FIELD_INFO]?.label ?? f).join(', ')}.
      </p>
      <dl className="small stack" style={{gap: 'var(--space-2)'}}>
        <div>
          <dt className="strong">What's wrong</dt>
          <dd>
            {file.problem} <span className="muted">(since {formatDate(file.started_at, 'D MMM YYYY')})</span>
          </dd>
        </div>
        {file.item && (
          <div>
            <dt className="strong">Item</dt>
            <dd>{[file.item.make, file.item.model, file.item.year].filter(Boolean).join(' ') || 'No details'}</dd>
          </div>
        )}
        {file.plate && (
          <div>
            <dt className="strong">Plate or serial</dt>
            <dd>{[file.plate.plate_no, file.plate.vin_last6 && `VIN ending ${file.plate.vin_last6}`].filter(Boolean).join(', ') || 'None saved'}</dd>
          </div>
        )}
        {file.contact && (
          <div>
            <dt className="strong">Customer</dt>
            <dd>{[file.contact.name, file.contact.mobile].filter(Boolean).join(', ') || 'None saved'}</dd>
          </div>
        )}
        {file.slip && (
          <div>
            <dt className="strong">Job slip</dt>
            <dd>
              {file.slip.job_text}
              {file.slip.peso_cap != null && `. Price limit ${formatPrice(file.slip.peso_cap)}`}
              {file.slip.dropoff_at && `. Dropped off ${formatDate(file.slip.dropoff_at, 'D MMM YYYY')}`}.
            </dd>
          </div>
        )}
      </dl>
      {file.visits && file.visits.length > 0 && (
        <div>
          <p className="strong small">Visits</p>
          <ul className="small stack" style={{gap: 'var(--space-1)', paddingLeft: 'var(--space-5)'}}>
            {file.visits.map((v, i) => (
              <li key={i}>
                {formatDate(v.date_in, 'D MMM YYYY')}
                {v.amount_paid != null && `, paid ${formatPrice(v.amount_paid)}`}
                {v.shop_said && `. Shop said: ${v.shop_said}`}
                {v.story && `. ${v.story}`}
              </li>
            ))}
          </ul>
        </div>
      )}
      {[...(file.photos ?? []), ...(file.estimates ?? [])].length > 0 && (
        <ul className="shared-photos">
          {[...(file.photos ?? []), ...(file.estimates ?? [])].map(p => (
            <li key={p.path}>
              {urls[p.path] ? (
                p.path.toLowerCase().endsWith('.pdf') ? (
                  <a href={urls[p.path]} target="_blank" rel="noreferrer" className="btn btn--secondary btn--sm">
                    Open PDF
                  </a>
                ) : (
                  <a href={urls[p.path]} target="_blank" rel="noreferrer">
                    <img src={urls[p.path]} alt={p.caption ?? 'Shared photo'} loading="lazy" />
                  </a>
                )
              ) : (
                <span className="shared-photos__empty" aria-label="Loading photo">
                  <Photo size={20} aria-hidden />
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

function CustomerCard({shop, detail, canEdit}: {shop: MyShop; detail: LeadDetail; canEdit: boolean}) {
  const c = detail.customer
  const update = useUpdateCustomerMutation()
  const [editing, setEditing] = React.useState(false)
  const [form, setForm] = React.useState({name: '', mobile: '', email: '', notes: ''})
  const open = () => {
    if (!c) return
    setForm({name: c.name, mobile: c.mobile ?? '', email: c.email ?? '', notes: c.notes ?? ''})
    setEditing(true)
  }
  if (!c) return null
  return (
    <section className="card card--pad stack" aria-labelledby="cust-title" style={{gap: 'var(--space-3)'}}>
      <div className="row row--between">
        <h2 id="cust-title" style={{fontSize: 'var(--text-lg)'}}>
          Customer
        </h2>
        {canEdit && (
          <Button variant="ghost" size="sm" onClick={open}>
            Edit
          </Button>
        )}
      </div>
      <p className="strong">{c.name}</p>
      {c.mobile && (
        <a className="link small" href={`tel:${c.mobile.replace(/[^\d+]/g, '')}`}>
          {c.mobile}
        </a>
      )}
      {c.email && <p className="small">{c.email}</p>}
      {c.notes && <p className="small muted" style={{whiteSpace: 'pre-wrap'}}>{c.notes}</p>}
      {c.source === 'share' && (
        <p className="xsmall muted">
          From Kumpooni. Their name and mobile show under the shared file only if they shared them.
        </p>
      )}
      <Link to={shopLink('/business/customers', shop.id)} className="link small">
        All customers
      </Link>

      <Dialog open={editing} onClose={() => setEditing(false)} title="Edit customer">
        <form
          className="stack"
          style={{gap: 'var(--space-4)'}}
          onSubmit={e => {
            e.preventDefault()
            if (!form.name.trim()) return
            update.mutate({id: c.id, ...form}, {onSuccess: () => (setEditing(false), toast('Saved.'))})
          }}>
          {(['name', 'mobile', 'email'] as const).map(k => (
            <div className="field" key={k}>
              <label className="label" htmlFor={`cust-${k}`}>
                {k === 'name' ? 'Name' : k === 'mobile' ? 'Mobile' : 'Email'}
              </label>
              <input
                id={`cust-${k}`}
                className="input"
                value={form[k]}
                inputMode={k === 'mobile' ? 'tel' : undefined}
                onChange={e => setForm(f => ({...f, [k]: e.target.value}))}
              />
            </div>
          ))}
          <div className="field">
            <label className="label" htmlFor="cust-notes">
              Notes
            </label>
            <textarea id="cust-notes" className="textarea" rows={3} maxLength={2000} value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} />
          </div>
          {update.error && <Alert>{businessError(update.error)}</Alert>}
          <div className="dlg__foot">
            <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={update.isPending} disabled={!form.name.trim()}>
              Save
            </Button>
          </div>
        </form>
      </Dialog>
    </section>
  )
}

function FollowUps({shop, detail, canEdit}: {shop: MyShop; detail: LeadDetail; canEdit: boolean}) {
  const add = useAddFollowUpMutation(shop.id, detail.lead.id)
  const done = useFollowUpDoneMutation(shop.id)
  const [dueOn, setDueOn] = React.useState('')
  const [note, setNote] = React.useState('')
  const [warranty, setWarranty] = React.useState(false)
  const shared = useSharedFileQuery(canEdit && detail.lead.share_id ? detail.lead.share_id : null).data
  const slipDate = shared?.slip?.dropoff_at?.slice(0, 10)
  const [jobDate, setJobDate] = React.useState('')
  const [days, setDays] = React.useState('30')
  const today = todayManila()
  const warrantyDue = warrantyFollowUpDate(jobDate || slipDate || today, Number(days))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const due = warranty ? warrantyDue : dueOn
    if (!due) return toast(warranty ? 'Enter the warranty in days, like 30.' : 'Pick a date.', 'error')
    add.mutate(
      {dueOn: due, reason: warranty ? 'warranty_end' : 'manual', note},
      {
        onSuccess: () => {
          toast(`Follow-up set for ${formatDate(due, 'D MMM YYYY')}.`)
          setDueOn('')
          setNote('')
        },
      },
    )
  }

  const open = detail.followUps.filter(f => !f.done_at)
  return (
    <section className="card card--pad stack" aria-labelledby="fu-title" style={{gap: 'var(--space-3)'}}>
      <h2 id="fu-title" style={{fontSize: 'var(--text-lg)'}} className="row">
        <CalendarDays size={18} aria-hidden /> Follow-ups
      </h2>
      {open.length === 0 ? (
        <p className="small muted">No follow-ups. Add one so the job doesn't slip.</p>
      ) : (
        <ul className="stack" style={{listStyle: 'none', gap: 'var(--space-2)'}}>
          {open.map(f => {
            const state = dueState(f.due_on, today)
            return (
              <li key={f.id} className="row row--between" style={{gap: 'var(--space-2)'}}>
                <span className="small">
                  <span className={state === 'overdue' ? 'strong' : undefined}>
                    {state === 'overdue' ? 'Overdue: ' : state === 'today' ? 'Today: ' : ''}
                    {formatDate(f.due_on, 'D MMM YYYY')}
                  </span>
                  {f.reason === 'warranty_end' && ', warranty ended'}
                  {f.note && <span className="muted"> · {f.note}</span>}
                </span>
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    loading={done.isPending && done.variables?.id === f.id}
                    onClick={() => done.mutate({id: f.id, leadId: f.lead_id, done: true})}>
                    <Check size={16} aria-hidden /> Done
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      )}
      {canEdit && (
        <form className="stack" onSubmit={submit} style={{gap: 'var(--space-3)', borderTop: '1px solid var(--line)', paddingTop: 'var(--space-3)'}}>
          <div className="segmented" role="group" aria-label="Kind of follow-up">
            <button type="button" aria-pressed={!warranty} onClick={() => setWarranty(false)}>
              On a date
            </button>
            <button type="button" aria-pressed={warranty} onClick={() => setWarranty(true)}>
              After the warranty
            </button>
          </div>
          {warranty ? (
            <div className="lead-fields">
              <div className="field">
                <label className="label" htmlFor="fu-job">
                  Job date
                </label>
                <input id="fu-job" className="input" type="date" value={jobDate || slipDate || today} onChange={e => setJobDate(e.target.value)} />
                {slipDate && !jobDate && <p className="help">From the job slip.</p>}
              </div>
              <div className="field">
                <label className="label" htmlFor="fu-days">
                  Warranty in days
                </label>
                <input id="fu-days" className="input" inputMode="numeric" value={days} onChange={e => setDays(e.target.value.replace(/\D/g, ''))} />
              </div>
              <p className="small" style={{gridColumn: '1 / -1'}}>
                {warrantyDue ? `We'll remind you on ${formatDate(warrantyDue, 'D MMM YYYY')}, the day after it ends.` : 'Enter the warranty in days.'}
              </p>
            </div>
          ) : (
            <div className="field">
              <label className="label" htmlFor="fu-date">
                Date
              </label>
              <input id="fu-date" className="input" type="date" min={today} value={dueOn} onChange={e => setDueOn(e.target.value)} />
            </div>
          )}
          <div className="field">
            <label className="label" htmlFor="fu-note">
              Note <span className="muted">(optional)</span>
            </label>
            <input id="fu-note" className="input" maxLength={500} placeholder="Ask how the brakes feel" value={note} onChange={e => setNote(e.target.value)} />
          </div>
          {add.error && <Alert>{businessError(add.error)}</Alert>}
          <Button type="submit" variant="secondary" loading={add.isPending}>
            {warranty ? 'Remind me after the warranty ends' : 'Add follow-up'}
          </Button>
        </form>
      )}
    </section>
  )
}

function Timeline({
  shop,
  detail,
  canEdit,
  stageName,
  personName,
}: {
  shop: MyShop
  detail: LeadDetail
  canEdit: boolean
  stageName: (id: string | null) => string
  personName: (id: string | null) => string
}) {
  const add = useAddNoteMutation(shop.id, detail.lead.id)
  const [note, setNote] = React.useState('')
  const items = [...detail.activities].reverse()
  return (
    <section className="card card--pad stack" aria-labelledby="tl-title" style={{gap: 'var(--space-4)'}}>
      <h2 id="tl-title" style={{fontSize: 'var(--text-lg)'}}>
        Timeline
      </h2>
      {canEdit && (
        <form
          className="stack"
          style={{gap: 'var(--space-2)'}}
          onSubmit={e => {
            e.preventDefault()
            if (note.trim()) add.mutate(note, {onSuccess: () => setNote('')})
          }}>
          <label className="label" htmlFor="tl-note">
            Add a note
          </label>
          <textarea id="tl-note" className="textarea" rows={2} maxLength={2000} value={note} onChange={e => setNote(e.target.value)} placeholder="Called. Customer comes in Saturday." />
          {add.error && <Alert>{businessError(add.error)}</Alert>}
          <Button type="submit" variant="secondary" size="sm" loading={add.isPending} disabled={!note.trim()}>
            Save note
          </Button>
        </form>
      )}
      <ol className="timeline">
        {items.map(a => (
          <li key={a.id} className={a.type === 'note' ? 'timeline__note' : undefined}>
            <p className="small" style={{whiteSpace: a.type === 'note' ? 'pre-wrap' : undefined}}>
              {activityText(a, stageName, personName, formatPrice)}
            </p>
            <p className="xsmall muted">
              {a.actor_id ? `${personName(a.actor_id)} · ` : ''}
              <time dateTime={a.created_at}>{timeAgo(a.created_at)}</time>
            </p>
          </li>
        ))}
      </ol>
    </section>
  )
}

function DeleteLead({shop, leadId}: {shop: MyShop; leadId: string}) {
  const navigate = useNavigate()
  const del = useDeleteLeadMutation(shop.id)
  const [confirm, setConfirm] = React.useState(false)
  return (
    <>
      <Button variant="ghost" onClick={() => setConfirm(true)}>
        <Trash2 size={18} aria-hidden /> Delete lead
      </Button>
      <Dialog open={confirm} onClose={() => setConfirm(false)} title="Delete this lead?">
        <p>This removes the lead, its notes, and its follow-ups. You can't undo this. The customer stays on your list.</p>
        {del.error && <Alert>{businessError(del.error)}</Alert>}
        <div className="dlg__foot">
          <Button variant="ghost" onClick={() => setConfirm(false)}>
            Keep it
          </Button>
          <Button
            variant="danger"
            loading={del.isPending}
            onClick={() =>
              del.mutate(leadId, {
                onSuccess: () => {
                  toast('Lead deleted.')
                  navigate(shopLink('/business/leads', shop.id), {replace: true})
                },
              })
            }>
            Delete lead
          </Button>
        </div>
      </Dialog>
    </>
  )
}
