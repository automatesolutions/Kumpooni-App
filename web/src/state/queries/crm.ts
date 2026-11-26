// The shop CRM (supabase/8-business-crm.sql), and sharing a repair file with a shop.
// Row level security decides what each person sees. These hooks never filter for safety.
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {supabase} from '@/lib/supabase'
import {CONSENT_VERSION, normalizeShareFields, todayManila, type ShareField} from '@/lib/crm'
import type {ItemKind} from '@/lib/kinds'
import type {
  CustomerRow,
  FollowUpRow,
  LeadActivityRow,
  LeadRow,
  MyFileShare,
  PipelineStageRow,
  SharedFile,
} from '@/types/business'
import {BUCKET} from './repair'

const keys = {
  stages: (orgId: string) => ['crm', 'stages', orgId] as const,
  leads: (orgId: string) => ['crm', 'leads', orgId] as const,
  lead: (id: string) => ['crm', 'lead', id] as const,
  customers: (orgId: string) => ['crm', 'customers', orgId] as const,
  due: (orgId: string) => ['crm', 'due', orgId] as const,
  shared: (shareId: string) => ['crm', 'shared', shareId] as const,
  fileShares: (fileId: string) => ['crm', 'file-shares', fileId] as const,
}

export function useStagesQuery(orgId: string) {
  return useQuery({
    queryKey: keys.stages(orgId),
    enabled: !!orgId,
    queryFn: async (): Promise<PipelineStageRow[]> => {
      const {data, error} = await supabase.from('pipeline_stages').select('*').eq('org_id', orgId).order('position')
      if (error) throw error
      return data
    },
  })
}

export type LeadWithCustomer = LeadRow & {customer: Pick<CustomerRow, 'id' | 'name' | 'mobile'> | null}

async function attachCustomers(leads: LeadRow[]): Promise<LeadWithCustomer[]> {
  const ids = [...new Set(leads.map(l => l.customer_id))]
  if (!ids.length) return []
  const {data, error} = await supabase.from('customers').select('id, name, mobile').in('id', ids)
  if (error) throw error
  return leads.map(l => ({...l, customer: data.find(c => c.id === l.customer_id) ?? null}))
}

/** Every lead in the shop you can see. Guests get only the ones assigned to them. */
export function useLeadsQuery(orgId: string) {
  return useQuery({
    queryKey: keys.leads(orgId),
    enabled: !!orgId,
    queryFn: async () => {
      const {data, error} = await supabase
        .from('leads')
        .select('*')
        .eq('org_id', orgId)
        .order('updated_at', {ascending: false})
        .limit(500)
      if (error) throw error
      return attachCustomers(data)
    },
  })
}

export type LeadDetail = {
  lead: LeadRow
  customer: CustomerRow | null
  activities: LeadActivityRow[]
  followUps: FollowUpRow[]
}

export function useLeadQuery(leadId: string) {
  return useQuery({
    queryKey: keys.lead(leadId),
    enabled: !!leadId,
    queryFn: async (): Promise<LeadDetail | null> => {
      const {data: lead, error} = await supabase.from('leads').select('*').eq('id', leadId).maybeSingle()
      if (error) throw error
      if (!lead) return null
      const [customer, activities, followUps] = await Promise.all([
        supabase.from('customers').select('*').eq('id', lead.customer_id).maybeSingle(),
        supabase.from('lead_activities').select('*').eq('lead_id', leadId).order('created_at'),
        supabase.from('follow_ups').select('*').eq('lead_id', leadId).order('due_on'),
      ])
      for (const r of [customer, activities, followUps]) if (r.error) throw r.error
      return {lead, customer: customer.data, activities: activities.data ?? [], followUps: followUps.data ?? []}
    },
  })
}

function useInvalidateLead(orgId: string) {
  const qc = useQueryClient()
  return (leadId?: string) => {
    qc.invalidateQueries({queryKey: keys.leads(orgId)})
    qc.invalidateQueries({queryKey: keys.due(orgId)})
    qc.invalidateQueries({queryKey: keys.customers(orgId)})
    if (leadId) qc.invalidateQueries({queryKey: keys.lead(leadId)})
  }
}

