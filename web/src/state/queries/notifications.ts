import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {supabase} from '@/lib/supabase'
import type {Database} from '@/types/supabase'
import type {NotificationGroup} from '@/types/app'

type NotificationInsert = Database['public']['Tables']['notifications']['Insert']

export async function createNotification(input: NotificationInsert) {
  const {error} = await supabase.from('notifications').insert(input)
  // A missing notification should not fail the booking itself.
  if (error) console.error('createNotification', error)
}

export function useNotificationsQuery(userId: string) {
  return useQuery({
    queryKey: ['notifications'],
    enabled: !!userId,
    staleTime: 0,
    queryFn: async () => {
      const {data, error} = await supabase.rpc('get_notifications', {user_id_param: userId})
      if (error) throw error
      return (data ?? []) as unknown as NotificationGroup[]
    },
  })
}

export function useUnreadCountQuery(userId: string) {
  return useQuery({
    queryKey: ['notifications-count', {userId}],
    enabled: !!userId,
    refetchInterval: 60_000,
    queryFn: async () => {
      const {count, error} = await supabase
        .from('notifications')
        .select('id', {count: 'exact', head: true})
        .eq('user_id', userId)
        .eq('is_read', false)
      if (error) throw error
      return count ?? 0
    },
  })
}

export function useMarkAsReadMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const {error} = await supabase.from('notifications').update({is_read: true}).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['notifications']})
      queryClient.invalidateQueries({queryKey: ['notifications-count']})
    },
  })
}
