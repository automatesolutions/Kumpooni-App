import React from 'react'
import {Link, useNavigate, useSearchParams} from 'react-router-dom'
import {Archive, ChevronLeft, ClipboardList, Hash, Lock, Messages, Plus, Users} from '@/components/icons'
import {ChatThread} from '@/components/ChatThread'
import {businessError, canManageTeam} from '@/lib/business'
import {channelLabel, slugChannelName, sortChannels} from '@/lib/chat'
import {toast} from '@/stores/ui'
import type {MyShop} from '@/state/queries/business'
import {
  useChannelMemberMutation,
  useChannelMembersQuery,
  useChatChannelsQuery,
  useChatPeopleQuery,
  useChatRealtime,
  useCreateChannelMutation,
  useOpenDmMutation,
  useUpdateChannelMutation,
} from '@/state/queries/chat'
import type {ChatPerson, MyChatChannel} from '@/types/business'
import {Alert, Button, CardSkeletons, Checkbox, Dialog, EmptyState, ErrorState, Spinner} from '@/components/ui'
import {shopLink, useCurrentShop} from './shared'

export function ChatPage() {
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
  return <Chat shop={shop} />
}

function Chat({shop}: {shop: MyShop}) {
  const [params, setParams] = useSearchParams()
  const channels = useChatChannelsQuery(shop.id)
  const {data: people = []} = useChatPeopleQuery(shop.id)
  useChatRealtime(shop.id)
  const list = sortChannels(channels.data ?? [])
  const openId = params.get('c')
  const open = list.find(c => c.id === openId) ?? null
  const admin = canManageTeam(shop.role)
  const [newChannel, setNewChannel] = React.useState(false)
  const [newDm, setNewDm] = React.useState(false)
  const [info, setInfo] = React.useState(false)

  const go = (id: string | null) => {
    const next = new URLSearchParams(params)
    if (id) next.set('c', id)
    else next.delete('c')
    setParams(next, {replace: !!openId === !!id})
  }

  return (
    <div className={`container page chat-page${open ? ' chat-page--open' : ''}`}>
      <aside className="chat-side" aria-label="Channels">
        <div className="chat-side__head">
          <Link to={shopLink('/business', shop.id)} className="back-link">
            <ChevronLeft size={18} aria-hidden /> {shop.name}
          </Link>
          <h1 style={{fontSize: 'var(--text-xl)'}}>Chat</h1>
        </div>
        {channels.isLoading ? (
          <CardSkeletons count={4} height={44} />
        ) : channels.error ? (
          <ErrorState error={channels.error} onRetry={channels.refetch} />
        ) : (
          <>
            <ChannelGroup
              title="Channels"
              items={list.filter(c => c.kind === 'channel')}
              people={people}
              openId={openId}
              onOpen={go}
              action={
                admin && (
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label="New channel"
                    onClick={() => setNewChannel(true)}>
                    <Plus size={18} />
                  </button>
                )
              }
              empty={shop.role === 'guest' ? 'You’ll see channels here once someone adds you.' : undefined}
            />
            <ChannelGroup
              title="Direct messages"
              items={list.filter(c => c.kind === 'dm')}
              people={people}
              openId={openId}
              onOpen={go}
              action={
                <button
                  type="button"
                  className="icon-btn"
                  aria-label="New direct message"
                  onClick={() => setNewDm(true)}>
                  <Plus size={18} />
                </button>
              }
              empty="Message one teammate."
            />
            <ChannelGroup
              title="Lead chats"
              items={list.filter(c => c.kind === 'lead')}
              people={people}
              openId={openId}
              onOpen={go}
              empty="Open a lead to talk about that job."
            />
          </>
        )}
      </aside>

      <section className="chat-main" aria-label={open ? channelLabel(open, people) : 'Messages'}>
        {open ? (
          <>
            <header className="chat-main__head">
              <button
                type="button"
                className="icon-btn chat-main__back"
                aria-label="Back to channels"
                onClick={() => go(null)}>
                <ChevronLeft size={20} />
              </button>
              <div className="chat-main__title">
                <h2>
                  <ChannelIcon channel={open} /> {channelLabel(open, people)}
                </h2>
                {open.topic && <p className="small muted">{open.topic}</p>}
              </div>
              {open.kind === 'lead' && open.lead_id && (
                <Link to={shopLink(`/business/leads/${open.lead_id}`, shop.id)} className="btn btn--ghost btn--sm">
                  Open lead
                </Link>
              )}
              {open.kind === 'channel' && admin && (
                <Button variant="ghost" size="sm" onClick={() => setInfo(true)}>
                  {open.is_private ? 'People' : 'Settings'}
                </Button>
              )}
            </header>
            <ChatThread
              orgId={shop.id}
              channelId={open.id}
              people={people}
              canModerate={admin}
              archived={!!open.archived_at}
              placeholder={`Message ${channelLabel(open, people)}`}
              emptyText={
                open.kind === 'dm'
                  ? 'No messages yet. Only the two of you can see this.'
                  : open.kind === 'lead'
                    ? 'No messages yet. Everyone who can see this lead can read them.'
                    : 'No messages yet. Say hello.'
              }
            />
          </>
        ) : (
          <div className="chat-main__none">
            <EmptyState icon={<Messages size={28} />} title="Pick a conversation">
              Choose a channel, a teammate, or a lead on the left.
            </EmptyState>
          </div>
        )}
      </section>

      {admin && (
        <NewChannelDialog
          open={newChannel}
          onClose={() => setNewChannel(false)}
          orgId={shop.id}
          people={people}
          onCreated={id => {
            setNewChannel(false)
            go(id)
          }}
        />
      )}
      <NewDmDialog
        open={newDm}
        onClose={() => setNewDm(false)}
        orgId={shop.id}
        people={people}
        onOpened={id => {
          setNewDm(false)
          go(id)
        }}
      />
      {open?.kind === 'channel' && admin && (
        <ChannelInfoDialog open={info} onClose={() => setInfo(false)} orgId={shop.id} channel={open} people={people} />
      )}
    </div>
  )
}

