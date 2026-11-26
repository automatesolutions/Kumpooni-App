// Shops, teams, invites, and claims (supabase/7-business.sql).
// Row level security decides what each person sees. These hooks never filter for safety.
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {supabase} from '@/lib/supabase'
import type {AssignableRole, ClaimMethod, ShopRole} from '@/lib/business'
import type {ItemKind} from '@/lib/kinds'
import {
  CLAIM_COLUMNS,
  type ClaimStart,
  type InvitePreview,
  type ShopClaimRow,
  type ShopInviteRow,
  type ShopMemberListItem,
  type ShopOrgRow,
} from '@/types/business'

export const CLAIM_BUCKET = 'shop-claims'

export type MyShop = ShopOrgRow & {role: ShopRole}

const keys = {
  mine: (userId: string) => ['business', 'mine', userId] as const,
  members: (orgId: string) => ['business', 'members', orgId] as const,
  invites: (orgId: string) => ['business', 'invites', orgId] as const,
  claims: (orgId: string) => ['business', 'claims', orgId] as const,
  queue: ['business', 'claim-queue'] as const,
}

/** Shops you belong to, with your role in each. */
export function useMyShopsQuery(userId: string) {
  return useQuery({
    queryKey: keys.mine(userId),
    enabled: !!userId,
    queryFn: async (): Promise<MyShop[]> => {
      const {data: roles, error} = await supabase.from('shop_members').select('org_id, role').eq('user_id', userId)
      if (error) throw error
      if (!roles.length) return []
      const {data: orgs, error: orgError} = await supabase
        .from('shop_orgs')
        .select('*')
        .in(
          'id',
          roles.map(r => r.org_id),
        )
        .order('name')
      if (orgError) throw orgError
      const roleOf = new Map(roles.map(r => [r.org_id, r.role]))
      return orgs.map(o => ({...o, role: roleOf.get(o.id)!}))
    },
  })
}

/** One of your shops, from the same list, so switching shops doesn't refetch. */
export function useMyShop(userId: string, orgId: string | null | undefined) {
  const query = useMyShopsQuery(userId)
  const shop = query.data?.find(s => s.id === orgId) ?? null
  return {...query, shop}
}

export function useCreateShopMutation(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {name: string; city: string; categories: ItemKind[]; placeId: string | null}) => {
      const {data, error} = await supabase.rpc('create_shop', {
        p_name: input.name,
        p_city: input.city || null,
        p_categories: input.categories,
        p_place_id: input.placeId,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({queryKey: keys.mine(userId)}),
  })
}

export function useUpdateShopMutation(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {id: string; name: string; city: string; categories: ItemKind[]}) => {
      const {error} = await supabase
        .from('shop_orgs')
        .update({name: input.name, city: input.city || null, categories: input.categories})
        .eq('id', input.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({queryKey: keys.mine(userId)}),
  })
}

export function usePlaceTakenQuery(placeId: string | null) {
  return useQuery({
    queryKey: ['business', 'place-taken', placeId],
    enabled: !!placeId,
    queryFn: async () => {
      const {data, error} = await supabase.rpc('shop_place_taken', {p_place_id: placeId!})
      if (error) throw error
      return data
    },
  })
}

// ---------- Team ----------

export function useMembersQuery(orgId: string, enabled = true) {
  return useQuery({
    queryKey: keys.members(orgId),
    enabled: !!orgId && enabled,
    queryFn: async (): Promise<ShopMemberListItem[]> => {
      const {data, error} = await supabase.rpc('shop_member_list', {org: orgId})
      if (error) throw error
      return data ?? []
    },
  })
}

export function useInvitesQuery(orgId: string, enabled = true) {
  return useQuery({
    queryKey: keys.invites(orgId),
    enabled: !!orgId && enabled,
    queryFn: async (): Promise<ShopInviteRow[]> => {
      const {data, error} = await supabase
        .from('shop_invites')
        .select('id, created_at, org_id, email, role, invited_by, expires_at, accepted_at, accepted_by')
        .eq('org_id', orgId)
        .is('accepted_at', null)
        .order('created_at', {ascending: false})
      if (error) throw error
      return data
    },
  })
}

/** Returns the raw invite token. It's shown once, as a link to copy. */
export function useCreateInviteMutation(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {email: string; role: AssignableRole}) => {
      const {data, error} = await supabase.rpc('create_shop_invite', {org: orgId, p_email: input.email, p_role: input.role})
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({queryKey: keys.invites(orgId)}),
  })
}

export function useDeleteInviteMutation(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const {error} = await supabase.from('shop_invites').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({queryKey: keys.invites(orgId)}),
  })
}

export function useChangeRoleMutation(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {userId: string; role: AssignableRole}) => {
      const {data, error} = await supabase
        .from('shop_members')
        .update({role: input.role})
        .eq('org_id', orgId)
        .eq('user_id', input.userId)
        .select('user_id')
      if (error) throw error
      if (!data.length) throw new Error('not_allowed')
    },
    onSuccess: () => qc.invalidateQueries({queryKey: keys.members(orgId)}),
  })
}

