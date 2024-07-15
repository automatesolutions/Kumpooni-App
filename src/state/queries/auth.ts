import { supabase } from '#/lib/supabase'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export const isProfileIncomplete = async (id: string) => {
  const { data } = await supabase
    .from('users')
    .select('first_name, phone')
    .eq('id', id)
    .neq('first_name', null)
    .neq('last_name', null)
    .single()

  return !!data
}

export type UpdateProfile = {
  id: string
  changes: {
    first_name: string
    last_name: string
  }
}

export const useUpdateProfile = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateProfile) => {
      const { error } = await supabase
        .from('users')
        .update(input.changes)
        .eq('id', input.id)
        .single()

      await supabase.auth.updateUser({
        data: input.changes,
      })

      if (error) throw error

      return null
    },
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({
        queryKey: ['users'],
      })
    },
  })
}