function ChannelIcon({channel}: {channel: MyChatChannel}) {
  if (channel.kind === 'lead') return <ClipboardList size={18} aria-hidden />
  if (channel.kind === 'dm') return <Users size={18} aria-hidden />
  if (channel.is_private) return <Lock size={18} aria-hidden />
  return <Hash size={18} aria-hidden />
}

function ChannelGroup({
  title,
  items,
  people,
  openId,
  onOpen,
  action,
  empty,
}: {
  title: string
  items: MyChatChannel[]
  people: ChatPerson[]
  openId: string | null
  onOpen: (id: string) => void
  action?: React.ReactNode
  empty?: string
}) {
  if (!items.length && !action && !empty) return null
  return (
    <div className="chat-group">
      <div className="chat-group__head">
        <h2>{title}</h2>
        {action}
      </div>
      {items.length ? (
        <ul>
          {items.map(c => (
            <li key={c.id}>
              <button
                type="button"
                className={`chat-item${c.unread ? ' chat-item--unread' : ''}${c.archived_at ? ' chat-item--archived' : ''}`}
                aria-current={c.id === openId ? 'true' : undefined}
                onClick={() => onOpen(c.id)}>
                <ChannelIcon channel={c} />
                <span className="chat-item__name">{channelLabel(c, people)}</span>
                {c.archived_at && <Archive size={16} aria-label="Archived" role="img" />}
                {c.unread > 0 && (
                  <span className="chat-item__count">
                    {c.unread > 99 ? '99+' : c.unread}
                    <span className="visually-hidden"> unread</span>
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        empty && <p className="small muted chat-group__empty">{empty}</p>
      )}
    </div>
  )
}

function NewChannelDialog({
  open,
  onClose,
  orgId,
  people,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  orgId: string
  people: ChatPerson[]
  onCreated: (id: string) => void
}) {
  return (
    <Dialog open={open} onClose={onClose} title="New channel">
      {/* Mounted only while open, so the form starts empty each time. */}
      {open && <NewChannelForm onClose={onClose} orgId={orgId} people={people} onCreated={onCreated} />}
    </Dialog>
  )
}

function NewChannelForm({
  onClose,
  orgId,
  people,
  onCreated,
}: {
  onClose: () => void
  orgId: string
  people: ChatPerson[]
  onCreated: (id: string) => void
}) {
  const create = useCreateChannelMutation(orgId)
  const [name, setName] = React.useState('')
  const [topic, setTopic] = React.useState('')
  const [isPrivate, setPrivate] = React.useState(false)
  const [members, setMembers] = React.useState<string[]>([])
  const slug = slugChannelName(name)

  return (
    <form
      className="stack"
      style={{gap: 'var(--space-4)'}}
      onSubmit={e => {
        e.preventDefault()
        if (!slug) return
        create.mutate({name: slug, topic, isPrivate, members}, {onSuccess: onCreated})
      }}>
      <div className="field">
        <label className="label" htmlFor="ch-name">
          Name
        </label>
        <input
          id="ch-name"
          className="input"
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={60}
          required
        />
        <p className="small muted">
          {slug ? `Shows as #${slug}` : 'Letters, numbers, and dashes, such as parts-orders.'}
        </p>
      </div>
      <div className="field">
        <label className="label" htmlFor="ch-topic">
          What it's for (optional)
        </label>
        <input id="ch-topic" className="input" value={topic} onChange={e => setTopic(e.target.value)} maxLength={200} />
      </div>
      <label className="row" style={{gap: 'var(--space-3)', minHeight: 'var(--tap)'}}>
        <input
          type="checkbox"
          style={{width: 20, height: 20}}
          checked={isPrivate}
          onChange={e => setPrivate(e.target.checked)}
        />
        <span>
          <span className="strong">Private</span>
          <span className="small muted" style={{display: 'block'}}>
            Only the people you pick can see it. Guests can join private channels only.
          </span>
        </span>
      </label>
      {isPrivate && <PeoplePicker people={people} selected={members} onChange={setMembers} />}
      {create.error && <Alert>{businessError(create.error)}</Alert>}
      <div className="dlg__foot">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" loading={create.isPending} disabled={!slug}>
          Create channel
        </Button>
      </div>
    </form>
  )
}

function PeoplePicker({
  people,
  selected,
  onChange,
}: {
  people: ChatPerson[]
  selected: string[]
  onChange: (ids: string[]) => void
}) {
  return (
    <fieldset className="stack" style={{border: 0, padding: 0, margin: 0, gap: 'var(--space-1)'}}>
      <legend className="label" style={{marginBottom: 'var(--space-2)'}}>
        People
      </legend>
      {people.map(p => (
        <div key={p.user_id} className="row" style={{gap: 'var(--space-3)', minHeight: 'var(--tap)'}}>
          <Checkbox
            label={p.name}
            checked={selected.includes(p.user_id)}
            onChange={on => onChange(on ? [...selected, p.user_id] : selected.filter(id => id !== p.user_id))}
          />
          <span>
            {p.name} <span className="small muted">{p.role}</span>
          </span>
        </div>
      ))}
    </fieldset>
  )
}

function NewDmDialog({
  open,
  onClose,
  orgId,
  people,
  onOpened,
}: {
  open: boolean
  onClose: () => void
  orgId: string
  people: ChatPerson[]
  onOpened: (id: string) => void
}) {
  const userId = useCurrentShop().userId
  const dm = useOpenDmMutation(orgId)
  const others = people.filter(p => p.user_id !== userId)
  return (
    <Dialog open={open} onClose={onClose} title="Message a teammate">
      {!others.length ? (
        <p className="muted">You're the only one here. Invite your team from the Team page first.</p>
      ) : (
        <ul className="card menu">
          {others.map(p => (
            <li key={p.user_id}>
              <button type="button" disabled={dm.isPending} onClick={() => dm.mutate(p.user_id, {onSuccess: onOpened})}>
                <Users size={20} aria-hidden />
                <span>
                  {p.name}
                  <small>{p.role}</small>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {dm.error && <Alert>{businessError(dm.error)}</Alert>}
    </Dialog>
  )
}

function ChannelInfoDialog({
  open,
  onClose,
  orgId,
  channel,
  people,
}: {
  open: boolean
  onClose: () => void
  orgId: string
  channel: MyChatChannel
  people: ChatPerson[]
}) {
  const navigate = useNavigate()
  const members = useChannelMembersQuery(channel.id, open && channel.is_private)
  const change = useChannelMemberMutation(orgId, channel.id)
  const update = useUpdateChannelMutation(orgId)
  const [topic, setTopic] = React.useState(channel.topic ?? '')
  const inChannel = new Set(members.data?.map(m => m.user_id))
  const general = channel.name === 'general'

  return (
    <Dialog open={open} onClose={onClose} title={`#${channel.name}`}>
      <form
        className="stack"
        style={{gap: 'var(--space-2)'}}
        onSubmit={e => {
          e.preventDefault()
          update.mutate({id: channel.id, topic}, {onSuccess: () => toast('Topic saved.')})
        }}>
        <label className="label" htmlFor="ch-topic-edit">
          What it's for
        </label>
        <div className="row" style={{gap: 'var(--space-2)'}}>
          <input
            id="ch-topic-edit"
            className="input"
            value={topic}
            maxLength={200}
            onChange={e => setTopic(e.target.value)}
          />
          <Button type="submit" variant="secondary" loading={update.isPending && update.variables?.topic !== undefined}>
            Save
          </Button>
        </div>
      </form>

      {channel.is_private && (
        <div className="stack" style={{gap: 'var(--space-2)'}}>
          <h3 className="label">People in this channel</h3>
          {members.isLoading ? (
            <CardSkeletons count={2} height={44} />
          ) : (
            <ul className="biz-list">
              {people.map(p => {
                const inside = inChannel.has(p.user_id)
                return (
                  <li key={p.user_id} className="biz-row">
                    <span>
                      {p.name} <span className="small muted">{p.role}</span>
                    </span>
                    <Button
                      size="sm"
                      variant={inside ? 'ghost' : 'secondary'}
                      loading={change.isPending && change.variables?.userId === p.user_id}
                      onClick={() => change.mutate({userId: p.user_id, add: !inside})}>
                      {inside ? 'Remove' : 'Add'}
                      <span className="visually-hidden"> {p.name}</span>
                    </Button>
                  </li>
                )
              })}
            </ul>
          )}
          {change.error && <Alert>{businessError(change.error)}</Alert>}
        </div>
      )}

      {!general && (
        <Button
          variant="secondary"
          loading={update.isPending && update.variables?.archived !== undefined}
          onClick={() =>
            update.mutate(
              {id: channel.id, archived: !channel.archived_at},
              {
                onSuccess: () => {
                  toast(channel.archived_at ? 'Channel is back.' : 'Channel archived.')
                  onClose()
                  if (!channel.archived_at)
                    navigate({search: new URLSearchParams({shop: orgId}).toString()}, {replace: true})
                },
              },
            )
          }>
          <Archive size={18} aria-hidden /> {channel.archived_at ? 'Bring the channel back' : 'Archive the channel'}
        </Button>
      )}
      {update.error && <Alert>{businessError(update.error)}</Alert>}
    </Dialog>
  )
}
