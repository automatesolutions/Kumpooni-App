import type {Database, Json} from './supabase'
import type {ItemKind} from '@/lib/kinds'
import type {
  CustomerRow,
  FileShareRow,
  FollowUpRow,
  LeadActivityRow,
  LeadRow,
  MyFileShare,
  PipelineStageRow,
  ShopClaimRow,
  ShopInviteRow,
  ShopMemberListItem,
  ShopMemberRow,
  ShopOrgRow,
} from './business'

/** What the repair is for. See src/lib/kinds.ts. */
export type VehicleKind = ItemKind
export type FileStatus = 'open' | 'closed'
export type OldParts = 'no' | 'yes' | 'refused'
export type VisitResult = 'fixed' | 'not_fixed' | 'worse' | 'waiting_parts'
export type AttachmentKind = 'estimate' | 'receipt' | 'before_photo' | 'old_part' | 'chat' | 'job_order' | 'other'
export type LetterType = 'dti' | 'shop' | 'records'
export type Remedy = 'repair' | 'replace' | 'refund' | 'decide'
export type LetterLanguage = 'en' | 'fil'
export type PinAccuracy = 'building' | 'street' | 'area'

export type RepairFileRow = {
  id: string
  created_at: string
  updated_at: string
  user_id: string
  vehicle_id: string | null
  shop_name: string
  shop_city: string | null
  /** Google place id, set when the file was started from /nearby (6-top-shops.sql). */
  shop_place_id?: string | null
  problem: string
  started_at: string
  status: FileStatus
  old_parts: OldParts
  peso_cap: number | null
  show_dealer_phrases: boolean
  lemon_hints_seen: boolean
}

export type VisitRow = {
  id: string
  created_at: string
  file_id: string
  user_id: string
  date_in: string
  date_out: string | null
  story: string | null
  shop_said: string | null
  result: VisitResult | null
  amount_paid: number | null
  phrases: string[]
}

export type AttachmentRow = {
  id: string
  created_at: string
  file_id: string
  user_id: string
  kind: AttachmentKind
  storage_path: string
  mime_type: string | null
  caption: string | null
  taken_at: string | null
}

export type SlipExtra = {
  id: string
  text: string
  cap: number | null
  answer: 'yes' | 'no' | null
  answered_at: string | null
  added_at: string
}

export type JobSlipRow = {
  id: string
  created_at: string
  updated_at: string
  file_id: string
  user_id: string
  public_code: string
  job_text: string
  peso_cap: number | null
  dropoff_at: string | null
  owner_name: string | null
  owner_mobile: string | null
  extras: SlipExtra[]
}

export type OfficeRow = {
  id: number
  slug: string
  name: string
  kind: 'dti_regional' | 'dti_provincial' | 'other'
  region: string | null
  address: string
  city: string | null
  province: string | null
  lat: number
  lng: number
  pin_accuracy: PinAccuracy
  phone: string | null
  email: string | null
  hours: string | null
  handles: string[]
  source_url: string
  checked_on: string
  verified: boolean
}

export type LetterRow = {
  id: string
  created_at: string
  updated_at: string
  file_id: string
  user_id: string
  office_id: number | null
  letter_type: LetterType
  remedy: Remedy
  language: LetterLanguage
  owner_lat: number | null
  owner_lng: number | null
  draft_text: string
  edited_text: string | null
  model: string
}

/** Insert: everything optional except the listed columns. */
type Table<Row, Required extends keyof Row> = {
  Row: Row
  Insert: Partial<Row> & Pick<Row, Required>
  Update: Partial<Row>
  Relationships: []
}

type JsonCompatible<T> = {[K in keyof T]: T[K] extends SlipExtra[] ? Json : T[K]}

type Base = Database['public']
type VehicleTable = Base['Tables']['vehicle']
type UsersTable = Base['Tables']['users']
type VehicleExtra = {kind: VehicleKind; make_text: string | null; model_text: string | null; vin_last6: string | null}
type UserExtra = {last_lat: number | null; last_lng: number | null; last_located_at: string | null}