/** Removes someone, or leaves the shop when it's you. */
export function useRemoveMemberMutation(orgId: string, myId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (userId: string) => {
      const {data, error} = await supabase
        .from('shop_members')
        .delete()
        .eq('org_id', orgId)
        .eq('user_id', userId)
        .select('user_id')
      if (error) throw error
      if (!data.length) throw new Error('not_allowed')
    },
    onSuccess: () => {
      qc.invalidateQueries({queryKey: keys.members(orgId)})
      qc.invalidateQueries({queryKey: keys.mine(myId)})
    },
  })
}

export function useInvitePreviewQuery(token: string) {
  return useQuery({
    queryKey: ['business', 'invite', token],
    enabled: !!token,
    queryFn: async () => {
      const {data, error} = await supabase.rpc('shop_invite_preview', {token})
      if (error) throw error
      return (data as InvitePreview | null) ?? null
    },
  })
}

export function useAcceptInviteMutation(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (token: string) => {
      const {data, error} = await supabase.rpc('accept_shop_invite', {token})
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({queryKey: keys.mine(userId)}),
  })
}

// ---------- Claims ----------

export function useClaimsQuery(orgId: string, enabled = true) {
  return useQuery({
    queryKey: keys.claims(orgId),
    enabled: !!orgId && enabled,
    queryFn: async (): Promise<ShopClaimRow[]> => {
      const {data, error} = await supabase
        .from('shop_claims')
        .select(CLAIM_COLUMNS)
        .eq('org_id', orgId)
        .order('created_at', {ascending: false})
        .limit(10)
      if (error) throw error
      return data as unknown as ShopClaimRow[]
    },
  })
}

/** Uploads a DTI certificate to <org id>/<random>.<ext> in the private bucket. */
export async function uploadClaimDocument(orgId: string, file: File) {
  const ext = (file.name.split('.').pop() ?? 'bin').toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin'
  const path = `${orgId}/${crypto.randomUUID()}.${ext}`
  const {error} = await supabase.storage.from(CLAIM_BUCKET).upload(path, file, {contentType: file.type, upsert: false})
  if (error) throw error
  return path
}

export function useRequestClaimMutation(orgId: string, userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      method: ClaimMethod
      bn?: string
      document?: File | null
      note?: string
      disputedPlaceId?: string | null
    }): Promise<ClaimStart> => {
      const documentPath = input.document ? await uploadClaimDocument(orgId, input.document) : null
      const {data, error} = await supabase.rpc('request_shop_claim', {
        org: orgId,
        p_method: input.method,
        p_bn: input.bn?.trim() || null,
        p_document_path: documentPath,
        p_note: input.note?.trim() || null,
        p_disputed_place_id: input.disputedPlaceId ?? null,
      })
      if (error) throw error
      return data as unknown as ClaimStart
    },
    onSuccess: () => {
      qc.invalidateQueries({queryKey: keys.claims(orgId)})
      qc.invalidateQueries({queryKey: keys.mine(userId)})
    },
  })
}

export function useVerifyCodeMutation(orgId: string, userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {claimId: string; code: string}) => {
      const {data, error} = await supabase.rpc('verify_claim_code', {claim: input.claimId, code: input.code})
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({queryKey: keys.claims(orgId)})
      qc.invalidateQueries({queryKey: keys.mine(userId)})
    },
  })
}

export function useCancelClaimMutation(orgId: string, userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (claimId: string) => {
      const {error} = await supabase.rpc('cancel_shop_claim', {claim: claimId})
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({queryKey: keys.claims(orgId)})
      qc.invalidateQueries({queryKey: keys.mine(userId)})
    },
  })
}

// ---------- Kumpooni staff ----------

export type QueuedClaim = ShopClaimRow & {org: Pick<ShopOrgRow, 'id' | 'name' | 'city' | 'categories' | 'place_id'> | null}

export function useClaimQueueQuery(enabled: boolean) {
  return useQuery({
    queryKey: keys.queue,
    enabled,
    queryFn: async (): Promise<QueuedClaim[]> => {
      const {data, error} = await supabase
        .from('shop_claims')
        .select(CLAIM_COLUMNS)
        .eq('status', 'pending')
        .in('method', ['dti_bn', 'manual'])
        .order('created_at')
      if (error) throw error
      const claims = data as unknown as ShopClaimRow[]
      if (!claims.length) return []
      const {data: orgs, error: orgError} = await supabase
        .from('shop_orgs')
        .select('id, name, city, categories, place_id')
        .in(
          'id',
          claims.map(c => c.org_id),
        )
      if (orgError) throw orgError
      return claims.map(c => ({...c, org: orgs.find(o => o.id === c.org_id) ?? null}))
    },
  })
}

export function useReviewClaimMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {claimId: string; approve: boolean; note: string}) => {
      const {error} = await supabase.rpc('review_shop_claim', {
        claim: input.claimId,
        approve: input.approve,
        p_note: input.note.trim() || null,
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({queryKey: keys.queue}),
  })
}

/** A short-lived link to a claim document, for staff and the shop's owners and admins. */
export async function claimDocumentUrl(path: string) {
  const {data, error} = await supabase.storage.from(CLAIM_BUCKET).createSignedUrl(path, 300)
  if (error) throw error
  return data.signedUrl
}
