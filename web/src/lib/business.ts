// Business accounts for shops: roles, claim methods, and the error codes from 7-business.sql.
// The database enforces every rule here. These copies decide what the screens show.
import {ITEM_KINDS, kindLabel, type ItemKind} from './kinds'

export const SHOP_ROLES = ['owner', 'admin', 'member', 'guest'] as const
export type ShopRole = (typeof SHOP_ROLES)[number]

/** Roles an owner or admin can give on the team page. Ownership isn't given there. */
export const ASSIGNABLE_ROLES = ['admin', 'member', 'guest'] as const satisfies readonly ShopRole[]
export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number]

export const ROLE_INFO: Record<ShopRole, {label: string; hint: string}> = {
  owner: {label: 'Owner', hint: 'Everything, including deleting the shop'},
  admin: {label: 'Admin', hint: 'Manages the team, the shop details, and claims'},
  member: {label: 'Member', hint: 'Works on customers and jobs'},
  guest: {label: 'Guest', hint: 'Sees only the jobs given to them'},
}

const RANK: Record<ShopRole, number> = {owner: 4, admin: 3, member: 2, guest: 1}

export function isShopRole(value: unknown): value is ShopRole {
  return typeof value === 'string' && (SHOP_ROLES as readonly string[]).includes(value)
}

/** Same rule as public.shop_can() in SQL. */
export function roleAtLeast(role: ShopRole | null | undefined, min: ShopRole) {
  return role != null && RANK[role] >= RANK[min]
}

export function canManageTeam(role: ShopRole | null | undefined) {
  return roleAtLeast(role, 'admin')
}

/**
 * What the signed-in person (me) can do to one member, matching shop_members_guard().
 * Owners can't be changed or removed by others. Anyone can leave, except the last owner.
 */
export function memberActions(
  me: {userId: string; role: ShopRole},
  member: {userId: string; role: ShopRole},
  ownerCount: number,
) {
  const self = me.userId === member.userId
  const manager = canManageTeam(me.role)
  const isOwner = member.role === 'owner'
  return {
    changeRole: manager && !isOwner,
    remove: !self && manager && !isOwner,
    leave: self && (!isOwner || ownerCount > 1),
  }
}

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected'

export const VERIFICATION_LABEL: Record<VerificationStatus, string> = {
  unverified: 'Not verified yet',
  pending: 'Claim in review',
  verified: 'Verified',
  rejected: 'Claim not approved',
}

export type ClaimMethod = 'phone_code' | 'email_code' | 'dti_bn' | 'manual'

export const CLAIM_METHODS: Record<ClaimMethod, {label: string; hint: string; needsPlace: boolean}> = {
  phone_code: {
    label: 'Code to the shop phone',
    hint: 'We send a code to the phone number Google lists for your shop.',
    needsPlace: true,
  },
  email_code: {
    label: 'Code to the shop email',
    hint: 'We send a code to the email Google lists for your shop.',
    needsPlace: true,
  },
  dti_bn: {
    label: 'DTI business name number',
    hint: 'Enter the number on your DTI certificate and add a photo of it. A person on our team checks it.',
    needsPlace: false,
  },
  manual: {
    label: 'Ask for a review',
    hint: 'Tell us how we can confirm the shop is yours. A person on our team checks it.',
    needsPlace: false,
  },
}

/** A DTI business name number, as 7-business.sql accepts it. */
export function isDtiBnNumber(value: string) {
  return /^[0-9]{5,12}$/.test(value.trim())
}

/** Kinds a shop can list. Same list as repair files. */
export const SHOP_CATEGORIES: readonly ItemKind[] = ITEM_KINDS
export const categoryLabel = kindLabel

/** Sample shops on /nearby have made-up ids and can't be claimed. */
export function isClaimablePlaceId(placeId: string | null | undefined): placeId is string {
  return !!placeId && !placeId.startsWith('sample-') && placeId.length >= 10 && placeId.length <= 300
}

export function inviteUrl(token: string, origin = window.location.origin) {
  return `${origin}/business/invite/${token}`
}

/** Plain words for the error codes raised in 7-business.sql. Unknown errors keep their message. */
const ERRORS: Record<string, string> = {
  not_allowed: "You don't have permission to do that in this shop.",
  not_signed_in: 'Sign in first.',
  place_taken: 'Another account already added this shop. If it’s yours, add it without the map pin and ask for a review.',
  too_many_shops: 'You can add up to 10 shops. Ask us if you need more.',
  verification_locked: 'Only a claim review can change whether a shop is verified.',
  place_locked: 'The map pin can’t change while a claim is open or approved.',
  use_invite: 'People join with an invite link.',
  owner_not_granted: 'Ownership can’t be given from the team page yet.',
  owner_locked: 'An owner’s role can’t be changed or removed by someone else.',
  last_owner: 'A shop needs at least one owner. Make someone else an owner first.',
  bad_role: 'Pick admin, member, or guest.',
  already_member: 'This person is already on the team.',
  invite_not_found: 'This invite link isn’t valid anymore. Ask for a new one.',
  invite_expired: 'This invite link expired. Ask for a new one.',
  invite_wrong_email: 'Sign in with the email the invite was sent to.',
  already_verified: 'This shop is already verified.',
  bad_method: 'Pick a way to prove the shop is yours.',
  bad_document: 'Upload the certificate again.',
  needs_place: 'Codes go to the phone or email Google lists for your shop. Pick your shop on the map first.',
  live_codes_off: 'We don’t send codes yet. Use your DTI number or ask for a review.',
  dispute_needs_review: 'A shop someone else added is checked by a person. Use your DTI number or ask for a review.',
  not_a_code_claim: 'This claim doesn’t use a code.',
  claim_not_open: 'This claim is already closed.',
  not_in_shop: 'That person isn’t on your team. Invite them to the shop first.',
  dm_self: 'Pick someone else to message.',
  bad_name: 'Use 1 to 40 letters, numbers, or dashes for the channel name.',
  name_taken: 'Your shop already has a channel with that name.',
  general_locked: 'Everyone uses #general, so it can’t be renamed or archived.',
  channel_archived: 'This channel is archived, so you can’t send messages here.',
  not_yours: 'You can only edit your own messages.',
  message_deleted: 'This message was deleted.',
  bad_attachment: 'Add the photo again.',
}

export function businessError(error: unknown, fallback = 'Something went wrong. Try again.') {
  const msg = error && typeof error === 'object' && 'message' in error ? String(error.message) : String(error ?? '')
  const code = Object.keys(ERRORS).find(c => new RegExp(`\\b${c}\\b`).test(msg))
  return code ? ERRORS[code] : msg || fallback
}

export type CodeResult = 'approved' | 'wrong_code' | 'expired' | 'too_many'

export const CODE_RESULT: Record<Exclude<CodeResult, 'approved'>, string> = {
  wrong_code: 'That code doesn’t match. Check it and try again.',
  expired: 'This code expired. Start the claim again for a new one.',
  too_many: 'Too many wrong codes. Start the claim again for a new one.',
}
