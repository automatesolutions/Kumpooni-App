import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {supabase} from '@/lib/supabase'
import type {Coords} from '@/lib/geo'
import type {
  AttachmentKind,
  AttachmentRow,
  JobSlipRow,
  LetterLanguage,
  LetterRow,
  LetterType,
  OfficeRow,
  RepairFileRow,
  Remedy,
  SlipExtra,
  VehicleKind,
  VisitRow,
} from '@/types/repair-proof'
import type {Json} from '@/types/supabase'
import type {RepairPack} from '@/lib/rag'
import {STALE} from './catalog'

export const BUCKET = 'repair-proof'

export type FileVehicle = {
  id: string
  kind: VehicleKind
  year_model: string | null
  plate_no: string | null
  vin_last6: string | null
  make_text: string | null
  model_text: string | null
  brand: {name: string} | null
  model: {name: string} | null
}

export type RepairFileListItem = RepairFileRow & {
  vehicle: FileVehicle | null
  visits: Pick<VisitRow, 'id' | 'date_in' | 'date_out' | 'amount_paid' | 'result'>[]
  attachments: Pick<AttachmentRow, 'id'>[]
  letters: Pick<LetterRow, 'id'>[]
}

export type RepairFileDetail = RepairFileRow & {
  vehicle: FileVehicle | null
  visits: VisitRow[]
  attachments: AttachmentRow[]
  job_slip: JobSlipRow | null
  letters: LetterRow[]
}

const VEHICLE = 'vehicle(id, kind, year_model, plate_no, vin_last6, make_text, model_text, brand(name), model(name))'
const LIST_KEY = ['repair-files']
const fileKey = (id: string) => ['repair-file', id]

export function useFilesQuery(userId: string) {
  return useQuery({
    queryKey: LIST_KEY,
    enabled: !!userId,
    queryFn: async () => {
      const {data, error} = await supabase
        .from('repair_files')
        .select(`*, ${VEHICLE}, visits(id, date_in, date_out, amount_paid, result), attachments(id), letters(id)`)
        .eq('user_id', userId)
        .order('updated_at', {ascending: false})
      if (error) throw error
      return (data ?? []) as unknown as RepairFileListItem[]
    },
  })
}

export function useRepairPacksQuery(userId: string) {
  return useQuery({
    queryKey: ['repair-packs'],
    enabled: !!userId,
    queryFn: async () => {
      const {data, error} = await supabase
        .from('repair_files')
        .select(`*, ${VEHICLE}, visits(*), attachments(*), job_slips(*)`)
        .eq('user_id', userId)
        .order('started_at', {ascending: false})
      if (error) throw error
      return (data ?? []).map(row => {
        const {job_slips, ...rest} = row as unknown as RepairPack & {
          job_slips: JobSlipRow | JobSlipRow[] | null
        }
        const slip = Array.isArray(job_slips) ? (job_slips[0] ?? null) : job_slips
        return {
          ...rest,
          job_slip: slip ? {...slip, extras: (slip.extras ?? []) as SlipExtra[]} : null,
        } as RepairPack
      })
    },
  })
}

export function useFileQuery(id: string | undefined) {
  return useQuery({
    queryKey: fileKey(id ?? ''),
    enabled: !!id,
    queryFn: async () => {
      const {data, error} = await supabase
        .from('repair_files')
        .select(`*, ${VEHICLE}, visits(*), attachments(*), job_slips(*), letters(*)`)
        .eq('id', id!)
        .maybeSingle()
      if (error) throw error
      if (!data) return null
      const {job_slips, ...rest} = data as unknown as Omit<RepairFileDetail, 'job_slip'> & {
        job_slips: JobSlipRow | JobSlipRow[] | null
      }
      const slip = Array.isArray(job_slips) ? (job_slips[0] ?? null) : job_slips
      return {
        ...rest,
        job_slip: slip ? {...slip, extras: (slip.extras ?? []) as SlipExtra[]} : null,
        letters: [...(rest.letters ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at)),
      } as RepairFileDetail
    },
  })
}

function useInvalidateFile() {
  const queryClient = useQueryClient()
  return (fileId: string) =>
    Promise.all([
      queryClient.invalidateQueries({queryKey: fileKey(fileId)}),
      queryClient.invalidateQueries({queryKey: LIST_KEY}),
      queryClient.invalidateQueries({queryKey: ['repair-packs']}),
    ])
}

export type FileInput = {
  vehicle_id: string | null
  shop_name: string
  shop_city: string | null
  problem: string
  started_at: string
  peso_cap: number | null
}

export function useSaveFileMutation() {
  const invalidate = useInvalidateFile()
  return useMutation({
    mutationFn: async ({id, values}: {id?: string; values: Partial<FileInput & RepairFileRow>}) => {
      const query = id
        ? supabase.from('repair_files').update(values).eq('id', id)
        : supabase.from('repair_files').insert(values as FileInput)
      const {data, error} = await query.select('*').single()
      if (error) throw error
      return data as RepairFileRow
    },
    onSuccess: row => invalidate(row.id),
  })
}

