import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {supabase} from '@/lib/supabase'
import type {OrderTab} from '@/lib/constants'
import type {OrderDetail, OrderListItem} from '@/types/app'
import {STALE} from './catalog'
import {createNotification} from './notifications'

type CreateOrderInput = {
  requested_services: {quantity: number; service_id: number}[]
  user_id: string
  vehicle_id?: string
  appointment_date: string
  appointment_time: string
  store_id: string
}

export function useCreateOrderMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateOrderInput) => {
      const {data, error} = await supabase.rpc('create_repair_order', {
        user_id: input.user_id,
        store_id: input.store_id,
        appointment_date: input.appointment_date,
        appointment_time: input.appointment_time,
        services_arg: input.requested_services,
        vehicle_id: input.vehicle_id,
      } as never)
      if (error) throw new Error(`We couldn't book this appointment. ${error.message}`)

      const order = data as unknown as {repair_order_id: string; reference_no: string} | null
      if (order?.repair_order_id) {
        await createNotification({
          type: 'scheduled',
          description: null,
          user_id: input.user_id,
          store_id: input.store_id,
          repair_order_id: order.repair_order_id,
          metadata: {repair_order_id: order.repair_order_id, type: 'scheduled'},
        })
      }
      return order
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['repair_order']})
      queryClient.invalidateQueries({queryKey: ['notifications']})
    },
  })
}

export function useOrdersQuery(userId: string, tab: OrderTab) {
  return useQuery({
    queryKey: ['repair_order', tab],
    enabled: !!userId,
    staleTime: STALE.MINUTE,
    queryFn: async () => {
      const {data, error} = await supabase
        .from('repair_order')
        .select(
          `id, appointment_date, appointment_time, status, reference_no,
          vehicle(id, brand(id, name), model(id, name), year_model, plate_no),
          services:repair_order_line(id, price, name, ...service_id(service_name:name)),
          store(id, name, store_logo, tagline), reviews(id, rating, content)`,
        )
        .in('status', tab.split('|') as never)
        .eq('user_id', userId)
        .order('appointment_date', {ascending: tab !== 'completed' && tab !== 'canceled'})
      if (error) throw error
      return (data ?? []) as unknown as OrderListItem[]
    },
  })
}

export function useOrderQuery(userId: string, orderId: string) {
  return useQuery({
    queryKey: ['repair_order', {userId, orderId}],
    enabled: !!userId && !!orderId,
    queryFn: async () => {
      const {data, error} = await supabase
        .from('repair_order')
        .select(
          `id, created_at, total_cost, appointment_date, appointment_time, status, reference_no,
          services:repair_order_line(id, price, ...service_id(service_name:name), name, quantity),
          parts:repair_order_part(id, part_id, name, price, quantity, part_no, unit_measure),
          store(id, name, address, contact_no, store_img, store_logo, latitude, longitude),
          vehicle(id, brand(id, name), model(id, name), year_model, plate_no),
          reviews(id)`,
        )
        .match({id: orderId, user_id: userId})
        .single()
      if (error) throw error
      return data as unknown as OrderDetail
    },
  })
}

export function useCreateReviewMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      content: string
      rating: number
      store_id: string
      repair_order_id: string
      user_id: string
    }) => {
      const {error} = await supabase.from('reviews').insert([input])
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({queryKey: ['repair_order']}),
  })
}
