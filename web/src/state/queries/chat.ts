// Team chat (supabase/9-business-chat.sql). Row level security decides what each person
// sees, and Realtime only sends a message to people who can read its channel.
import React from 'react'
import {useMutation, useQuery, useQueryClient, type QueryClient} from '@tanstack/react-query'
import {supabase} from '@/lib/supabase'
import {CHAT_BUCKET, chatPhotoPath, upsertMessage} from '@/lib/chat'
import type {ChatMemberRow, ChatMessageRow, MyChatChannel} from '@/types/business'
import {shrinkImage} from './repair'

const keys = {
  channels: (orgId: string) => ['chat', 'channels', orgId] as const,
  people: (orgId: string) => ['chat', 'people', orgId] as const,
  messages: (channelId: string) => ['chat', 'messages', channelId] as const,
  members: (channelId: string) => ['chat', 'members', channelId] as const,
  leadChat: (leadId: string) => ['chat', 'lead', leadId] as const,
}

/** The latest messages a channel loads. Older ones come with "Show older messages". */
export const PAGE = 100

export function useChatChannelsQuery(orgId: string) {
  return useQuery({
    queryKey: keys.channels(orgId),
    enabled: !!orgId,
    queryFn: async (): Promise<MyChatChannel[]> => {
      const {data, error} = await supabase.rpc('my_chat_channels', {org: orgId})
      if (error) throw error
      return data ?? []
    },
  })
}

/** Names and avatars of the team. Guests get these too, without emails. */
export function useChatPeopleQuery(orgId: string) {
  return useQuery({
    queryKey: keys.people(orgId),
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const {data, error} = await supabase.rpc('chat_people', {org: orgId})
      if (error) throw error
      return data ?? []
    },
  })
}

export type MessagesPage = {messages: ChatMessageRow[]; hasOlder: boolean}

async function fetchMessages(channelId: string, before?: string): Promise<MessagesPage> {
  let query = supabase
    .from('chat_messages')
    .select('*')
    .eq('channel_id', channelId)
    .order('created_at', {ascending: false})
    .limit(PAGE + 1)
  if (before) query = query.lt('created_at', before)
  const {data, error} = await query
  if (error) throw error
  return {messages: data.slice(0, PAGE).reverse(), hasOlder: data.length > PAGE}
}

export function useMessagesQuery(channelId: string) {
  return useQuery({
    queryKey: keys.messages(channelId),
    enabled: !!channelId,
    queryFn: () => fetchMessages(channelId),
  })
}

export function useOlderMessagesMutation(channelId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const current = qc.getQueryData<MessagesPage>(keys.messages(channelId))
      return fetchMessages(channelId, current?.messages[0]?.created_at)
    },
    onSuccess: older =>
      qc.setQueryData<MessagesPage>(keys.messages(channelId), current => ({
        messages: [...older.messages, ...(current?.messages ?? [])],
        hasOlder: older.hasOlder,
      })),
  })
}

function putMessage(qc: QueryClient, message: ChatMessageRow) {
  qc.setQueryData<MessagesPage>(keys.messages(message.channel_id), current =>
    current ? {...current, messages: upsertMessage(current.messages, message)} : current,
  )
}

/**
 * Keeps open chats live: new, edited, and deleted messages in this shop land in the cache,
 * and the channel list refreshes its unread counts. One subscription per shop.
 */
