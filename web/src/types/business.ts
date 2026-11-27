// Rows from supabase/7-business.sql.
import type {ClaimMethod, ShopRole, VerificationStatus, AssignableRole} from '@/lib/business'
import type {ItemKind} from '@/lib/kinds'

export type ShopOrgRow = {
  id: string
  created_at: string
  updated_at: string
  created_by: string | null
  name: string
  /** Google place id. The only Places value stored. */
  place_id: string | null
  city: string | null
  categories: ItemKind[]
  verification_status: VerificationStatus
  verified_at: string | null
  verified_method: ClaimMethod | 'sample_code' | null
}

export type ShopMemberRow = {
  org_id: string
  user_id: string
  role: ShopRole
  created_at: string
  invited_by: string | null
}

export type ShopInviteRow = {
  id: string
  created_at: string
  org_id: string
  email: string
  role: AssignableRole
  invited_by: string | null
  expires_at: string
  accepted_at: string | null
  accepted_by: string | null
}

export type ClaimStatus = 'pending' | 'approved' | 'rejected' | 'canceled'

/** Every column the browser may read. code_hash stays server side. */
export type ShopClaimRow = {
  id: string
  created_at: string
  org_id: string
  place_id: string | null
  disputed_place_id: string | null
  method: ClaimMethod
  status: ClaimStatus
  dti_bn_number: string | null
  document_path: string | null
  note: string | null
  code_expires_at: string | null
  attempts: number
  is_sample: boolean
  created_by: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  review_note: string | null
}

export const CLAIM_COLUMNS =
  'id, created_at, org_id, place_id, disputed_place_id, method, status, dti_bn_number, document_path, note, code_expires_at, attempts, is_sample, created_by, reviewed_by, reviewed_at, review_note'

export type ShopMemberListItem = {
  user_id: string
  role: ShopRole
  email: string
  name: string | null
  joined_at: string
}

export type InvitePreview = {
  org_name: string
  role: AssignableRole
  email: string
  expired: boolean
  accepted: boolean
}

export type ClaimStart = {claim_id: string; sample_code: string | null}

// ---------- CRM rows from supabase/8-business-crm.sql ----------

export type StageKind = 'open' | 'won' | 'lost'
export type LeadSource = 'share' | 'shop_page' | 'manual'

export type PipelineStageRow = {
  id: string
  created_at: string
  org_id: string
  name: string
  position: number
  kind: StageKind
}

export type CustomerRow = {
  id: string
  created_at: string
  updated_at: string
  org_id: string
  user_id: string | null
  name: string
  mobile: string | null
  email: string | null
  notes: string | null
  source: LeadSource
  consent_at: string
  consent_version: string
  created_by: string | null
}

export type FileShareRow = {
  id: string
  created_at: string
  file_id: string
  user_id: string
  org_id: string
  fields: string[]
  consent_version: string
  consented_at: string
  revoked_at: string | null
}

export type LeadRow = {
  id: string
  created_at: string
  updated_at: string
  org_id: string
  customer_id: string
  stage_id: string
  source: LeadSource
  kind: ItemKind | null
  title: string
  quote_amount: number | null
  assignee_id: string | null
  share_id: string | null
  created_by: string | null
  closed_at: string | null
}

export type LeadActivityRow = {
  id: string
  created_at: string
  org_id: string
  lead_id: string
  actor_id: string | null
  type: 'created' | 'stage' | 'note' | 'quote' | 'assign' | 'follow_up' | 'share_revoked'
  body: string | null
  from_stage: string | null
  to_stage: string | null
}

export type FollowUpRow = {
  id: string
  created_at: string
  org_id: string
  lead_id: string
  due_on: string
  reason: 'manual' | 'warranty_end'
  note: string | null
  assignee_id: string | null
  done_at: string | null
  created_by: string | null
}

/** What shared_file() returns: only the fields the consumer ticked are present. */
export type SharedFile = {
  share_id: string
  fields: string[]
  shared_at: string
  problem: string
  started_at: string
  status: 'open' | 'closed'
  kind: ItemKind | null
  item?: {make: string | null; model: string | null; year: string | null}
  plate?: {plate_no: string | null; vin_last6: string | null}
  slip?: {job_text: string; peso_cap: number | null; dropoff_at: string | null; extras: unknown}
  photos?: {path: string; caption: string | null}[]
  estimates?: {path: string; kind: string; caption: string | null}[]
  visits?: {
    date_in: string
    date_out: string | null
    result: string | null
    amount_paid: number | null
    shop_said: string | null
    story: string | null
  }[]
  contact?: {name: string | null; mobile: string | null}
}

export type MyFileShare = {
  id: string
  org_id: string
  org_name: string
  fields: string[]
  consented_at: string
  revoked_at: string | null
}

// ---------- Team chat (supabase/9-business-chat.sql) ----------

export type ChatKind = 'channel' | 'dm' | 'lead'

export type ChatChannelRow = {
  id: string
  created_at: string
  org_id: string
  kind: ChatKind
  name: string | null
  topic: string | null
  is_private: boolean
  lead_id: string | null
  dm_key: string | null
  created_by: string | null
  archived_at: string | null
  last_message_at: string | null
}

export type ChatMemberRow = {
  channel_id: string
  user_id: string
  org_id: string
  added_at: string
  added_by: string | null
}

export type ChatMessageRow = {
  id: string
  created_at: string
  channel_id: string
  org_id: string
  author_id: string | null
  body: string | null
  attachment_path: string | null
  edited_at: string | null
  deleted_at: string | null
}

export type ChatReadRow = {channel_id: string; user_id: string; last_read_at: string}

/** One row of my_chat_channels(). */
export type MyChatChannel = {
  id: string
  kind: ChatKind
  name: string | null
  topic: string | null
  is_private: boolean
  lead_id: string | null
  lead_title: string | null
  other_user_id: string | null
  archived_at: string | null
  last_message_at: string | null
  unread: number
}

/** One row of chat_people(). */
export type ChatPerson = {user_id: string; role: ShopRole; name: string; avatar_url: string | null}
