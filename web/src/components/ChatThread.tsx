import React from 'react'
import {Dots, Pencil, Photo, Send, Trash2, Video, X} from '@/components/icons'
import {businessError} from '@/lib/business'
import {groupMessages, MESSAGE_MAX} from '@/lib/chat'
import {canRecord, CLIP_BUCKET} from '@/lib/recorder'
import {formatDate} from '@/lib/format'
import {useUserId} from '@/state/session'
import {
  useChatPhotoUrls,
  useDeleteMessageMutation,
  useEditMessageMutation,
  useMarkReadMutation,
  useMessagesQuery,
  useOlderMessagesMutation,
  useSendMessageMutation,
} from '@/state/queries/chat'
import type {ChatMessageRow, ChatPerson} from '@/types/business'
import {ClipPlayer, RecordClipDialog} from './RecordClip'
import {Alert, Button, CardSkeletons, ErrorState} from './ui'

type Props = {
  orgId: string
  channelId: string
  people: ChatPerson[]
  /** Owners and admins can delete anyone's message. */
  canModerate: boolean
  archived?: boolean
  /** Shown when there are no messages yet. */
  emptyText: string
  /** Label for the message box, such as "Message #general". */
  placeholder: string
}

/**
 * Messages in one channel, newest at the bottom, with a box to write more. New messages
 * arrive through useChatRealtime(), which the page turns on once for the shop.
 */
