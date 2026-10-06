import React from 'react'
import {Link, useNavigate} from 'react-router-dom'
import {Bell, ChevronRight, FileText, Folder, Info, LogOut, Trash2, Wrench} from '@/components/icons'
import {useSession, useUserId} from '@/state/session'
import {deleteAccount} from '@/state/queries/profile'
import {deleteAllProof} from '@/state/queries/repair'
import {useMarkAsReadMutation, useNotificationsQuery} from '@/state/queries/notifications'
import {NOTIFICATION_COPY} from '@/lib/constants'
import {APP_VERSION} from '@/lib/env'
import {errorMessage, formatDate, timeAgo} from '@/lib/format'
import {toast} from '@/stores/ui'
import type {AppNotification} from '@/types/app'
import {Alert, Button, CardSkeletons, Dialog, EmptyState, ErrorState, PageHead} from '@/components/ui'

export function AccountPage() {
  const navigate = useNavigate()
  const {session, isGuest, signOut} = useSession()
  const meta = session?.user.user_metadata ?? {}
  const name = isGuest
    ? 'Trying it'
    : meta.full_name || [meta.first_name, meta.last_name].filter(Boolean).join(' ') || 'Your account'
  const initial = (meta.first_name?.[0] ?? name[0] ?? 'K').toUpperCase()
  const [confirmDelete, setConfirmDelete] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [deleteError, setDeleteError] = React.useState('')

  const onSignOut = async () => {
    await signOut()
    toast('You signed out.', 'info')
    navigate('/')
  }

  const onDelete = async () => {
    setDeleting(true)
    setDeleteError('')
    try {
      if (session) await deleteAllProof(session.user.id).catch(() => undefined)
      await deleteAccount()
      await signOut()
      toast('Your account is deleted.', 'info')
      navigate('/')
    } catch (e) {
      setDeleteError(errorMessage(e))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="container page" style={{maxWidth: 720}}>
      <div className="row" style={{gap: 'var(--space-4)', marginBottom: 'var(--space-8)'}}>
        <div className="avatar" aria-hidden>
          {meta.img_url ? <img src={meta.img_url} alt="" /> : initial}
        </div>
        <div>
          <h1 style={{fontSize: 'var(--text-xl)'}}>{name}</h1>
          <p className="muted small">
            {isGuest
              ? 'Notes stay on this browser until you add a mobile number later.'
              : session?.user.phone
                ? `+${session.user.phone}`
                : session?.user.email}
          </p>
        </div>
      </div>

      <ul className="card menu">
        <MenuLink to="/files" icon={<Folder size={20} />} title="Your repairs" sub="Quotes, photos, visits, and letters" />
        <MenuLink
          to="/account/vehicles"
          icon={<Wrench size={20} />}
          title="What you repair"
          sub="Cars, homes, aircon, appliances, gadgets"
        />
      </ul>

      <ul className="card menu" style={{marginTop: 'var(--space-4)'}}>
        <MenuLink to="/terms" icon={<FileText size={20} />} title="Terms and conditions" />
        <MenuLink to="/about" icon={<Info size={20} />} title="About Kumpooni" />
      </ul>

      <ul className="card menu" style={{marginTop: 'var(--space-4)'}}>
        <li>
          <button type="button" onClick={onSignOut}>
            <LogOut size={20} aria-hidden />
            {/* A guest can't sign back in, so say what signing out costs. */}
            {isGuest ? 'Sign out and lose these notes' : 'Sign out'}
          </button>
        </li>
        <li>
          <button type="button" onClick={() => setConfirmDelete(true)} style={{color: 'var(--brand)'}}>
            <Trash2 size={20} aria-hidden />
            Delete account
          </button>
        </li>
      </ul>

      <p className="xsmall muted" style={{textAlign: 'center', marginTop: 'var(--space-8)'}}>
        Kumpooni web v{APP_VERSION}
      </p>

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete your account?">
        <p>
          This removes your profile, saved items, repair files, photos, and letters. Job slip links stop working. You
          can't undo this.
        </p>
        {deleteError && <Alert>{deleteError}</Alert>}
        <div className="dlg__foot">
          <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
            Keep my account
          </Button>
          <Button variant="danger" loading={deleting} onClick={onDelete}>
            Delete account
          </Button>
        </div>
      </Dialog>
    </div>
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

export function NotificationsPage() {
  const navigate = useNavigate()
  const userId = useUserId()
  const {data: groups, isLoading, error, refetch} = useNotificationsQuery(userId)
  const markAsRead = useMarkAsReadMutation()

  const open = (n: AppNotification) => {
    if (!n.is_read) markAsRead.mutate(n.id)
    if (n.repair_order_id) navigate(`/orders/${n.repair_order_id}`)
  }

  const hasAny = groups?.some(g => g.data?.length)

  return (
    <div className="container page" style={{maxWidth: 720}}>
      <PageHead title="Notifications" />
      {isLoading ? (
        <CardSkeletons count={4} height={80} />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : !hasAny ? (
        <EmptyState image="/images/no_notification.png" title="No notifications yet">
          When a shop confirms, starts or finishes work on your car, you'll see it here.
        </EmptyState>
      ) : (
        <div className="stack" style={{gap: 'var(--space-6)'}}>
          {groups!.map(group => (
            <section key={group.date} aria-label={formatDate(group.date, 'dddd, D MMMM')}>
              <h2 className="small muted" style={{fontFamily: 'var(--font-body)', fontWeight: 600, marginBottom: 'var(--space-2)'}}>
                {formatDate(group.date, 'dddd, D MMMM')}
              </h2>
              <ul className="stack" style={{gap: 'var(--space-1)', listStyle: 'none'}}>
                {group.data.map(n => (
                  <li key={n.id}>
                    <button
                      type="button"
                      className={`notif ${n.is_read ? '' : 'notif--unread'}`}
                      onClick={() => open(n)}>
                      <span className="notif__icon" aria-hidden>
                        <Bell size={18} />
                      </span>
                      <span style={{flex: 1}}>
                        <span className="row row--between">
                          <span className="strong">{n.store_name ?? 'Kumpooni'}</span>
                          <span className="xsmall muted">{timeAgo(n.created_at)}</span>
                        </span>
                        <span className="small" style={{display: 'block', color: 'var(--ink-2)'}}>
                          {n.content || NOTIFICATION_COPY[n.type] || 'There is an update on your booking.'}
                        </span>
                        {!n.is_read && <span className="visually-hidden">Unread</span>}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
