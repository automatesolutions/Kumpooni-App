import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {z} from 'zod'
import {supabase} from '@/lib/supabase'
import {ITEM_KINDS, kindGroup} from '@/lib/kinds'
import type {Vehicle} from '@/types/app'
import {STALE} from './catalog'

/** Each box on its own. The start page uses this, since every box there is optional. */
export const itemDetailsSchema = z.object({
  kind: z.enum(ITEM_KINDS),
  brand_id: z.coerce.number(),
  model_id: z.coerce.number(),
  make_text: z.string().trim().max(40, 'Use 40 characters or fewer.').default(''),
  model_text: z.string().trim().max(60, 'Use 60 characters or fewer.').default(''),
  year_model: z.string().default(''),
  plate_no: z.string().max(15, 'Use 15 characters or fewer.').default(''),
  vin_last6: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9]{0,6}$/, 'Use the last 6 letters or numbers.')
    .default(''),
})

/** The add-item page: the boxes each type needs are required. */
export const vehicleFormSchema = itemDetailsSchema.superRefine((v, ctx) => {
  const group = kindGroup(v.kind)
  if (v.kind === 'car') {
    if (v.brand_id < 1) ctx.addIssue({code: 'custom', path: ['brand_id'], message: 'Choose a brand.'})
    if (v.model_id < 1) ctx.addIssue({code: 'custom', path: ['model_id'], message: 'Choose a model.'})
  } else if (group === 'place') {
    if (!v.model_text) ctx.addIssue({code: 'custom', path: ['model_text'], message: 'Say what needs work, for example Kitchen roof.'})
  } else {
    if (!v.make_text) ctx.addIssue({code: 'custom', path: ['make_text'], message: 'Enter the brand.'})
    if (v.kind === 'motorcycle' && !v.model_text)
      ctx.addIssue({code: 'custom', path: ['model_text'], message: 'Enter the model, for example Click 125i.'})
  }
  if (group === 'vehicle' && !v.year_model) ctx.addIssue({code: 'custom', path: ['year_model'], message: 'Choose a year.'})
})
export type VehicleForm = z.infer<typeof vehicleFormSchema>

const RQKEY = ['my-vehicles']
const SELECT =
  'id, kind, year_model, plate_no, vin_last6, make_text, model_text, brand(id, name, img_url), model(id, name)'

/**
 * Cars use the brand and model lists. Motorcycles and devices use typed text.
 * Places keep only their name, in model_text. Plates are for vehicles; vin_last6
 * holds a VIN for vehicles and a serial number for devices.
 */
function toRow({kind, brand_id, model_id, make_text, model_text, year_model, plate_no, vin_last6}: VehicleForm) {
  const car = kind === 'car'
  const group = kindGroup(kind)
  return {
    kind,
    brand_id: car && brand_id > 0 ? brand_id : null,
    model_id: car && model_id > 0 ? model_id : null,
    make_text: car || group === 'place' ? null : make_text || null,
    model_text: car ? null : model_text || null,
    year_model: group === 'place' ? null : year_model || null,
    plate_no: group === 'vehicle' ? plate_no.trim().toUpperCase() || null : null,
    vin_last6: group === 'place' ? null : vin_last6.toUpperCase() || null,
  }
}

export function useVehiclesQuery(userId: string) {
  return useQuery({
    queryKey: RQKEY,
    enabled: !!userId,
    staleTime: STALE.HOUR,
    queryFn: async () => {
      const {data, error} = await supabase.from('vehicle').select(SELECT).eq('user_id', userId)
      if (error) throw error
      return (data ?? []) as unknown as Vehicle[]
    },
  })
}

export function useSaveVehicleMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      userId,
      ...values
    }: VehicleForm & {id?: string; userId: string}) => {
      const row = {...toRow(values as VehicleForm), user_id: userId}
      const query = id
        ? supabase.from('vehicle').update(row).eq('id', id)
        : supabase.from('vehicle').insert(row)
      const {data, error} = await query.select(SELECT).single()
      if (error) throw error
      return data as unknown as Vehicle
    },
    onSettled: () => {
      queryClient.invalidateQueries({queryKey: RQKEY})
      queryClient.invalidateQueries({queryKey: ['repair-files']})
    },
  })
}

export function useDeleteVehicleMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (vehicleId: string) => {
      const {error} = await supabase.from('vehicle').delete().eq('id', vehicleId)
      if (error) throw error
    },
    onSettled: () => queryClient.invalidateQueries({queryKey: RQKEY}),
  })
}

export function useBrandsQuery(enabled = true) {
  return useQuery({
    queryKey: ['brands'],
    enabled,
    staleTime: STALE.HOUR,
    queryFn: async () => {
      const {data, error} = await supabase.from('brand').select('*').order('name')
      if (error) throw error
      return data
    },
  })
}

export function useModelsQuery(brandId: number) {
  return useQuery({
    queryKey: ['models', brandId],
    enabled: !!brandId,
    staleTime: STALE.HOUR,
    queryFn: async () => {
      const {data, error} = await supabase
        .from('model')
        .select('*')
        .match({brand_id: brandId})
        .order('name')
      if (error) throw error
      return data
    },
  })
}
