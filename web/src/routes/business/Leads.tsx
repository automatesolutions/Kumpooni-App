import React from 'react'
import {Link, useNavigate, useSearchParams} from 'react-router-dom'
import {useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import {z} from 'zod'
import {ClipboardList, Plus} from '@/components/icons'
import {businessError, roleAtLeast} from '@/lib/business'
import {MANUAL_CONSENT_TEXT, moveTargets, sortStages} from '@/lib/crm'
import {formatPrice, timeAgo} from '@/lib/format'
import {ITEM_KINDS, kindLabel, type ItemKind} from '@/lib/kinds'
import {toast} from '@/stores/ui'
import type {MyShop} from '@/state/queries/business'
import {
  useCreateManualLeadMutation,
  useCustomersQuery,
  useLeadsQuery,
  useMoveLeadMutation,
  useStagesQuery,
  type LeadWithCustomer,
} from '@/state/queries/crm'
import type {PipelineStageRow} from '@/types/business'
import {Alert, Button, CardSkeletons, Dialog, EmptyState, ErrorState, PageHead, Spinner} from '@/components/ui'
import {BusinessNav} from './BusinessNav'
import {shopLink, useCurrentShop} from './shared'

type View = 'board' | 'list'

export function LeadsPage() {
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
  return <Leads shop={shop} />
}

function Leads({shop}: {shop: MyShop}) {
  const [params, setParams] = useSearchParams()
  const view: View = params.get('view') === 'list' ? 'list' : 'board'
  const {data: stages, isLoading: stagesLoading, error: stagesError, refetch: refetchStages} = useStagesQuery(shop.id)
  const {data: leads, isLoading, error, refetch} = useLeadsQuery(shop.id)
  const [adding, setAdding] = React.useState(false)
  const canEdit = roleAtLeast(shop.role, 'member')
  const ordered = sortStages(stages ?? [])

  const setView = (v: View) => {
    const next = new URLSearchParams(params)
    if (v === 'list') next.set('view', 'list')
    else next.delete('view')
    setParams(next, {replace: true})
  }

  return (
    <div className="container page">
      <BusinessNav shop={shop} />
      <PageHead
        title="Leads"
        description={
          canEdit
            ? 'Jobs and enquiries, from the first message to pickup.'
            : 'The jobs given to you. Ask a member of the team to change them.'
        }
        actions={
          canEdit && (
            <Button size="sm" onClick={() => setAdding(true)} disabled={!ordered.length}>
              <Plus size={16} aria-hidden /> Add a lead
            </Button>
          )
        }
      />

      <div className="segmented" role="group" aria-label="View" style={{marginBottom: 'var(--space-5)'}}>
        <button type="button" aria-pressed={view === 'board'} onClick={() => setView('board')}>
          Board
        </button>
        <button type="button" aria-pressed={view === 'list'} onClick={() => setView('list')}>
          List
        </button>
      </div>

      {isLoading || stagesLoading ? (
        <CardSkeletons count={3} height={120} />
      ) : error || stagesError ? (
        <ErrorState
          error={error ?? stagesError}
          onRetry={() => {
            refetch()
            refetchStages()
          }}
        />
      ) : !leads?.length ? (
        <EmptyState
          icon={<ClipboardList size={28} />}
          title={canEdit ? 'No leads yet' : 'No jobs given to you yet'}
          action={
            canEdit && (
              <Button onClick={() => setAdding(true)}>
                <Plus size={18} aria-hidden /> Add a lead
              </Button>
            )
          }>
          {canEdit
            ? 'Leads show here when a customer shares a repair with your shop, or when you add one.'
            : 'When someone gives you a job, it shows here.'}
        </EmptyState>
      ) : view === 'board' ? (
        <Board shop={shop} stages={ordered} leads={leads} canEdit={canEdit} />
      ) : (
        <List shop={shop} stages={ordered} leads={leads} canEdit={canEdit} />
      )}

      {canEdit && ordered.length > 0 && (
        <AddLeadDialog shop={shop} stages={ordered} open={adding} onClose={() => setAdding(false)} />
      )}
    </div>
  )
}

function Board({
  shop,
  stages,
  leads,
  canEdit,
}: {
  shop: MyShop
  stages: PipelineStageRow[]
  leads: LeadWithCustomer[]
  canEdit: boolean
}) {
  const move = useMoveLeadMutation(shop.id)
  const [over, setOver] = React.useState<string | null>(null)

  const onDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault()
    setOver(null)
    const leadId = e.dataTransfer.getData('text/kumpooni-lead')
    const lead = leads.find(l => l.id === leadId)
    if (lead && lead.stage_id !== stageId) moveLead(lead, stageId)
  }
  const moveLead = (lead: LeadWithCustomer, stageId: string) =>
    move.mutate(
      {leadId: lead.id, stageId},
      {
        onSuccess: () => toast(`Moved to ${stages.find(s => s.id === stageId)?.name}.`),
        onError: e => toast(businessError(e, "We couldn't move it. Try again."), 'error'),
      },
    )

  return (
    <div className="board" role="list" aria-label="Pipeline">
      {stages.map(stage => {
        const inStage = leads.filter(l => l.stage_id === stage.id)
        return (
          <section
            key={stage.id}
            role="listitem"
            className={`board__col ${over === stage.id ? 'board__col--over' : ''}`}
            aria-labelledby={`stage-${stage.id}`}
            onDragOver={
              canEdit
                ? e => {
                    e.preventDefault()
                    setOver(stage.id)
                  }
                : undefined
            }
            onDragLeave={() => setOver(o => (o === stage.id ? null : o))}
            onDrop={canEdit ? e => onDrop(e, stage.id) : undefined}>
            <h2 id={`stage-${stage.id}`} className="board__head">
              {stage.name} <span className="muted">{inStage.length}</span>
            </h2>
            <ul className="board__cards">
              {inStage.map(lead => (
                <LeadCard key={lead.id} shop={shop} lead={lead} stages={stages} canEdit={canEdit} onMove={moveLead} />
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

function LeadCard({
  shop,
  lead,
  stages,
  canEdit,
  onMove,
}: {
  shop: MyShop
  lead: LeadWithCustomer
  stages: PipelineStageRow[]
  canEdit: boolean
  onMove: (lead: LeadWithCustomer, stageId: string) => void
}) {
  const moveId = React.useId()
  return (
    <li
      className="card lead-card"
      draggable={canEdit}
      onDragStart={e => {
        e.dataTransfer.setData('text/kumpooni-lead', lead.id)
        e.dataTransfer.effectAllowed = 'move'
      }}>
      <Link to={shopLink(`/business/leads/${lead.id}`, shop.id)} className="lead-card__title">
        {lead.title}
      </Link>
      <p className="small muted">
        {[lead.customer?.name, lead.kind && kindLabel(lead.kind)].filter(Boolean).join(' · ')}
      </p>
      <p className="xsmall muted row row--between">
        <span>{lead.quote_amount != null ? formatPrice(lead.quote_amount) : 'No quote yet'}</span>
        <span>{timeAgo(lead.updated_at)}</span>
      </p>
      {lead.source === 'share' && <span className="status lead-card__tag">Shared from Kumpooni</span>}
      {canEdit && (
        <div className="field lead-card__move">
          <label className="visually-hidden" htmlFor={moveId}>
            Move {lead.title} to
          </label>
          <select
            id={moveId}
            className="select"
            value=""
            onChange={e => e.target.value && onMove(lead, e.target.value)}>
            <option value="">Move to</option>
            {moveTargets(stages, lead.stage_id).map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </li>
  )
}

function List({
  shop,
  stages,
  leads,
  canEdit,
}: {
  shop: MyShop
  stages: PipelineStageRow[]
  leads: LeadWithCustomer[]
  canEdit: boolean
}) {
  const move = useMoveLeadMutation(shop.id)
  const stageName = (id: string) => stages.find(s => s.id === id)?.name ?? ''
  return (
    <ul className="card biz-list">
      {leads.map(lead => (
        <li key={lead.id} className="biz-row">
          <div className="biz-row__main">
            <Link to={shopLink(`/business/leads/${lead.id}`, shop.id)} className="strong link">
              {lead.title}
            </Link>
            <p className="small muted">
              {[lead.customer?.name, lead.kind && kindLabel(lead.kind), lead.quote_amount != null && formatPrice(lead.quote_amount), timeAgo(lead.updated_at)]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
          <div className="biz-row__side">
            {canEdit ? (
              <>
                <label className="visually-hidden" htmlFor={`list-stage-${lead.id}`}>
                  Stage for {lead.title}
                </label>
                <select
                  id={`list-stage-${lead.id}`}
                  className="select"
                  value={lead.stage_id}
                  onChange={e =>
                    move.mutate(
                      {leadId: lead.id, stageId: e.target.value},
                      {onError: err => toast(businessError(err, "We couldn't move it. Try again."), 'error')},
                    )
                  }>
                  {stages.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </>
            ) : (
              <span className="status">{stageName(lead.stage_id)}</span>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}

const leadSchema = z
  .object({
    customerId: z.string(),
    name: z.string().trim().max(80, 'Keep the name under 80 letters.'),
    mobile: z.string().trim().max(30, 'That number is too long.'),
    email: z.union([z.literal(''), z.string().trim().email('Enter an email address, or leave it blank.')]),
    title: z.string().trim().min(2, 'Say what the job is, like "Brakes squeak".').max(120, 'Keep it under 120 letters.'),
    kind: z.union([z.literal(''), z.enum(ITEM_KINDS)]),
    quote: z.union([z.literal(''), z.coerce.number().min(0, 'The quote can’t be negative.')]),
    agree: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (!v.customerId && v.name.length < 1) ctx.addIssue({code: 'custom', path: ['name'], message: 'Enter the customer’s name.'})
    if (!v.customerId && !v.agree)
      ctx.addIssue({code: 'custom', path: ['agree'], message: 'Tick the box once the customer agrees.'})
  })
type LeadForm = z.infer<typeof leadSchema>

function AddLeadDialog({
  shop,
  stages,
  open,
  onClose,
}: {
  shop: MyShop
  stages: PipelineStageRow[]
  open: boolean
  onClose: () => void
}) {
  const navigate = useNavigate()
  const {data: customers} = useCustomersQuery(shop.id)
  const create = useCreateManualLeadMutation(shop.id)
  const {register, handleSubmit, watch, reset, formState} = useForm<LeadForm>({
    resolver: zodResolver(leadSchema),
    defaultValues: {customerId: '', name: '', mobile: '', email: '', title: '', kind: '', quote: '', agree: false},
  })
  const existing = watch('customerId')
  const errors = formState.errors

  const onSubmit = handleSubmit(v => {
    create.mutate(
      {
        customerId: v.customerId || null,
        customer: {name: v.name, mobile: v.mobile, email: v.email},
        title: v.title,
        kind: (v.kind || null) as ItemKind | null,
        stageId: stages[0].id,
        quote: v.quote === '' ? null : Number(v.quote),
      },
      {
        onSuccess: id => {
          toast('Lead added.')
          reset()
          onClose()
          navigate(shopLink(`/business/leads/${id}`, shop.id))
        },
      },
    )
  })

  return (
    <Dialog open={open} onClose={onClose} title="Add a lead">
      <form className="stack" onSubmit={onSubmit} noValidate style={{gap: 'var(--space-4)'}}>
        <div className="field">
          <label className="label" htmlFor="lead-customer">
            Customer
          </label>
          <select id="lead-customer" className="select" {...register('customerId')}>
            <option value="">New customer</option>
            {customers?.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.mobile ? ` (${c.mobile})` : ''}
              </option>
            ))}
          </select>
        </div>
        {!existing && (
          <>
            <div className="field">
              <label className="label" htmlFor="lead-name">
                Name
              </label>
              <input id="lead-name" className="input" aria-invalid={!!errors.name} {...register('name')} />
              {errors.name && <p className="error-text">{errors.name.message}</p>}
            </div>
            <div className="field">
              <label className="label" htmlFor="lead-mobile">
                Mobile <span className="muted">(optional)</span>
              </label>
              <input id="lead-mobile" className="input" inputMode="tel" placeholder="0917 123 4567" {...register('mobile')} />
              {errors.mobile && <p className="error-text">{errors.mobile.message}</p>}
            </div>
            <div className="field">
              <label className="label" htmlFor="lead-email">
                Email <span className="muted">(optional)</span>
              </label>
              <input id="lead-email" className="input" type="email" aria-invalid={!!errors.email} {...register('email')} />
              {errors.email && <p className="error-text">{errors.email.message}</p>}
            </div>
          </>
        )}
        <div className="field">
          <label className="label" htmlFor="lead-title">
            The job
          </label>
          <input id="lead-title" className="input" placeholder="Brakes squeak after the PMS" aria-invalid={!!errors.title} {...register('title')} />
          {errors.title && <p className="error-text">{errors.title.message}</p>}
        </div>
        <div className="field">
          <label className="label" htmlFor="lead-kind">
            Kind of repair <span className="muted">(optional)</span>
          </label>
          <select id="lead-kind" className="select" {...register('kind')}>
            <option value="">Not set</option>
            {ITEM_KINDS.map(k => (
              <option key={k} value={k}>
                {kindLabel(k)}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="label" htmlFor="lead-quote">
            Quote in pesos <span className="muted">(optional)</span>
          </label>
          <input id="lead-quote" className="input" inputMode="decimal" aria-invalid={!!errors.quote} {...register('quote')} />
          {errors.quote && <p className="error-text">{errors.quote.message}</p>}
        </div>
        {!existing && (
          <>
            <label className="row small" style={{gap: 'var(--space-3)', alignItems: 'flex-start', minHeight: 'var(--tap)'}}>
              <input type="checkbox" style={{width: 20, height: 20, marginTop: 2, flex: 'none'}} {...register('agree')} />
              <span>{MANUAL_CONSENT_TEXT}</span>
            </label>
            {errors.agree && <p className="error-text">{errors.agree.message}</p>}
          </>
        )}
        {create.error && <Alert>{businessError(create.error, "We couldn't add the lead. Try again.")}</Alert>}
        <div className="dlg__foot">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={create.isPending}>
            Add lead
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