export function useChatRealtime(orgId: string) {
  const qc = useQueryClient()
  React.useEffect(() => {
    if (!orgId) return
    const channel = supabase
      .channel(`shop-chat:${orgId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `org_id=eq.${orgId}`,
        },
        payload => {
          const row = payload.new as ChatMessageRow | undefined
          if (row?.id) putMessage(qc, row)
          void qc.invalidateQueries({queryKey: keys.channels(orgId)})
        },
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [orgId, qc])
}

type SendInput = {body: string; photo?: File | null}

export function useSendMessageMutation(orgId: string, channelId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({body, photo}: SendInput) => {
      let attachment_path: string | null = null
      if (photo) {
        if (!/^image\/(jpeg|png|webp)$/.test(photo.type)) throw new Error('Use a JPG, PNG, or WebP photo.')
        const blob = await shrinkImage(photo)
        attachment_path = chatPhotoPath(
          orgId,
          channelId,
          blob === photo ? photo.name : 'photo.jpg',
          crypto.randomUUID(),
        )
        const up = await supabase.storage.from(CHAT_BUCKET).upload(attachment_path, blob, {
          contentType: blob.type || photo.type,
          upsert: false,
        })
        if (up.error) {
          throw new Error(
            /exceeded|too large|size/i.test(up.error.message) ? 'That photo is larger than 10 MB.' : up.error.message,
          )
        }
      }
      const {data, error} = await supabase
        .from('chat_messages')
        .insert({
          channel_id: channelId,
          body: body.trim() || null,
          attachment_path,
        })
        .select('*')
        .single()
      if (error) throw error
      return data
    },
    onSuccess: message => {
      putMessage(qc, message)
      void qc.invalidateQueries({queryKey: keys.channels(orgId)})
    },
  })
}

export function useEditMessageMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({id, body}: {id: string; body: string}) => {
      const {data, error} = await supabase
        .from('chat_messages')
        .update({body: body.trim()})
        .eq('id', id)
        .select('*')
        .single()
      if (error) throw error
      return data
    },
    onSuccess: message => putMessage(qc, message),
  })
}

export function useDeleteMessageMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const {data, error} = await supabase
        .from('chat_messages')
        .update({deleted_at: new Date().toISOString()})
        .eq('id', id)
        .select('*')
        .single()
      if (error) throw error
      return data
    },
    onSuccess: message => putMessage(qc, message),
  })
}

/** Marks a channel read and clears its count in the list right away. */
export function useMarkReadMutation(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (channelId: string) => {
      const {error} = await supabase.rpc('mark_chat_read', {
        p_channel: channelId,
      })
      if (error) throw error
      return channelId
    },
    onMutate: channelId =>
      qc.setQueryData<MyChatChannel[]>(keys.channels(orgId), list =>
        list?.map(c => (c.id === channelId ? {...c, unread: 0} : c)),
      ),
  })
}

export function useOpenDmMutation(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (userId: string) => {
      const {data, error} = await supabase.rpc('open_dm', {
        org: orgId,
        p_user: userId,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({queryKey: keys.channels(orgId)}),
  })
}

/** The chat on one lead. Made the first time someone opens it. */
export function useLeadChatQuery(leadId: string) {
  return useQuery({
    queryKey: keys.leadChat(leadId),
    enabled: !!leadId,
    staleTime: Infinity,
    queryFn: async () => {
      const {data, error} = await supabase.rpc('lead_chat', {p_lead: leadId})
      if (error) throw error
      return data
    },
  })
}

type NewChannel = {
  name: string
  topic: string
  isPrivate: boolean
  members: string[]
}

export function useCreateChannelMutation(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({name, topic, isPrivate, members}: NewChannel) => {
      const {data, error} = await supabase.rpc('create_chat_channel', {
        org: orgId,
        p_name: name,
        p_topic: topic.trim() || null,
        p_private: isPrivate,
        p_members: isPrivate ? members : null,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({queryKey: keys.channels(orgId)}),
  })
}

export function useUpdateChannelMutation(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({id, topic, archived}: {id: string; topic?: string; archived?: boolean}) => {
      const patch: {topic?: string | null; archived_at?: string | null} = {}
      if (topic !== undefined) patch.topic = topic.trim() || null
      if (archived !== undefined) patch.archived_at = archived ? new Date().toISOString() : null
      const {error} = await supabase.from('chat_channels').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({queryKey: keys.channels(orgId)}),
  })
}

/** People in a private channel. */
export function useChannelMembersQuery(channelId: string, enabled: boolean) {
  return useQuery({
    queryKey: keys.members(channelId),
    enabled: !!channelId && enabled,
    queryFn: async (): Promise<ChatMemberRow[]> => {
      const {data, error} = await supabase.from('chat_members').select('*').eq('channel_id', channelId)
      if (error) throw error
      return data
    },
  })
}

export function useChannelMemberMutation(orgId: string, channelId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({userId, add}: {userId: string; add: boolean}) => {
      const {error} = add
        ? await supabase.from('chat_members').insert({channel_id: channelId, user_id: userId})
        : await supabase.from('chat_members').delete().eq('channel_id', channelId).eq('user_id', userId)
      if (error) throw error
    },
    onSuccess: () => {
      void qc.invalidateQueries({queryKey: keys.members(channelId)})
      void qc.invalidateQueries({queryKey: keys.channels(orgId)})
    },
  })
}

/** Short-lived links to chat photos. A link keeps working until it expires, so 5 minutes. */
export function useChatPhotoUrls(paths: string[]) {
  const key = [...new Set(paths)].sort()
  return useQuery({
    queryKey: ['chat-urls', key],
    enabled: key.length > 0,
    staleTime: 4 * 60 * 1000,
    gcTime: 4 * 60 * 1000,
    queryFn: async () => {
      const {data, error} = await supabase.storage.from(CHAT_BUCKET).createSignedUrls(key, 300)
      if (error) throw error
      const map: Record<string, string> = {}
      for (const item of data ?? []) if (item.path && item.signedUrl) map[item.path] = item.signedUrl
      return map
    },
  })
}
