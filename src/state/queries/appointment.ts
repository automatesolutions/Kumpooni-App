import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createNotification } from './notification'
import { RepairOrderTypes, TransactionOrderTypes } from '#/types/automate'

import { TransactionTabTypes } from '#/lib/constants'
import { STALE } from '.'
import { supabase } from '#/lib/supabase'
import { useSession } from '../session'
import { logger } from '#/logger'

type AddAppointment = {
  store_id: string
  appointment_date: string
  repair_order_id: string
}

type AddRepairOrder = {
  requested_services: { quantity: number; service_id: number }[]
  user_id: string
  vehicle_id?: string
  appointment_date: string
  appointment_time: string
  store_id: string
}

export const createRepairOrder = async ({
  requested_services,
  vehicle_id,
  user_id,
  store_id,
  appointment_date,
  appointment_time,
}: AddRepairOrder) => {
  if (!user_id || !store_id || !appointment_date || !appointment_time) {
    throw new Error(`Failed to submit data.`)
  }

  const { data, error } = await supabase
    .rpc('create_repair_order', {
      user_id,
      store_id,
      appointment_date,
      appointment_time,
      services_arg: requested_services,
      vehicle_id: vehicle_id,
    })
    .returns<{
      user_id: string
      reference_no: string
      repair_order_id: string
    }>()

  if (error) {
    console.error('Error', error)
    throw new Error(`Failed to book ${error.message}`)
  }

  console.log('data', data)

  if (data) {
    await createNotification({
      notification_type: 'SCHEDULED',
      content:
        'Congratulations you have a new appointment: ' + data.reference_no,
      user_id: data.user_id,
      store_id: store_id,
      repair_order_id: data.repair_order_id,
    })
  }
  return data
}

// requested_services: servicesId,
export const useRepairOrderMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createRepairOrder,
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({
        queryKey: ['repair_order'],
      })
    },
  })
}

export async function getRepairOrderByUserId(input: { user_id: string }) {
  const { data, error } = await supabase
    .from('repair_order')
    .select(
      `id, appointment_date, appointment_time, status, reference_no, 
      vehicle(id, brand(id, name), model(id, name), year_model, plate_no), 
      services:repair_order_lines(id, price, name, ...service_id(service_name:name)),
      store(name, store_logo, tagline)
     `,
    )
    .eq('user_id', input.user_id)
    .order('appointment_date', {
      ascending: true,
    })

  if (error) throw error
  if (!data) return
  return data as unknown as TransactionOrderTypes[]
}
export const useRepairOrderQuery = ({ user_id }: { user_id: string }) => {
  return useQuery({
    enabled: !!user_id,
    queryFn: async () => await getRepairOrderByUserId({ user_id }),
    queryKey: ['repair_order', user_id],
  })
}

export const useRepairOrderQueryV2 = (filter: TransactionTabTypes) => {
  const { session } = useSession()
  const filterArr = filter.split('|')

  return useQuery({
    staleTime: STALE.MINUTES.FIVE,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('repair_order')
        .select(
          `id, appointment_date, appointment_time, status, reference_no, 
        vehicle(id, brand(id, name), model(id, name), year_model, plate_no), 
        services:repair_order_line(id, price, name, ...service_id(service_name:name)),
        store(id, name, store_logo, tagline), reviews(id, rating, content)
       `,
        )
        .in('status', filterArr)
        .eq('user_id', session?.user.id!)
        .order('appointment_date', {
          ascending: true,
        })
      if (error) {
        logger.error('useRepairOrderQueryV2', { error })
        throw error
      }
      return data
    },
    queryKey: ['repair_order', filter],
  })
}
// .select(
//   'id, booking_date, status, booking_item(*), vehicle(id, brand(name), model(name), year_model, plate_no)',
// )
// .match({ user_id: userId })
// .order('booking_date', { ascending: false });
