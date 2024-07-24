import {useQuery} from '@tanstack/react-query'

import {supabase} from '#/lib/supabase'
import {logger} from '#/logger'
import {SupabaseClient} from '@supabase/supabase-js'
import {Database} from '#/types/supabase'

export type ServiceFeed = Service & {
  category: {
    id: number
    name: string
  }
}

export const useServicesFeed = (searchKeyword: string) => {
  return useQuery({
    queryKey: ['services', searchKeyword],
    queryFn: async () => {
      const {data, error} = await supabase
        .from('service')
        .select('*, category:category_id(id, name)')
        .is('store_id', null)
        .textSearch('name', searchKeyword, {
          type: 'websearch',
          config: 'english',
        })
        .order('name')
      console.log('Error', error)
      if (error) throw error
      //@ts-ignore
      return data.length > 0 ? (data as ServiceFeed[]) : []
    },
    enabled: !!searchKeyword,
  })
}

export function useServicesByCategoryQuery(categoryId: number) {
  return useQuery({
    queryKey: ['services', {categoryId}],
    queryFn: async () => {
      const {data, error} = await supabase
        .from('service')
        .select('*')
        .match({category_id: categoryId, is_active: true})
        .filter('store_id', 'is', null)
        .order('price', {ascending: true})

      if (error) {
        logger.error('useServicesByCategoryQuery', error)
        throw new Error('Failed to fetch data')
      }
      return data
    },
    enabled: !!categoryId,
  })
}

export async function getServicesByCategory(client: SupabaseClient<Database>) {
  return client.from('service').select('*')
}
export type Service = NonNullable<
  Awaited<ReturnType<typeof getServicesByCategory>>['data']
>[0]
