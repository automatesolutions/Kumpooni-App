import {useMutation, useQueryClient} from '@tanstack/react-query'
import {z} from 'zod'
import {supabase} from '@/lib/supabase'

export const profileSchema = z.object({
  first_name: z.string().trim().min(1, 'Enter your first name.'),
  last_name: z.string().trim().min(1, 'Enter your last name.'),
})
export type ProfileForm = z.infer<typeof profileSchema>

/** True when the person already has a first and last name saved. */
export async function hasCompleteProfile(userId: string) {
  const {data} = await supabase
    .from('users')
    .select('first_name, last_name')
    .eq('id', userId)
    .maybeSingle()
  return Boolean(data?.first_name && data?.last_name)
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({id, changes}: {id: string; changes: ProfileForm}) => {
      const {error} = await supabase.from('users').update(changes).eq('id', id)
      if (error) throw error
      await supabase.auth.updateUser({data: changes})
    },
    onSuccess: () => queryClient.invalidateQueries({queryKey: ['users']}),
  })
}

export async function deleteAccount() {
  const {error} = await supabase.rpc('delete_user')
  if (error) throw error
}