export function ChatThread({orgId, channelId, people, canModerate, archived, emptyText, placeholder}: Props) {
  const userId = useUserId()
  const {data, isLoading, error, refetch} = useMessagesQuery(channelId)
  const older = useOlderMessagesMutation(channelId)
  const markRead = useMarkReadMutation(orgId)
  const scroller = React.useRef<HTMLDivElement>(null)
  const atBottom = React.useRef(true)
  const messages = data?.messages ?? []
  const lastId = messages[messages.length - 1]?.id
  const shown = messages.filter(m => m.attachment_path && !m.deleted_at)
  const {data: photoUrls} = useChatPhotoUrls(
    shown.filter(m => m.attachment_kind !== 'clip').map(m => m.attachment_path!),
  )
  const {data: clipUrls} = useChatPhotoUrls(
    shown.filter(m => m.attachment_kind === 'clip').map(m => m.attachment_path!),
    CLIP_BUCKET,
  )
  const urls = React.useMemo(() => ({...photoUrls, ...clipUrls}), [photoUrls, clipUrls])

  // Read on open, and again when a new message comes in while you're looking.
  const {mutate: markReadNow} = markRead
  React.useEffect(() => {
    if (channelId && data) markReadNow(channelId)
  }, [channelId, lastId, data, markReadNow])

  // Stay at the bottom unless you scrolled up to read older messages.
  React.useLayoutEffect(() => {
    const el = scroller.current
    if (el && atBottom.current) el.scrollTop = el.scrollHeight
  }, [lastId, urls])
  React.useEffect(() => {
    atBottom.current = true
  }, [channelId])

  const person = (id: string | null) => people.find(p => p.user_id === id)

  return (
    <div className="chat">
      <div
        ref={scroller}
        className="chat__scroll"
        onScroll={e => {
          const el = e.currentTarget
          atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
        }}>
        {isLoading ? (
          <CardSkeletons count={3} height={56} />
        ) : error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : !messages.length ? (
          <p className="chat__empty muted">{emptyText}</p>
        ) : (
          <>
            {data?.hasOlder && (
              <div className="chat__older">
                <Button variant="ghost" size="sm" loading={older.isPending} onClick={() => older.mutate()}>
                  Show older messages
                </Button>
              </div>
            )}
            {groupMessages(messages).map(group => (
              <section key={group.day} aria-label={formatDate(group.day, 'dddd, D MMMM')}>
                <p className="chat__day">
                  <span>{formatDate(group.day, 'ddd, D MMM YYYY')}</span>
                </p>
                <ul className="chat__list">
                  {group.items.map(({message, showAuthor}) => (
                    <Message
                      key={message.id}
                      message={message}
                      author={person(message.author_id)}
                      showAuthor={showAuthor}
                      mine={message.author_id === userId}
                      canModerate={canModerate}
                      photoUrl={message.attachment_path ? urls?.[message.attachment_path] : undefined}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </>
        )}
      </div>
      {archived ? (
        <p className="chat__archived small muted">This channel is archived. You can read it, but not send messages.</p>
      ) : (
        <Composer
          orgId={orgId}
          channelId={channelId}
          placeholder={placeholder}
          label={placeholder.replace(/^Message /, '')}
          onSent={() => (atBottom.current = true)}
        />
      )}
    </div>
  )
}

function Avatar({person}: {person?: ChatPerson}) {
  if (person?.avatar_url)
    return <img className="chat__avatar" src={person.avatar_url} alt="" referrerPolicy="no-referrer" />
  return (
    <span className="chat__avatar chat__avatar--initial" aria-hidden>
      {(person?.name[0] ?? '?').toUpperCase()}
    </span>
  )
}

function Message({
  message,
  author,
  showAuthor,
  mine,
  canModerate,
  photoUrl,
}: {
  message: ChatMessageRow
  author?: ChatPerson
  showAuthor: boolean
  mine: boolean
  canModerate: boolean
  photoUrl?: string
}) {
  const [menu, setMenu] = React.useState(false)
  const [editing, setEditing] = React.useState(false)
  const [draft, setDraft] = React.useState(message.body ?? '')
  const edit = useEditMessageMutation()
  const remove = useDeleteMessageMutation()
  const deleted = !!message.deleted_at
  const canEdit = mine && !deleted && !!message.body
  const canDelete = !deleted && (mine || canModerate)
  const time = formatDate(message.created_at, 'h:mm A')
  const name = author?.name ?? 'Someone who left'

  return (
    <li className={`chat__msg${showAuthor ? ' chat__msg--first' : ''}`}>
      <div className="chat__gutter">
        {showAuthor ? <Avatar person={author} /> : <span className="chat__time-hover">{time}</span>}
      </div>
      <div className="chat__content">
        {showAuthor && (
          <p className="chat__meta">
            <span className="strong">{name}</span> <time dateTime={message.created_at}>{time}</time>
          </p>
        )}
        {!showAuthor && <span className="visually-hidden">{`${name}, ${time}`}</span>}
        {deleted ? (
          <p className="chat__body muted">This message was deleted.</p>
        ) : editing ? (
          <form
            className="stack"
            style={{gap: 'var(--space-2)'}}
            onSubmit={e => {
              e.preventDefault()
              if (!draft.trim()) return
              edit.mutate({id: message.id, body: draft}, {onSuccess: () => setEditing(false)})
            }}>
            <label className="visually-hidden" htmlFor={`edit-${message.id}`}>
              Edit message
            </label>
            <textarea
              id={`edit-${message.id}`}
              className="textarea"
              rows={2}
              maxLength={MESSAGE_MAX}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              autoFocus
            />
            {edit.error && <Alert>{businessError(edit.error)}</Alert>}
            <div className="row" style={{gap: 'var(--space-2)'}}>
              <Button type="submit" size="sm" loading={edit.isPending} disabled={!draft.trim()}>
                Save
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <>
            {message.body && (
              <p className="chat__body">
                {message.body}
                {message.edited_at && <span className="small muted"> (edited)</span>}
              </p>
            )}
            {message.attachment_path && message.attachment_kind === 'clip' ? (
              photoUrl ? (
                <ClipPlayer src={photoUrl} label={`Clip from ${name}`} />
              ) : (
                <span className="chat__clip chat__photo--loading" aria-label="Loading clip" />
              )
            ) : (
              message.attachment_path &&
              (photoUrl ? (
                <a href={photoUrl} target="_blank" rel="noreferrer" className="chat__photo">
                  <img src={photoUrl} alt={`Photo from ${name}`} loading="lazy" />
                </a>
              ) : (
                <span className="chat__photo chat__photo--loading" aria-label="Loading photo" />
              ))
            )}
          </>
        )}
        {remove.error && <Alert>{businessError(remove.error)}</Alert>}
      </div>
      {(canEdit || canDelete) && !editing && (
        <div className="chat__actions">
          <button
            type="button"
            className="icon-btn"
            aria-label={`More for the message at ${time}`}
            aria-expanded={menu}
            onClick={() => setMenu(m => !m)}>
            {menu ? <X size={18} /> : <Dots size={18} />}
          </button>
          {menu && (
            <div className="chat__menu" role="group" aria-label="Message actions">
              {canEdit && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setDraft(message.body ?? '')
                    setEditing(true)
                    setMenu(false)
                  }}>
                  <Pencil size={16} aria-hidden /> Edit
                </Button>
              )}
              {canDelete && (
                <Button
                  size="sm"
                  variant="ghost"
                  loading={remove.isPending}
                  onClick={() =>
                    remove.mutate(
                      {id: message.id, clipPath: message.attachment_kind === 'clip' ? message.attachment_path : null},
                      {onSuccess: () => setMenu(false)},
                    )
                  }>
                  <Trash2 size={16} aria-hidden /> Delete
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </li>
  )
}

function Composer({
  orgId,
  channelId,
  placeholder,
  label,
  onSent,
}: {
  orgId: string
  channelId: string
  placeholder: string
  label: string
  onSent: () => void
}) {
  const [recording, setRecording] = React.useState(false)
  const send = useSendMessageMutation(orgId, channelId)
  const [body, setBody] = React.useState('')
  const [photo, setPhoto] = React.useState<File | null>(null)
  const preview = React.useMemo(() => (photo ? URL.createObjectURL(photo) : null), [photo])
  const fileInput = React.useRef<HTMLInputElement>(null)
  const id = React.useId()
  React.useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview])
  // A different channel starts with an empty box.
  React.useEffect(() => {
    setBody('')
    setPhoto(null)
  }, [channelId])

  const canSend = (!!body.trim() || !!photo) && !send.isPending
  const submit = () => {
    if (!canSend) return
    onSent()
    send.mutate(
      {body, photo},
      {
        onSuccess: () => {
          setBody('')
          setPhoto(null)
        },
      },
    )
  }

  return (
    <>
      <form
        className="chat__composer"
        onSubmit={e => {
          e.preventDefault()
          submit()
        }}>
        {send.error && <Alert>{businessError(send.error, "We couldn't send it. Try again.")}</Alert>}
        {preview && (
          <div className="chat__preview">
            <img src={preview} alt="Photo to send" />
            <button type="button" className="icon-btn" aria-label="Remove the photo" onClick={() => setPhoto(null)}>
              <X size={18} />
            </button>
          </div>
        )}
        <div className="chat__box">
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="visually-hidden"
            tabIndex={-1}
            onChange={e => {
              setPhoto(e.target.files?.[0] ?? null)
              e.target.value = ''
            }}
          />
          <button
            type="button"
            className="icon-btn"
            aria-label="Add a photo"
            onClick={() => fileInput.current?.click()}>
            <Photo size={20} />
          </button>
          {canRecord() && (
            <button type="button" className="icon-btn" aria-label="Record a clip" onClick={() => setRecording(true)}>
              <Video size={20} />
            </button>
          )}
          <label htmlFor={id} className="visually-hidden">
            {placeholder}
          </label>
          <textarea
            id={id}
            className="chat__input"
            rows={1}
            maxLength={MESSAGE_MAX}
            placeholder={placeholder}
            value={body}
            onChange={e => setBody(e.target.value)}
            onKeyDown={e => {
              // Enter sends on a keyboard. Shift+Enter starts a new line.
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                submit()
              }
            }}
          />
          <button type="submit" className="icon-btn chat__send" aria-label="Send" disabled={!canSend}>
            {send.isPending ? <span className="spinner" aria-hidden /> : <Send size={20} />}
          </button>
        </div>
      </form>
      {/* Outside the form, because the recorder has its own form. */}
      <RecordClipDialog
        open={recording}
        onClose={() => {
          setRecording(false)
          onSent()
        }}
        orgId={orgId}
        channelId={channelId}
        label={label}
      />
    </>
  )
}
