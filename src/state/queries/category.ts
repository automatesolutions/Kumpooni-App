import {supabase} from '#/lib/supabase'
import {logger} from '#/logger'
import {Categories} from '#/types/automate'
import {useQuery} from '@tanstack/react-query'

export const RQKEY = () => ['category']

export function useCategoryQuery() {
  return useQuery({
    queryKey: RQKEY(),
    queryFn: async () => {
      const {data, error, status, statusText} = await supabase
        .from('categories')
        .select('*')
        .eq('is_archived', false)
        .order('id', {ascending: true})

      if (data) return data
      if (error) {
        logger.error('useCategoryQuery', error)
        throw new Error('Failed to fetch data')
      }
      throw new Error('Failed to fetch data')
      // return data
    },
  })
}
