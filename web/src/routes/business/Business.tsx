import {Link, useNavigate} from 'react-router-dom'
import {
  CalendarDays,
  ChevronRight,
  CircleUser,
  ClipboardList,
  Headphones,
  ListCheck,
  Messages,
  ShieldCheck,
  Store,
  Users,
} from '@/components/icons'
import {canManageTeam, categoryLabel, ROLE_INFO} from '@/lib/business'
import {channelLabel, totalUnread} from '@/lib/chat'
import {dueState} from '@/lib/crm'
import {formatDate} from '@/lib/format'
import {myTaskCounts} from '@/lib/tasks'
import type {MyShop} from '@/state/queries/business'
import {useChatChannelsQuery, useChatPeopleQuery} from '@/state/queries/chat'
import {useDueFollowUpsQuery} from '@/state/queries/crm'
import {useShopHuddlesQuery} from '@/state/queries/huddles'
import {useTasksQuery} from '@/state/queries/tasks'
import {useUserId} from '@/state/session'
import {CardSkeletons, EmptyState, ErrorState, PageHead} from '@/components/ui'
import {BusinessNav} from './BusinessNav'
import {shopLink, useCurrentShop, useIsKumpooniAdmin, VerificationBadge} from './shared'

export function BusinessPage() {
  const navigate = useNavigate()
  const {data: shops, isLoading, error, refetch, shop} = useCurrentShop()
  const staff = useIsKumpooniAdmin()

  return (
    <div className="container page" style={{maxWidth: 880}}>
      {shop && <BusinessNav shop={shop} />}
      <PageHead
        back={shop ? undefined : {to: '/account', label: 'Account'}}
        title="For shops"
        description="Run your shop on Kumpooni. Customers' repair files stay private unless they share them with you."
        actions={
          shops?.length ? (
            <Link to="/business/claim" className="btn btn--secondary btn--sm">
              Add a shop
            </Link>
          ) : undefined
        }
      />

      {isLoading ? (
        <CardSkeletons count={2} height={140} />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : !shops?.length ? (
        <EmptyState
          icon={<Store size={28} />}
          title="You haven't added a shop yet"
          action={
            <Link to="/business/claim" className="btn btn--primary">
              Add your shop
            </Link>
          }>
          Add your shop, prove it's yours, and invite your team.
        </EmptyState>
      ) : !shop ? (
        <EmptyState
          icon={<Store size={28} />}
          title="This shop isn't on your list"
          action={
            <Link to="/business" className="btn btn--secondary">
              Show my shops
            </Link>
          }>
          You may have left it, or the link is for another account.
        </EmptyState>
      ) : (
        <div className="stack" style={{gap: 'var(--space-6)'}}>
          {shops.length > 1 && (
            <div className="field">
              <label className="label" htmlFor="biz-shop">
                Shop
              </label>
              <select
                id="biz-shop"
                className="select"
                value={shop.id}
                onChange={e => navigate(shopLink('/business', e.target.value), {replace: true})}>
                {shops.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <section className="card card--pad stack" aria-labelledby="biz-name">
            <div className="row row--between" style={{alignItems: 'flex-start', gap: 'var(--space-3)'}}>
              <div>
                <h2 id="biz-name" style={{fontSize: 'var(--text-xl)'}}>
                  {shop.name}
                </h2>
                <p className="small muted">
                  {[shop.city, shop.categories.map(categoryLabel).join(', ')].filter(Boolean).join(' · ')}
                </p>
              </div>
              <VerificationBadge status={shop.verification_status} />
            </div>
            <p className="small muted">You're {ROLE_INFO[shop.role].label.toLowerCase()} here.</p>
            {shop.verification_status !== 'verified' && !canManageTeam(shop.role) && (
              <p className="small">
                Until it's verified, your shop has no badge and customers can't send you their repairs.
              </p>
            )}
          </section>

          {shop.verification_status !== 'verified' && canManageTeam(shop.role) && (
            <Link to={shopLink('/business/claim', shop.id)} className="biz-callout">
              <ShieldCheck size={22} aria-hidden />
              <span>
                <span className="strong">
                  {shop.verification_status === 'pending' ? 'Your claim is being checked' : "Prove it's your shop"}
                </span>
                <small>
                  {shop.verification_status === 'pending'
                    ? 'See where it is, or add more proof.'
                    : 'Get the verified badge so customers can send you their repairs.'}
                </small>
              </span>
              <ChevronRight size={18} aria-hidden />
            </Link>
          )}

          <Today shop={shop} />

          <section aria-labelledby="tools-title" className="stack" style={{gap: 'var(--space-3)'}}>
            <h2 id="tools-title" className="biz-section-title">
              Your tools
            </h2>
            <ul className="biz-tools">
              <Tool
                to={shopLink('/business/chat', shop.id)}
                icon={<Messages size={22} />}
                title="Chat"
                sub="Channels, direct messages, huddles, and clips"
              />
              <Tool
                to={shopLink('/business/tasks', shop.id)}
                icon={<ListCheck size={22} />}
                title="Tasks"
                sub={shop.role === 'guest' ? 'The tasks given to you' : 'To do, Doing, and Done'}
              />
              <Tool
                to={shopLink('/business/leads', shop.id)}
                icon={<ClipboardList size={22} />}
                title="Leads"
                sub={shop.role === 'guest' ? 'The jobs given to you' : 'Your pipeline, from New to Done'}
              />
              <Tool
                to={shopLink('/business/customers', shop.id)}
                icon={<CircleUser size={22} />}
                title="Customers"
                sub="Everyone you have a lead for"
              />
              <Tool
                to={shopLink('/business/team', shop.id)}
                icon={<Users size={22} />}
                title="Team"
                sub={canManageTeam(shop.role) ? 'Invite people and set their roles' : 'Who works here'}
              />
            </ul>
          </section>

          <DueFollowUps orgId={shop.id} />

          {staff && (
            <ul className="card menu">
              <MenuLink
                to="/business/admin/claims"
                icon={<ClipboardList size={20} />}
                title="Review shop claims"
                sub="Kumpooni staff only"
              />
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

/** Follow-ups due today and overdue. Nothing shows when there are none. */
function DueFollowUps({orgId}: {orgId: string}) {
  const {data, isLoading, error, refetch} = useDueFollowUpsQuery(orgId)
  if (isLoading) return <CardSkeletons count={1} height={96} />
  if (error) return <ErrorState error={error} onRetry={refetch} />
  // The count is already in Today, so nothing shows when there's nothing due.
  if (!data?.length) return null
  return (
    <section className="card card--pad stack" aria-labelledby="due-title" style={{gap: 'var(--space-3)'}}>
      <h2 id="due-title" style={{fontSize: 'var(--text-lg)'}} className="row">
        <CalendarDays size={20} aria-hidden /> Follow up today
      </h2>
      <ul className="stack" style={{listStyle: 'none', gap: 'var(--space-1)'}}>
        {data.map(f => (
          <li key={f.id}>
            <Link
              to={shopLink(`/business/leads/${f.lead_id}`, orgId)}
              className="row row--between"
              style={{minHeight: 'var(--tap)', gap: 'var(--space-3)'}}>
              <span className="link">{f.lead?.title ?? 'Lead'}</span>
              <span className={`small ${dueState(f.due_on) === 'overdue' ? 'strong' : 'muted'}`}>
                {dueState(f.due_on) === 'overdue' ? `Overdue since ${formatDate(f.due_on, 'D MMM')}` : 'Today'}
                {f.reason === 'warranty_end' && ', warranty ended'}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** What needs you today: unread messages, your tasks, follow-ups, and live huddles. */
function Today({shop}: {shop: MyShop}) {
  const userId = useUserId()
  const {data: channels} = useChatChannelsQuery(shop.id)
  const {data: tasks} = useTasksQuery(shop.id)
  const {data: huddles} = useShopHuddlesQuery(shop.id)
  const {data: followUps} = useDueFollowUpsQuery(shop.id)
  const {data: people = []} = useChatPeopleQuery(shop.id)
  const unread = totalUnread(channels)
  const mine = myTaskCounts(tasks, userId)
  const due = followUps?.length ?? 0

  return (
    <section aria-labelledby="today-title" className="stack" style={{gap: 'var(--space-3)'}}>
      <h2 id="today-title" className="biz-section-title">
        Today
      </h2>
      <ul className="biz-stats">
        <Stat
          to={shopLink('/business/chat', shop.id)}
          icon={<Messages size={20} />}
          value={unread}
          label={unread === 1 ? 'unread message' : 'unread messages'}
          hot={unread > 0}
        />
        <Stat
          to={`${shopLink('/business/tasks', shop.id)}&show=mine`}
          icon={<ListCheck size={20} />}
          value={mine.open}
          label={
            mine.overdue ? `tasks for you, ${mine.overdue} overdue` : mine.open === 1 ? 'task for you' : 'tasks for you'
          }
          hot={mine.overdue > 0}
        />
        <Stat
          to={shopLink('/business/leads', shop.id)}
          icon={<CalendarDays size={20} />}
          value={due}
          label={due === 1 ? 'follow-up due' : 'follow-ups due'}
          hot={due > 0}
        />
      </ul>
      {(huddles ?? []).map(h => {
        const channel = channels?.find(c => c.id === h.channel_id)
        if (!channel) return null
        const names = h.people.map(id => people.find(p => p.user_id === id)?.name ?? 'Someone')
        return (
          <Link
            key={h.huddle_id}
            to={`${shopLink('/business/chat', shop.id)}&c=${h.channel_id}`}
            className="biz-callout biz-callout--live">
            <Headphones size={22} aria-hidden />
            <span>
              <span className="strong">Huddle in {channelLabel(channel, people)}</span>
              <small>{names.join(', ')}</small>
            </span>
            <span className="btn btn--primary btn--sm">Join</span>
          </Link>
        )
      })}
    </section>
  )
}

function Stat({
  to,
  icon,
  value,
  label,
  hot,
}: {
  to: string
  icon: React.ReactNode
  value: number
  label: string
  hot?: boolean
}) {
  return (
    <li>
      <Link to={to} className={`biz-stat${hot ? ' biz-stat--hot' : ''}`}>
        <span className="biz-stat__icon" aria-hidden>
          {icon}
        </span>
        <span className="biz-stat__value">{value}</span>
        <span className="biz-stat__label">{label}</span>
      </Link>
    </li>
  )
}

function Tool({to, icon, title, sub}: {to: string; icon: React.ReactNode; title: string; sub: string}) {
  return (
    <li>
      <Link to={to} className="biz-tool">
        <span className="biz-tool__icon" aria-hidden>
          {icon}
        </span>
        <span className="biz-tool__text">
          <span className="strong">{title}</span>
          <small>{sub}</small>
        </span>
        <ChevronRight size={18} className="chev" aria-hidden />
      </Link>
    </li>
  )
}

function MenuLink({to, icon, title, sub}: {to: string; icon: React.ReactNode; title: string; sub?: string}) {
  return (
    <li>
      <Link to={to}>
        <span aria-hidden>{icon}</span>
        <span>
          {title}
          {sub && <small>{sub}</small>}
        </span>
        <ChevronRight size={18} className="chev" aria-hidden />
      </Link>
    </li>
  )
}
