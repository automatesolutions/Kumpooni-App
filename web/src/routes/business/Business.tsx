import {Link, useNavigate} from 'react-router-dom'
import {CalendarDays, ChevronRight, ClipboardList, Messages, ShieldCheck, Store, Users} from '@/components/icons'
import {canManageTeam, categoryLabel, ROLE_INFO} from '@/lib/business'
import {totalUnread} from '@/lib/chat'
import {dueState} from '@/lib/crm'
import {formatDate} from '@/lib/format'
import {useChatChannelsQuery} from '@/state/queries/chat'
import {useDueFollowUpsQuery} from '@/state/queries/crm'
import {CardSkeletons, EmptyState, ErrorState, PageHead} from '@/components/ui'
import {shopLink, useCurrentShop, useIsKumpooniAdmin, VerificationBadge} from './shared'

export function BusinessPage() {
  const navigate = useNavigate()
  const {data: shops, isLoading, error, refetch, shop} = useCurrentShop()
  const staff = useIsKumpooniAdmin()

  return (
    <div className="container page" style={{maxWidth: 720}}>
      <PageHead
        back={{to: '/account', label: 'Account'}}
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
            {shop.verification_status !== 'verified' && (
              <p className="small">
                Until it's verified, your shop has no badge and customers can't send you their repairs.
              </p>
            )}
          </section>

          <DueFollowUps orgId={shop.id} />

          <ul className="card menu">
            <ChatLink orgId={shop.id} />
            <MenuLink
              to={shopLink('/business/leads', shop.id)}
              icon={<ClipboardList size={20} />}
              title="Leads"
              sub={shop.role === 'guest' ? 'The jobs given to you' : 'Your pipeline, from New to Done'}
            />
            <MenuLink
              to={shopLink('/business/customers', shop.id)}
              icon={<Users size={20} />}
              title="Customers"
              sub="Everyone you have a lead for"
            />
          </ul>

          <ul className="card menu">
            {shop.verification_status !== 'verified' && canManageTeam(shop.role) && (
              <MenuLink
                to={shopLink('/business/claim', shop.id)}
                icon={<ShieldCheck size={20} />}
                title={shop.verification_status === 'pending' ? 'See your claim' : "Prove it's your shop"}
                sub="A code, your DTI number, or a review by our team"
              />
            )}
            <MenuLink
              to={shopLink('/business/team', shop.id)}
              icon={<Users size={20} />}
              title="Team"
              sub={canManageTeam(shop.role) ? 'Invite people and set their roles' : 'Who works here'}
            />
          </ul>

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
  if (!data?.length) {
    return (
      <p className="small muted row" style={{gap: 'var(--space-2)'}}>
        <CalendarDays size={18} aria-hidden /> No follow-ups due today.
      </p>
    )
  }
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

/** Chat, with how many messages you haven't read. */
function ChatLink({orgId}: {orgId: string}) {
  const {data} = useChatChannelsQuery(orgId)
  const unread = totalUnread(data)
  return (
    <MenuLink
      to={shopLink('/business/chat', orgId)}
      icon={<Messages size={20} />}
      title="Chat"
      sub={unread ? `${unread} unread ${unread === 1 ? 'message' : 'messages'}` : 'Channels, direct messages, and lead chats'}
    />
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