/** Moves a lead. The database logs the move on the timeline. Optimistic, so the board doesn't jump. */
export function useMoveLeadMutation(orgId: string) {
  const qc = useQueryClient()
  const invalidate = useInvalidateLead(orgId)
  return useMutation({
    mutationFn: async (input: {leadId: string; stageId: string}) => {
      const {data, error} = await supabase
        .from('leads')
        .update({stage_id: input.stageId})
        .eq('id', input.leadId)
        .select('id')
      if (error) throw error
      if (!data.length) throw new Error('not_allowed')
    },
    onMutate: async input => {
      await qc.cancelQueries({queryKey: keys.leads(orgId)})
      const before = qc.getQueryData<LeadWithCustomer[]>(keys.leads(orgId))
      qc.setQueryData<LeadWithCustomer[]>(keys.leads(orgId), list =>
        list?.map(l => (l.id === input.leadId ? {...l, stage_id: input.stageId} : l)),
      )
      return {before}
    },
    onError: (_e, _input, ctx) => qc.setQueryData(keys.leads(orgId), ctx?.before),
    onSettled: (_d, _e, input) => invalidate(input.leadId),
  })
}

export function useUpdateLeadMutation(orgId: string, leadId: string) {
  const invalidate = useInvalidateLead(orgId)
  return useMutation({
    mutationFn: async (patch: Partial<Pick<LeadRow, 'title' | 'kind' | 'quote_amount' | 'assignee_id' | 'stage_id'>>) => {
      const {data, error} = await supabase.from('leads').update(patch).eq('id', leadId).select('id')
      if (error) throw error
      if (!data.length) throw new Error('not_allowed')
    },
    onSuccess: () => invalidate(leadId),
  })
}

export function useDeleteLeadMutation(orgId: string) {
  const invalidate = useInvalidateLead(orgId)
  return useMutation({
    mutationFn: async (leadId: string) => {
      const {data, error} = await supabase.from('leads').delete().eq('id', leadId).select('id')
      if (error) throw error
      if (!data.length) throw new Error('not_allowed')
    },
    onSuccess: () => invalidate(),
  })
}

/** A lead the shop adds itself. A new customer is made first when there isn't one. */
export function useCreateManualLeadMutation(orgId: string) {
  const invalidate = useInvalidateLead(orgId)
  return useMutation({
    mutationFn: async (input: {
      customerId: string | null
      customer: {name: string; mobile: string; email: string}
      title: string
      kind: ItemKind | null
      stageId: string
      quote: number | null
    }) => {
      let customerId = input.customerId
      if (!customerId) {
        const {data, error} = await supabase
          .from('customers')
          .insert({
            org_id: orgId,
            name: input.customer.name.trim(),
            mobile: input.customer.mobile.trim() || null,
            email: input.customer.email.trim() || null,
            consent_version: CONSENT_VERSION,
          })
          .select('id')
          .single()
        if (error) throw error
        customerId = data.id
      }
      const {data, error} = await supabase
        .from('leads')
        .insert({
          org_id: orgId,
          customer_id: customerId,
          stage_id: input.stageId,
          title: input.title.trim(),
          kind: input.kind,
          quote_amount: input.quote,
        })
        .select('id')
        .single()
      if (error) throw error
      return data.id
    },
    onSuccess: () => invalidate(),
  })
}

export function useAddNoteMutation(orgId: string, leadId: string) {
  const invalidate = useInvalidateLead(orgId)
  return useMutation({
    mutationFn: async (body: string) => {
      const {error} = await supabase.from('lead_activities').insert({lead_id: leadId, type: 'note', body: body.trim()})
      if (error) throw error
    },
    onSuccess: () => invalidate(leadId),
  })
}

export function useAddFollowUpMutation(orgId: string, leadId: string) {
  const invalidate = useInvalidateLead(orgId)
  return useMutation({
    mutationFn: async (input: {dueOn: string; reason: FollowUpRow['reason']; note: string}) => {
      const {error} = await supabase
        .from('follow_ups')
        .insert({lead_id: leadId, due_on: input.dueOn, reason: input.reason, note: input.note.trim() || null})
      if (error) throw error
    },
    onSuccess: () => invalidate(leadId),
  })
}

export function useFollowUpDoneMutation(orgId: string) {
  const invalidate = useInvalidateLead(orgId)
  return useMutation({
    mutationFn: async (input: {id: string; leadId: string; done: boolean}) => {
      const {data, error} = await supabase
        .from('follow_ups')
        .update({done_at: input.done ? new Date().toISOString() : null})
        .eq('id', input.id)
        .select('id')
      if (error) throw error
      if (!data.length) throw new Error('not_allowed')
    },
    onSuccess: (_d, input) => invalidate(input.leadId),
  })
}

export type DueFollowUp = FollowUpRow & {lead: Pick<LeadRow, 'id' | 'title'> | null}

