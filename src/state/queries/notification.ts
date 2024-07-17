import {supabase} from '#/lib/supabase';
import {ParsedNotification} from '#/types/automate';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';

import {useEffect, useMemo, useState} from 'react';
import {useSession} from '../session';
import {queryClient} from '#/lib/react-query';
import {Enums} from '#/types/supabase';

type insertNotification = {
  type: Enums<'notification_type'>;
  description: string | null;
  user_id: string | null;
  store_id: string;
  repair_order_id: string;
};
type NotificationType =
  | 'new-order'
  | 'canceled-order'
  | 'inprogress-order'
  | 'completed-order'
  | 'important'
  | 'store'
  | 'services'
  | 'updates';

export const createNotification = async (input: insertNotification) => {
  const {data, error} = await supabase.from('notifications').insert(input);
  if (error) console.error(error);
};

async function getNotifications(userId: string) {
  return await supabase
    .rpc('get_notifications', {
      user_id_param: userId,
    })
    .returns<ParsedNotification>();
}

export async function prefetchNotifications() {
  const {session} = await useSession();

  if (!session) return;
  await queryClient.prefetchQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const {data, error} = await getNotifications(session?.user.id);
      if (error) throw error;

      return data ?? null;
    },
  });
}

export const useNotifications = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const {data, error} = await getNotifications(userId!);
      if (error) throw error;
      return data;
    },
    staleTime: 0, //5mins
    enabled: !!userId,
  });
};

export function useUnreadCountNotification(userId: string) {
  return useQuery({
    queryKey: ['notifications-count', {userId}],
    queryFn: async () => {
      const {data, error} = await supabase.rpc('count_unread_notifications', {
        user_id_param: userId,
      });
      if (error) console.log({error});
      return data;
    },
    enabled: !!userId,
  });
}
type Notifications = {
  date: string;
  data: ParsedNotification[];
};
export function useHasUnreadNotification() {
  const queryClient = useQueryClient();

  const [unread, setUnread] = useState<boolean>(false);
  function hasUnreadNotifications(data: Notifications[]) {
    if (!(data.length > 0)) return false;
    for (const dateEntry of data) {
      for (const notification of dateEntry.data) {
        if (!notification.is_read) {
          return true;
        }
      }
    }
    return false;
  }

  useEffect(() => {
    const cachedNotif: Notifications[] | undefined = queryClient.getQueryData([
      'notifications',
    ]);

    const hasUnread = hasUnreadNotifications(cachedNotif ?? []);

    setUnread(hasUnread);
  }, [queryClient, setUnread]);

  return unread;
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({id}: {id: string}) => {
      await supabase.from('notifications').update({is_read: true}).eq('id', id);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['notifications'],
      });
    },
  });
}