export function useDeleteFileMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (file: {id: string; user_id: string; attachments: Pick<AttachmentRow, 'storage_path'>[]}) => {
      const {error} = await supabase.from('repair_files').delete().eq('id', file.id)
      if (error) throw error
      const paths = file.attachments.map(a => a.storage_path)
      if (paths.length) await supabase.storage.from(BUCKET).remove(paths)
    },
    onSuccess: (_d, file) => {
      queryClient.removeQueries({queryKey: fileKey(file.id)})
      return queryClient.invalidateQueries({queryKey: LIST_KEY})
    },
  })
}

/** Storage isn't removed by the database cascade, so photos go first when an account is deleted. */
export async function deleteAllProof(userId: string) {
  const {data} = await supabase.from('attachments').select('storage_path').eq('user_id', userId)
  const paths = (data ?? []).map(a => a.storage_path)
  for (let i = 0; i < paths.length; i += 100) await supabase.storage.from(BUCKET).remove(paths.slice(i, i + 100))
}

export type VisitInput = Pick<VisitRow, 'date_in' | 'date_out' | 'story' | 'shop_said' | 'result' | 'amount_paid' | 'phrases'>

export function useSaveVisitMutation(fileId: string) {
  const invalidate = useInvalidateFile()
  return useMutation({
    mutationFn: async ({id, values}: {id?: string; values: VisitInput}) => {
      const query = id
        ? supabase.from('visits').update(values).eq('id', id)
        : supabase.from('visits').insert({...values, file_id: fileId})
      const {error} = await query
      if (error) throw error
    },
    onSuccess: () => invalidate(fileId),
  })
}

export function useDeleteVisitMutation(fileId: string) {
  const invalidate = useInvalidateFile()
  return useMutation({
    mutationFn: async (visitId: string) => {
      const {error} = await supabase.from('visits').delete().eq('id', visitId)
      if (error) throw error
    },
    onSuccess: () => invalidate(fileId),
  })
}

const MAX_SIDE = 2000

/** Phone photos are large. Shrink big images to 2000px JPEG before upload. */
async function shrinkImage(file: File): Promise<Blob> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size < 1_500_000) return file
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/jpeg', 0.85))
    return blob && blob.size < file.size ? blob : file
  } catch {
    return file
  }
}

type UploadInput = {userId: string; files: File[]; kind: AttachmentKind; caption: string | null}

async function uploadAttachments(fileId: string, {userId, files, kind, caption}: UploadInput) {
  for (const file of files) {
    if (!/^(image\/(jpeg|png|webp)|application\/pdf)$/.test(file.type)) {
      throw new Error(`${file.name} is not a photo or PDF. Use JPG, PNG, WebP, or PDF.`)
    }
    const body = await shrinkImage(file)
    const type = body.type || file.type
    const ext = type === 'application/pdf' ? 'pdf' : type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg'
    const path = `${userId}/${fileId}/${crypto.randomUUID()}.${ext}`
    const up = await supabase.storage.from(BUCKET).upload(path, body, {contentType: type, upsert: false})
    if (up.error) {
      throw new Error(
        /exceeded|too large|size/i.test(up.error.message)
          ? `${file.name} is larger than 10 MB. Use a smaller file.`
          : up.error.message,
      )
    }
    const {error} = await supabase.from('attachments').insert({
      file_id: fileId,
      kind,
      storage_path: path,
      mime_type: type,
      caption: caption || null,
      taken_at: new Date(file.lastModified || Date.now()).toISOString(),
    })
    if (error) {
      await supabase.storage.from(BUCKET).remove([path])
      throw error
    }
  }
}

export function useUploadAttachmentMutation(fileId: string) {
  const invalidate = useInvalidateFile()
  return useMutation({
    mutationFn: (input: UploadInput) => uploadAttachments(fileId, input),
    onSuccess: () => invalidate(fileId),
  })
}

/**
 * Starts a file from a photo, one sentence, or both. The photo is saved as the quote.
 * If the photo fails to upload, the file is kept and the error says so.
 */
export function useStartFileMutation() {
  const invalidate = useInvalidateFile()
  return useMutation({
    mutationFn: async ({userId, values, photo}: {userId: string; values: FileInput; photo: File | null}) => {
      const {data, error} = await supabase.from('repair_files').insert(values).select('*').single()
      if (error) throw error
      const row = data as RepairFileRow
      let photoError: string | null = null
      if (photo) {
        try {
          await uploadAttachments(row.id, {userId, files: [photo], kind: 'estimate', caption: null})
        } catch (e) {
          photoError = e instanceof Error ? e.message : 'The photo did not save.'
        }
      }
      await invalidate(row.id)
      return {row, photoError}
    },
  })
}

export function useDeleteAttachmentMutation(fileId: string) {
  const invalidate = useInvalidateFile()
  return useMutation({
    mutationFn: async (row: Pick<AttachmentRow, 'id' | 'storage_path'>) => {
      const {error} = await supabase.from('attachments').delete().eq('id', row.id)
      if (error) throw error
      await supabase.storage.from(BUCKET).remove([row.storage_path])
    },
    onSuccess: () => invalidate(fileId),
  })
}