/** Open follow-ups due today or earlier, by Manila date. */
export function useDueFollowUpsQuery(orgId: string) {
  return useQuery({
    queryKey: keys.due(orgId),
    enabled: !!orgId,
    queryFn: async (): Promise<DueFollowUp[]> => {
      const {data, error} = await supabase
        .from('follow_ups')
        .select('*')
        .eq('org_id', orgId)
        .is('done_at', null)
        .lte('due_on', todayManila())
        .order('due_on')
        .limit(50)
      if (error) throw error
      if (!data.length) return []
      const {data: leads, error: leadError} = await supabase
        .from('leads')
        .select('id, title')
        .in(
          'id',
          data.map(f => f.lead_id),
        )
      if (leadError) throw leadError
      return data.map(f => ({...f, lead: leads.find(l => l.id === f.lead_id) ?? null}))
    },
  })
}

export type CustomerWithLeads = CustomerRow & {leads: Pick<LeadRow, 'id' | 'title' | 'stage_id' | 'updated_at'>[]}

export function useCustomersQuery(orgId: string) {
  return useQuery({
    queryKey: keys.customers(orgId),
    enabled: !!orgId,
    queryFn: async (): Promise<CustomerWithLeads[]> => {
      const [customers, leads] = await Promise.all([
        supabase.from('customers').select('*').eq('org_id', orgId).order('name').limit(500),
        supabase.from('leads').select('id, title, stage_id, updated_at, customer_id').eq('org_id', orgId).limit(1000),
      ])
      if (customers.error) throw customers.error
      if (leads.error) throw leads.error
      return customers.data.map(c => ({...c, leads: leads.data.filter(l => l.customer_id === c.id)}))
    },
  })
}

export function useUpdateCustomerMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {id: string; name: string; mobile: string; email: string; notes: string}) => {
      const {data, error} = await supabase
        .from('customers')
        .update({
          name: input.name.trim(),
          mobile: input.mobile.trim() || null,
          email: input.email.trim() || null,
          notes: input.notes.trim() || null,
        })
        .eq('id', input.id)
        .select('id')
      if (error) throw error
      if (!data.length) throw new Error('not_allowed')
    },
    onSuccess: () => qc.invalidateQueries({queryKey: ['crm']}),
  })
}

// ---------- Shared repair files ----------

/** What the customer shared, live. Null once they stop sharing. */
export function useSharedFileQuery(shareId: string | null) {
  return useQuery({
    queryKey: keys.shared(shareId ?? ''),
    enabled: !!shareId,
    staleTime: 0,
    queryFn: async () => {
      const {data, error} = await supabase.rpc('shared_file', {p_share: shareId!})
      if (error) throw error
      return (data as SharedFile | null) ?? null
    },
  })
}

/**
 * Short links to shared photos. Five minutes, because a link keeps working until it expires,
 * even after the customer stops sharing.
 */
export function useSharedPhotoUrls(paths: string[]) {
  const key = [...paths].sort()
  return useQuery({
    queryKey: ['shared-urls', key],
    enabled: key.length > 0,
    staleTime: 4 * 60 * 1000,
    gcTime: 4 * 60 * 1000,
    queryFn: async () => {
      const {data, error} = await supabase.storage.from(BUCKET).createSignedUrls(key, 300)
      if (error) throw error
      const map: Record<string, string> = {}
      for (const item of data ?? []) if (item.path && item.signedUrl) map[item.path] = item.signedUrl
      return map
    },
  })
}

/** The verified shop on this Google place, if there is one. */
export function useVerifiedShopQuery(placeId: string | null | undefined) {
  return useQuery({
    queryKey: ['crm', 'verified-shop', placeId],
    enabled: !!placeId,
    queryFn: async () => {
      const {data, error} = await supabase.rpc('verified_shop_for_place', {p_place_id: placeId!})
      if (error) throw error
      return data?.[0] ?? null
    },
  })
}

export function useMyFileSharesQuery(fileId: string) {
  return useQuery({
    queryKey: keys.fileShares(fileId),
    enabled: !!fileId,
    queryFn: async (): Promise<MyFileShare[]> => {
      const {data, error} = await supabase.rpc('my_file_shares', {p_file: fileId})
      if (error) throw error
      return data ?? []
    },
  })
}

export function useShareFileMutation(fileId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {orgId: string; fields: ShareField[]}) => {
      const {error} = await supabase.from('file_shares').insert({
        file_id: fileId,
        org_id: input.orgId,
        fields: normalizeShareFields(input.fields),
        consent_version: CONSENT_VERSION,
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({queryKey: keys.fileShares(fileId)}),
  })
}

export function useStopShareMutation(fileId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (shareId: string) => {
      const {data, error} = await supabase
        .from('file_shares')
        .update({revoked_at: new Date().toISOString()})
        .eq('id', shareId)
        .select('id')
      if (error) throw error
      if (!data.length) throw new Error('not_allowed')
    },
    onSuccess: () => qc.invalidateQueries({queryKey: keys.fileShares(fileId)}),
  })
}
