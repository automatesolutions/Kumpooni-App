import {useQuery} from '@tanstack/react-query'
import {supabase} from '@/lib/supabase'
import type {Service} from '@/types/app'

export const STALE = {
  MINUTE: 60_000,
  FIVE_MINUTES: 5 * 60_000,
  HOUR: 60 * 60_000,
}

export function useCategoriesQuery() {
  return useQuery({
    queryKey: ['category'],
    staleTime: STALE.HOUR,
    queryFn: async () => {
      const {data, error} = await supabase
        .from('categories')
        .select('*')
        .eq('is_archived', false)
        .order('id', {ascending: true})
      if (error) throw error
      return data
    },
  })
}

export function useServicesByCategoryQuery(categoryId: number) {
  return useQuery({
    queryKey: ['services', {categoryId}],
    enabled: !!categoryId,
    queryFn: async () => {
      const {data, error} = await supabase
        .from('service')
        .select('*')
        .match({category_id: categoryId, is_active: true})
        .filter('store_id', 'is', null)
        .order('price', {ascending: true})
      if (error) throw error
      return data
    },
  })
}

export function useServiceSearchQuery(keyword: string) {
  return useQuery({
    queryKey: ['services', keyword],
    enabled: keyword.trim().length > 0,
    queryFn: async () => {
      const {data, error} = await supabase
        .from('service')
        .select('*')
        .is('store_id', null)
        .textSearch('name', keyword.trim(), {type: 'websearch', config: 'english'})
        .order('name')
      if (error) throw error
      return data as Service[]
    },
  })
}

export function useStoreServicesQuery(storeId: string, categoryId: number) {
  return useQuery({
    queryKey: ['store-service', {storeId, categoryId}],
    enabled: !!storeId && !!categoryId,
    queryFn: async () => {
      const {data, error} = await supabase
        .from('service')
        .select('*')
        .match({store_id: storeId, category_id: categoryId})
        .order('price', {ascending: true})
      if (error) throw error
      return data
    },
  })
}
