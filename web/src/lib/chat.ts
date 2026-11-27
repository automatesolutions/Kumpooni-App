// Team chat helpers (supabase/9-business-chat.sql). Pure functions, so they're easy to test.
import type {ChatMessageRow, ChatPerson, MyChatChannel} from '@/types/business'

export const MESSAGE_MAX = 4000
export const CHAT_BUCKET = 'shop-chat'

/** How a channel shows in the list and the header. */
export function channelLabel(
  channel: Pick<MyChatChannel, 'kind' | 'name' | 'lead_title' | 'other_user_id'>,
  people: ChatPerson[],
) {
  if (channel.kind === 'channel') return `#${channel.name}`
  if (channel.kind === 'lead') return channel.lead_title ?? 'Lead'
  return people.find(p => p.user_id === channel.other_user_id)?.name ?? 'Someone who left'
}

/** The same rule as the database: lowercase letters, numbers, and dashes, up to 40. */
export function slugChannelName(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

/** Where a chat photo goes: <org id>/<channel id>/<random>.<ext>. */
export function chatPhotoPath(orgId: string, channelId: string, fileName: string, id: string) {
  const ext =
    (fileName.includes('.') ? fileName.split('.').pop()! : 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  return `${orgId}/${channelId}/${id}.${ext === 'jpeg' ? 'jpg' : ext}`
}

export type MessageGroup = {
  day: string
  items: {message: ChatMessageRow; showAuthor: boolean}[]
}

/** YYYY-MM-DD in Manila, where every shop is. */
export function manilaDay(iso: string) {
  return new Date(new Date(iso).getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

/** Groups messages by Manila day, and hides the name on a run from one person within 5 minutes. */
export function groupMessages(messages: ChatMessageRow[]): MessageGroup[] {
  const groups: MessageGroup[] = []
  let prev: ChatMessageRow | null = null
  for (const m of messages) {
    const day = manilaDay(m.created_at)
    let group = groups[groups.length - 1]
    if (!group || group.day !== day) {
      group = {day, items: []}
      groups.push(group)
      prev = null
    }
    const sameRun =
      !!prev &&
      prev.author_id === m.author_id &&
      !prev.deleted_at &&
      new Date(m.created_at).getTime() - new Date(prev.created_at).getTime() < 5 * 60 * 1000
    group.items.push({message: m, showAuthor: !sameRun})
    prev = m
  }
  return groups
}

/** Adds or replaces one message, keeping time order. Realtime can repeat a message we already have. */
export function upsertMessage(list: ChatMessageRow[], message: ChatMessageRow) {
  const next = list.filter(m => m.id !== message.id)
  next.push(message)
  return next.sort((a, b) => a.created_at.localeCompare(b.created_at))
}

/** Channels, then direct messages, then lead chats, newest first. Archived channels go last. */
export function sortChannels(list: MyChatChannel[]) {
  const order = {channel: 0, dm: 1, lead: 2} as const
  return [...list].sort(
    (a, b) =>
      Number(!!a.archived_at) - Number(!!b.archived_at) ||
      order[a.kind] - order[b.kind] ||
      (b.last_message_at ?? '').localeCompare(a.last_message_at ?? '') ||
      (a.name ?? '').localeCompare(b.name ?? ''),
  )
}

export function totalUnread(list: MyChatChannel[] | undefined) {
  return (list ?? []).filter(c => !c.archived_at).reduce((n, c) => n + c.unread, 0)
}
