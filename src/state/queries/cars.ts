import { supabase } from '#/lib/supabase'
import { useQuery } from '@tanstack/react-query'

export type AddVehicleRequest = {
  brand_id: number
  model_id: number
  year_model: string
  plate_no?: string
}
export const RQKEY = () => ['my-vehicles']
export const useGetBrands = () => {
  return useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brand')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      return data
    },
  })
}

export const useGetModels = (brand_id: number) => {
  return useQuery({
    enabled: !!brand_id,
    queryKey: ['models', brand_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('model')
        .select('*')
        .match({ brand_id })
        .order('name', { ascending: true })
      if (error) throw error
      return data
    },
  })
}
