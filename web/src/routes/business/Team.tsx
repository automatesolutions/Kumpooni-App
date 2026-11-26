import React from 'react'
import {Link, useNavigate} from 'react-router-dom'
import {useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import {z} from 'zod'
import {Copy, Trash2, UserPlus, Users} from '@/components/icons'
import {
  ASSIGNABLE_ROLES,
  businessError,
  canManageTeam,
  inviteUrl,
  memberActions,
  ROLE_INFO,
  type AssignableRole,
} from '@/lib/business'
import {formatDate} from '@/lib/format'
import {toast} from '@/stores/ui'
import {useUserId} from '@/state/session'
import {
  useChangeRoleMutation,
  useCreateInviteMutation,
  useDeleteInviteMutation,
  useInvitesQuery,
  useMembersQuery,
  useRemoveMemberMutation,
  type MyShop,
} from '@/state/queries/business'
import type {ShopMemberListItem} from '@/types/business'
import {Alert, Button, CardSkeletons, Dialog, EmptyState, ErrorState, PageHead, Spinner} from '@/components/ui'
import {shopLink, useCurrentShop} from './shared'

export function TeamPage() {
  const {shop, isLoading, error, refetch} = useCurrentShop()
  if (isLoading) return <Spinner />
  if (error) return <ErrorState error={error} onRetry={refetch} />
  if (!shop) {
    return (
      <div className="container page" style={{maxWidth: 720}}>
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
  return <Team shop={shop} />
}

function Team({shop}: {shop: MyShop}) {
  const navigate = useNavigate()
  const manager = canManageTeam(shop.role)
  const isGuest = shop.role === 'guest'
  const {data: members, isLoading, error, refetch} = useMembersQuery(shop.id, !isGuest)
  const myId = useUserId()
  const ownerCount = members?.filter(m => m.role === 'owner').length ?? 0
  const remove = useRemoveMemberMutation(shop.id, myId)
  const [confirm, setConfirm] = React.useState<ShopMemberListItem | null>(null)

  const onRemove = () => {
    if (!confirm) return
    const leaving = confirm.user_id === myId
    remove.mutate(confirm.user_id, {
      onSuccess: () => {
        setConfirm(null)
        toast(leaving ? `You left ${shop.name}.` : 'Removed from the team.')
        if (leaving) navigate('/business', {replace: true})
      },
    })
  }

  return (
    <div className="container page" style={{maxWidth: 720}}>
      <PageHead
        back={{to: shopLink('/business', shop.id), label: shop.name}}
        title="Team"
        description={manager ? 'Invite people and choose what they can do.' : 'The people who work at this shop.'}
      />

      <div className="stack" style={{gap: 'var(--space-6)'}}>
        {manager && <InviteForm orgId={shop.id} />}

        <section aria-labelledby="team-members">
          <h2 id="team-members" className="section-title" style={{fontSize: 'var(--text-lg)', marginBottom: 'var(--space-3)'}}>
            Members
          </h2>
          {isGuest ? (
            <EmptyState icon={<Users size={28} />} title="Guests don't see the team list">
              Ask an owner or admin of {shop.name} if you need to reach someone.
            </EmptyState>
          ) : isLoading ? (
            <CardSkeletons count={3} height={72} />
          ) : error ? (
            <ErrorState error={error} onRetry={refetch} />
          ) : !members?.length ? (
            <EmptyState icon={<Users size={28} />} title="No members to show">
              Refresh the page. If it stays empty, sign out and back in.
            </EmptyState>
          ) : (
            <ul className="card biz-list">
              {members.map(m => (
                <MemberRow
                  key={m.user_id}
                  shop={shop}
                  member={m}
                  actions={memberActions({userId: myId, role: shop.role}, {userId: m.user_id, role: m.role}, ownerCount)}
                  isMe={m.user_id === myId}
                  onRemove={() => setConfirm(m)}
                />
              ))}
            </ul>
          )}
        </section>

        {manager && <OpenInvites orgId={shop.id} />}
      </div>

      <Dialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm?.user_id === myId ? `Leave ${shop.name}?` : `Remove ${confirm?.name ?? confirm?.email}?`}>
        <p>
          {confirm?.user_id === myId
            ? 'You lose access to this shop. An owner or admin can invite you again.'
            : 'They lose access to this shop right away. You can invite them again later.'}
        </p>
        {remove.error && <Alert>{businessError(remove.error)}</Alert>}
        <div className="dlg__foot">
          <Button variant="ghost" onClick={() => setConfirm(null)}>
            Cancel
          </Button>
          <Button variant="danger" loading={remove.isPending} onClick={onRemove}>
            {confirm?.user_id === myId ? 'Leave shop' : 'Remove'}
          </Button>
        </div>
      </Dialog>
    </div>
  )
}

function MemberRow({
  shop,
  member,
  actions,
  isMe,
  onRemove,
}: {
  shop: MyShop
  member: ShopMemberListItem
  actions: ReturnType<typeof memberActions>
  isMe: boolean
  onRemove: () => void
}) {
  const change = useChangeRoleMutation(shop.id)
  const selectId = React.useId()
  return (
    <li className="biz-row">
      <div className="biz-row__main">
        <p className="strong">
          {member.name ?? member.email} {isMe && <span className="muted small">(you)</span>}
        </p>
        {member.name && <p className="small muted">{member.email}</p>}
        {change.error && <p className="error-text">{businessError(change.error)}</p>}
      </div>
      <div className="biz-row__side">
        {actions.changeRole ? (
          <>
            <label className="visually-hidden" htmlFor={selectId}>
              Role for {member.name ?? member.email}
            </label>
            <select
              id={selectId}
              className="select"
              value={member.role}
              disabled={change.isPending}
              onChange={e =>
                change.mutate(
                  {userId: member.user_id, role: e.target.value as AssignableRole},
                  {onSuccess: () => toast('Role changed.')},
                )
              }>
              {ASSIGNABLE_ROLES.map(r => (
                <option key={r} value={r}>
                  {ROLE_INFO[r].label}
                </option>
              ))}
            </select>
          </>
        ) : (
          <span className="status">{ROLE_INFO[member.role].label}</span>
        )}
        {(actions.remove || actions.leave) && (
          <Button variant="ghost" size="sm" onClick={onRemove}>
            {actions.leave ? (
              'Leave'
            ) : (
              <>
                <Trash2 size={16} aria-hidden /> Remove<span className="visually-hidden"> {member.name ?? member.email}</span>
              </>
            )}
          </Button>
        )}
      </div>
    </li>
  )
}

const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter an email address, like name@gmail.com.'),
  role: z.enum(ASSIGNABLE_ROLES),
})
type InviteForm = z.infer<typeof inviteSchema>

