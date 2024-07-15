import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '../../lib/supabase'
import { STALE } from '#/state/queries'

import { z } from 'zod'
import { vehicleFormSchema } from '#/lib/validations/user'
import { Vehicle } from '#/stores/vehicle'

export const RQKEY = () => ['my-vehicles']

export function useVehiclesQuery(sessionId: string) {
  return useQuery({
    staleTime: STALE.HOURS.ONE,
    enabled: !!sessionId,
    queryKey: RQKEY(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicle')
        .select(
          'id, year_model, plate_no, brand(id, name, img_url), model(id, name)',
        )
        .eq('user_id', sessionId)

      if (error) {
        throw new Error('Failed to fetch cars')
      }

      return data
    },
  })
}

export function useVehiclesDeleteMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (vehicleId: string) => {
      await supabase.from('vehicle').delete().eq('id', vehicleId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RQKEY() })
    },
  })
}

export function useVehiclesEditMutation() {
  const queryClient = useQueryClient()
  return useMutation<
    Vehicle,
    Error,
    z.infer<typeof vehicleFormSchema> & { userId: string }
  >({
    mutationFn: async ({ userId, ...item }) => {
      const { data, error } = await supabase
        .from('vehicle')
        .update({ ...item, user_id: userId })
        .eq('id', item.id)
        .select('id, year_model, brand(id, name), model(id, name), plate_no')
        .single()

      if (error) throw error
      return data as Vehicle
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: RQKEY(),
      })
    },
    onError: (err, newVehicle, context) => {
      //@ts-ignore
      queryClient.setQueriesData(RQKEY(), context.prevVehicles)
    },
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: RQKEY() })
    },
  })
}
export function useVehiclesAddMutation() {
  const queryClient = useQueryClient()
  return useMutation<
    Vehicle,
    Error,
    z.infer<typeof vehicleFormSchema> & { userId: string }
  >({
    mutationFn: async ({ userId, id, ...item }) => {
      const { data, error } = await supabase
        .from('vehicle')
        .insert({ ...item, user_id: userId })
        .select('id, year_model, brand(id, name), model(id, name)')
        .single()

      if (error) throw error
      return data as Vehicle
    },
    onMutate: async newVehicle => {
      await queryClient.cancelQueries({ queryKey: RQKEY() })
      const prevVehicles = queryClient.getQueriesData({ queryKey: RQKEY() })
      return { prevVehicles, newVehicle }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: RQKEY(),
      })
    },
    onError: (err, newVehicle, context) => {
      //@ts-ignore
      queryClient.setQueriesData(RQKEY(), context.prevVehicles)
    },
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: RQKEY() })
    },
  })
}