/** Signed links for private photos, good for one hour. */
export function useSignedUrls(paths: string[]) {
  const key = [...paths].sort()
  return useQuery({
    queryKey: ['signed-urls', key],
    enabled: key.length > 0,
    staleTime: 50 * 60 * 1000,
    queryFn: async () => {
      const {data, error} = await supabase.storage.from(BUCKET).createSignedUrls(key, 3600)
      if (error) throw error
      const map: Record<string, string> = {}
      for (const item of data ?? []) if (item.path && item.signedUrl) map[item.path] = item.signedUrl
      return map
    },
  })
}

export type SlipInput = Pick<JobSlipRow, 'job_text' | 'peso_cap' | 'dropoff_at' | 'owner_name' | 'owner_mobile' | 'extras'>

export function useSaveSlipMutation(fileId: string) {
  const invalidate = useInvalidateFile()
  return useMutation({
    mutationFn: async (values: SlipInput) => {
      const {data, error} = await supabase
        .from('job_slips')
        .upsert({...values, extras: values.extras as unknown as Json, file_id: fileId}, {onConflict: 'file_id'})
        .select('*')
        .single()
      if (error) throw error
      return data as unknown as JobSlipRow
    },
    onSuccess: () => invalidate(fileId),
  })
}

export type PublicSlip = {
  public_code: string
  job_text: string
  peso_cap: number | null
  dropoff_at: string | null
  owner_name: string | null
  owner_mobile: string | null
  extras: SlipExtra[]
  created_at: string
  updated_at: string
  shop_name: string
  shop_city: string | null
  vehicle: {kind: VehicleKind; year_model: string | null; plate_no: string | null; make: string | null; model: string | null} | null
  photos: {path: string; caption: string | null}[]
}

export function usePublicSlipQuery(code: string | undefined) {
  return useQuery({
    queryKey: ['public-slip', code],
    enabled: !!code,
    queryFn: async () => {
      const {data, error} = await supabase.rpc('get_job_slip', {code: code!})
      if (error) throw error
      return (data ?? null) as unknown as PublicSlip | null
    },
  })
}

export function useOfficesQuery() {
  return useQuery({
    queryKey: ['offices'],
    staleTime: STALE.HOUR,
    queryFn: async () => {
      const {data, error} = await supabase.from('offices').select('*').order('name')
      if (error) throw error
      return (data ?? []) as OfficeRow[]
    },
  })
}

export async function saveLastLocation(userId: string, coords: Coords) {
  await supabase
    .from('users')
    .update({last_lat: coords.lat, last_lng: coords.lng, last_located_at: new Date().toISOString()})
    .eq('id', userId)
}

export async function loadLastLocation(userId: string): Promise<Coords | null> {
  const {data} = await supabase.from('users').select('last_lat, last_lng').eq('id', userId).maybeSingle()
  return data?.last_lat != null && data?.last_lng != null ? {lat: data.last_lat, lng: data.last_lng} : null
}

export type LetterInput = {
  file_id: string
  office_id: number | null
  letter_type: LetterType
  remedy: Remedy
  language: LetterLanguage
  owner_lat: number | null
  owner_lng: number | null
}

/** Asks the draft-complaint Edge Function for a body written only from this file. */
export function useDraftLetterMutation(fileId: string) {
  const invalidate = useInvalidateFile()
  return useMutation({
    mutationFn: async (input: LetterInput) => {
      const {data, error} = await supabase.functions.invoke('draft-complaint', {body: input})
      if (error) {
        const ctx = (error as {context?: Response}).context
        let detail: {error?: string; message?: string} | null = null
        try {
          detail = ctx ? await ctx.json() : null
        } catch {
          detail = null
        }
        const status = ctx?.status
        const code = detail?.error ?? (status === 404 ? 'not_deployed' : 'failed')
        throw Object.assign(new Error(detail?.message ?? draftErrorMessage(code)), {code})
      }
      return (data as {letter: LetterRow}).letter
    },
    onSuccess: () => invalidate(fileId),
  })
}

export function draftErrorMessage(code: string) {
  switch (code) {
    case 'not_deployed':
    case 'not_configured':
      return "AI drafting isn't set up yet. You can use the plain template instead."
    case 'daily_draft_limit':
      return 'You can make two AI drafts per repair file each day. Edit your last draft, or use the plain template.'
    case 'thin_file':
      return 'Add the shop name and at least one visit first.'
    case 'invented_fact':
      return 'The AI draft used a detail that is not in your file, so we did not keep it. Try again, or use the plain template.'
    default:
      return "We couldn't draft the letter. Try again, or use the plain template."
  }
}

export function useSaveLetterMutation(fileId: string) {
  const invalidate = useInvalidateFile()
  return useMutation({
    mutationFn: async ({id, values}: {id?: string; values: Partial<LetterRow>}) => {
      const query = id
        ? supabase.from('letters').update(values).eq('id', id)
        : supabase.from('letters').insert({...values, file_id: fileId} as LetterRow)
      const {data, error} = await query.select('*').single()
      if (error) throw error
      return data as LetterRow
    },
    onSuccess: () => invalidate(fileId),
  })
}
