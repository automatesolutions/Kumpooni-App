import {describe, expect, it} from 'vitest'
import type {ChatMessageRow, ChatPerson, MyChatChannel} from '@/types/business'
import {channelLabel, chatPhotoPath, groupMessages, manilaDay, slugChannelName, sortChannels, totalUnread, upsertMessage} from './chat'

const msg = (id: string, author: string, at: string, extra: Partial<ChatMessageRow> = {}): ChatMessageRow => ({
  id,
  created_at: at,
  channel_id: 'c',
  org_id: 'o',
  author_id: author,
  body: 'Hi',
  attachment_path: null,
  edited_at: null,
  deleted_at: null,
  ...extra,
})

const channel = (extra: Partial<MyChatChannel>): MyChatChannel => ({
  id: 'x',
  kind: 'channel',
  name: 'general',
  topic: null,
  is_private: false,
  lead_id: null,
  lead_title: null,
  other_user_id: null,
  archived_at: null,
  last_message_at: null,
  unread: 0,
  ...extra,
})

const people: ChatPerson[] = [{user_id: 'u2', role: 'member', name: 'Ana Cruz', avatar_url: null}]

describe('channelLabel', () => {
  it('names channels, direct messages, and lead chats', () => {
    expect(channelLabel(channel({}), people)).toBe('#general')
    expect(channelLabel(channel({kind: 'dm', name: null, other_user_id: 'u2'}), people)).toBe('Ana Cruz')
    expect(channelLabel(channel({kind: 'dm', name: null, other_user_id: 'gone'}), people)).toBe('Someone who left')
    expect(channelLabel(channel({kind: 'lead', name: null, lead_title: 'Brake job'}), people)).toBe('Brake job')
  })
})

describe('slugChannelName', () => {
  it('matches the database rule', () => {
    expect(slugChannelName('  Parts Orders! ')).toBe('parts-orders')
    expect(slugChannelName('---')).toBe('')
    expect(slugChannelName('a'.repeat(50))).toHaveLength(40)
  })
})

describe('chatPhotoPath', () => {
  it('puts the shop and channel first', () => {
    expect(chatPhotoPath('o', 'c', 'IMG_1.JPEG', 'r')).toBe('o/c/r.jpg')
    expect(chatPhotoPath('o', 'c', 'noext', 'r')).toBe('o/c/r.jpg')
  })
})

describe('manilaDay', () => {
  it('is 8 hours ahead of UTC', () => {
    expect(manilaDay('2026-11-26T16:00:00Z')).toBe('2026-11-27')
    expect(manilaDay('2026-11-26T15:59:59Z')).toBe('2026-11-26')
  })
})

describe('groupMessages', () => {
  it('splits by Manila day and hides repeated names within 5 minutes', () => {
    const groups = groupMessages([
      msg('1', 'a', '2026-11-26T15:50:00Z'), // 23:50 in Manila, Nov 26
      msg('2', 'a', '2026-11-26T15:53:00Z'),
      msg('3', 'a', '2026-11-26T16:05:00Z'), // 00:05 in Manila, Nov 27
      msg('4', 'b', '2026-11-26T16:06:00Z'),
      msg('5', 'b', '2026-11-26T16:20:00Z'),
    ])
    expect(groups.map(g => g.day)).toEqual(['2026-11-26', '2026-11-27'])
    expect(groups[0].items.map(i => i.showAuthor)).toEqual([true, false])
    expect(groups[1].items.map(i => i.showAuthor)).toEqual([true, true, true])
  })
})

describe('upsertMessage', () => {
  it('replaces a repeat and keeps time order', () => {
    const list = [msg('1', 'a', '2026-11-26T01:00:00Z'), msg('3', 'a', '2026-11-26T03:00:00Z')]
    const next = upsertMessage(list, msg('2', 'a', '2026-11-26T02:00:00Z'))
    expect(next.map(m => m.id)).toEqual(['1', '2', '3'])
    expect(upsertMessage(next, msg('2', 'a', '2026-11-26T02:00:00Z', {body: 'Edited'}))[1].body).toBe('Edited')
  })
})

describe('sortChannels and totalUnread', () => {
  it('puts channels before direct messages before leads, newest first, archived last', () => {
    const list = sortChannels([
      channel({id: 'lead', kind: 'lead', name: null, last_message_at: '2026-11-27'}),
      channel({id: 'old', name: 'old', archived_at: '2026-11-01'}),
      channel({id: 'dm', kind: 'dm', name: null}),
      channel({id: 'gen', name: 'general', last_message_at: '2026-11-20'}),
      channel({id: 'parts', name: 'parts', last_message_at: '2026-11-26'}),
    ])
    expect(list.map(c => c.id)).toEqual(['parts', 'gen', 'dm', 'lead', 'old'])
  })
  it('counts unread outside archived channels', () => {
    expect(totalUnread([channel({unread: 2}), channel({unread: 3, archived_at: 'x'}), channel({unread: 1})])).toBe(3)
    expect(totalUnread(undefined)).toBe(0)
  })
})
