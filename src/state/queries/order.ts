import { supabase } from '#/lib/supabase'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

type InputOrder = {
  user_id: string | undefined
  repair_order_id: string
}
export const useGetRepairOrderId = ({
  user_id,
  repair_order_id,
}: InputOrder) => {
  return useQuery({
    // enabled: !!user_id,
    queryKey: ['repair_order', { user_id, repair_order_id }],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('repair_order')
        .select(
          `id, created_at, total_cost, appointment_date, appointment_time, status, reference_no,  
            services:repair_order_line(id, price, ...service_id(service_name:name), name, quantity), 
            parts:repair_order_part(id, part_id, name, price, quantity, part_no, unit_measure),
            store(id, name, address, contact_no, store_img, store_logo, latitude, longitude),
            vehicle(id, brand(id, name), 
            model(id, name), year_model, plate_no)`,
        )
        .match({ id: repair_order_id, user_id })
        .single()

      if (error) throw error
      if (!data) return
      //@ts-ignore;
      return data as RepairOrderTypes
    },
  })
}

const cancelAppointment = async ({
  id,
  user_id,
}: {
  id: string
  user_id: string
}) => {
  const { error } = await supabase
    .from('repair_order')
    .update({ status: 'Canceled' })
    .match({ id, user_id })

  if (error) throw new Error('Failed to cancel your appointment.')
}
export const updateRepairMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: cancelAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repair_order'] })
    },
  })
}

export function useUpdateRepairMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    async mutationFn({
      repair_order_id,
      selectedTime,
      selectedDate,
    }: {
      repair_order_id: string
      selectedTime: string
      selectedDate: string
    }) {
      const { error } = await supabase
        .from('repair_order')
        .update({
          appointment_time: selectedTime,
          appointment_date: selectedDate,
        })
        .eq('id', repair_order_id!)

      if (error) throw new Error('Failed to reschedule your booking')
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ['repair_order'] })
    },
  })
}