function InviteForm({orgId}: {orgId: string}) {
  const create = useCreateInviteMutation(orgId)
  const [link, setLink] = React.useState<{url: string; email: string} | null>(null)
  const {register, handleSubmit, reset, watch, formState} = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {email: '', role: 'member'},
  })
  const role = watch('role')

  const onSubmit = handleSubmit(values => {
    create.mutate(values, {
      onSuccess: token => {
        setLink({url: inviteUrl(token), email: values.email})
        reset({email: '', role: values.role})
      },
    })
  })

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast('Copied. Send it to them in Messenger or by email.')
    } catch {
      toast("Your browser didn't allow copying. Select the link and copy it.", 'info')
    }
  }

  return (
    <section className="card card--pad stack" aria-labelledby="team-invite" style={{gap: 'var(--space-4)'}}>
      <h2 id="team-invite" style={{fontSize: 'var(--text-lg)'}} className="row">
        <UserPlus size={20} aria-hidden /> Invite someone
      </h2>
      <form className="stack" onSubmit={onSubmit} noValidate style={{gap: 'var(--space-4)'}}>
        <div className="field">
          <label className="label" htmlFor="invite-email">
            Their email
          </label>
          <input
            id="invite-email"
            className="input"
            type="email"
            autoComplete="off"
            placeholder="name@gmail.com"
            aria-invalid={!!formState.errors.email}
            {...register('email')}
          />
          {formState.errors.email && <p className="error-text">{formState.errors.email.message}</p>}
          <p className="help">They join by signing in with this email.</p>
        </div>
        <div className="field">
          <label className="label" htmlFor="invite-role">
            Role
          </label>
          <select id="invite-role" className="select" {...register('role')}>
            {ASSIGNABLE_ROLES.map(r => (
              <option key={r} value={r}>
                {ROLE_INFO[r].label}
              </option>
            ))}
          </select>
          <p className="help">{ROLE_INFO[role].hint}.</p>
        </div>
        {create.error && <Alert>{businessError(create.error, "We couldn't make the invite. Try again.")}</Alert>}
        <Button type="submit" loading={create.isPending}>
          Make invite link
        </Button>
      </form>

      {link && (
        <div className="share-box">
          <p className="strong">Send this link to {link.email}</p>
          <p className="small muted">We don't email invites yet. The link works once, for 7 days.</p>
          <div className="share-box__row">
            <input className="input" readOnly value={link.url} aria-label="Invite link" onFocus={e => e.currentTarget.select()} />
            <Button variant="secondary" onClick={() => copy(link.url)}>
              <Copy size={18} aria-hidden /> Copy link
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}

function OpenInvites({orgId}: {orgId: string}) {
  const {data: invites, isLoading, error, refetch} = useInvitesQuery(orgId)
  const del = useDeleteInviteMutation(orgId)
  return (
    <section aria-labelledby="team-open">
      <h2 id="team-open" style={{fontSize: 'var(--text-lg)', marginBottom: 'var(--space-3)'}}>
        Invites not used yet
      </h2>
      {isLoading ? (
        <CardSkeletons count={1} height={72} />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : !invites?.length ? (
        <p className="small muted">No open invites. New ones show here until someone joins.</p>
      ) : (
        <ul className="card biz-list">
          {invites.map(i => {
            const expired = new Date(i.expires_at) < new Date()
            return (
              <li key={i.id} className="biz-row">
                <div className="biz-row__main">
                  <p className="strong">{i.email}</p>
                  <p className="small muted">
                    {ROLE_INFO[i.role].label} · {expired ? 'Expired' : `Works until ${formatDate(i.expires_at, 'D MMM')}`}
                  </p>
                </div>
                <div className="biz-row__side">
                  <Button variant="ghost" size="sm" loading={del.isPending && del.variables === i.id} onClick={() => del.mutate(i.id)}>
                    Cancel invite<span className="visually-hidden"> for {i.email}</span>
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