/** The generated schema plus the Repair Proof tables from supabase/3-repair-proof.sql. */
export type AppDatabase = {
  public: Omit<Base, 'Tables' | 'Functions'> & {
    Tables: Omit<Base['Tables'], 'vehicle' | 'users'> & {
      vehicle: {
        Row: VehicleTable['Row'] & VehicleExtra
        Insert: VehicleTable['Insert'] & Partial<VehicleExtra>
        Update: VehicleTable['Update'] & Partial<VehicleExtra>
        Relationships: VehicleTable['Relationships']
      }
      users: {
        Row: UsersTable['Row'] & UserExtra
        Insert: UsersTable['Insert'] & Partial<UserExtra>
        Update: UsersTable['Update'] & Partial<UserExtra>
        Relationships: UsersTable['Relationships']
      }
      repair_files: Table<RepairFileRow, 'shop_name' | 'problem'>
      visits: Table<VisitRow, 'file_id' | 'date_in'>
      attachments: Table<AttachmentRow, 'file_id' | 'kind' | 'storage_path'>
      job_slips: Table<JsonCompatible<JobSlipRow>, 'file_id' | 'job_text'>
      offices: Table<OfficeRow, 'slug' | 'name' | 'address' | 'lat' | 'lng' | 'source_url' | 'checked_on'>
      letters: Table<LetterRow, 'file_id' | 'draft_text' | 'model'>
      shop_orgs: Table<ShopOrgRow, 'name' | 'categories'>
      shop_members: Table<ShopMemberRow, 'org_id' | 'user_id' | 'role'>
      shop_invites: Table<ShopInviteRow, 'org_id' | 'email' | 'role'>
      shop_claims: Table<ShopClaimRow, 'org_id' | 'method'>
      pipeline_stages: Table<PipelineStageRow, 'org_id' | 'name' | 'position'>
      customers: Table<CustomerRow, 'org_id' | 'name' | 'consent_version'>
      file_shares: Table<FileShareRow, 'file_id' | 'org_id' | 'fields' | 'consent_version'>
      leads: Table<LeadRow, 'org_id' | 'customer_id' | 'stage_id' | 'title'>
      lead_activities: Table<LeadActivityRow, 'lead_id' | 'type'>
      follow_ups: Table<FollowUpRow, 'lead_id' | 'due_on'>
    }
    Functions: Base['Functions'] & {
      get_job_slip: {Args: {code: string}; Returns: Json}
      create_shop: {Args: {p_name: string; p_city: string | null; p_categories: string[]; p_place_id?: string | null}; Returns: string}
      shop_member_list: {Args: {org: string}; Returns: ShopMemberListItem[]}
      create_shop_invite: {Args: {org: string; p_email: string; p_role: string}; Returns: string}
      shop_invite_preview: {Args: {token: string}; Returns: Json}
      accept_shop_invite: {Args: {token: string}; Returns: string}
      request_shop_claim: {
        Args: {
          org: string
          p_method: string
          p_bn?: string | null
          p_document_path?: string | null
          p_note?: string | null
          p_disputed_place_id?: string | null
        }
        Returns: Json
      }
      verify_claim_code: {Args: {claim: string; code: string}; Returns: string}
      review_shop_claim: {Args: {claim: string; approve: boolean; p_note?: string | null}; Returns: undefined}
      cancel_shop_claim: {Args: {claim: string}; Returns: undefined}
      shop_place_taken: {Args: {p_place_id: string}; Returns: boolean}
      shared_file: {Args: {p_share: string}; Returns: Json}
      verified_shop_for_place: {Args: {p_place_id: string}; Returns: {id: string; name: string; city: string | null}[]}
      my_file_shares: {Args: {p_file: string}; Returns: MyFileShare[]}
    }
  }
}
