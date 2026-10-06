import dayjs from 'dayjs'
import type {
  AttachmentKind,
  OldParts,
  RepairFileRow,
  VehicleKind,
  VisitResult,
  VisitRow,
} from '@/types/repair-proof'
import {kindGroup, kindLabel} from './kinds'

export type VehicleLike = {
  kind?: VehicleKind | null
  year_model?: string | null
  plate_no?: string | null
  make_text?: string | null
  model_text?: string | null
  brand?: {name: string} | null
  model?: {name: string} | null
}

/** "2019 Toyota Vios", "Samsung Galaxy A55", or a place name like "Kitchen roof". */
export function vehicleName(v: VehicleLike | null | undefined) {
  if (!v) return ''
  const make = v.brand?.name ?? v.make_text
  const model = v.model?.name ?? v.model_text
  return [kindGroup(v.kind) === 'vehicle' ? v.year_model : null, make, model].filter(Boolean).join(' ')
}

/** vehicleName, or the type when nothing was typed yet: "Aircon". For screens, not letters. */
export function itemTitle(v: VehicleLike | null | undefined) {
  return v ? vehicleName(v) || kindLabel(v.kind) : ''
}

export function vehicleKindLabel(kind: VehicleKind | null | undefined) {
  return kindLabel(kind)
}

/**
 * Cars and gadgets sit at the shop. Homes and wiring are worked on where they are.
 * A file with nothing picked yet keeps the shop wording.
 */
export function stayWords(kind: VehicleKind | null | undefined) {
  const onSite = !!kind && kindGroup(kind) === 'place'
  return onSite
    ? {at: 'of work', still: 'Work not finished', stillShort: 'not finished'}
    : {at: 'at the shop', still: 'Still at the shop', stillShort: 'still at the shop'}
}

export const RESULT_LABEL: Record<VisitResult, string> = {
  fixed: 'Fixed',
  not_fixed: 'Not fixed',
  worse: 'Worse',
  waiting_parts: 'Waiting for parts',
}

export const ATTACHMENT_LABEL: Record<AttachmentKind, string> = {
  estimate: 'Quote or estimate',
  receipt: 'Receipt',
  before_photo: 'Before photo',
  old_part: 'Old part',
  chat: 'Chat or message',
  job_order: 'Job order',
  other: 'Other',
}

export const OLD_PARTS_LABEL: Record<OldParts, string> = {
  no: 'Not asked',
  yes: 'Asked',
  refused: 'They refused',
}

/** Things dealers say when they stall. Saved by id on each visit. */
export const DEALER_PHRASES = [
  {id: 'warranty_lang', label: '“Service warranty lang”'},
  {id: 'no_return', label: '“No return, no exchange”'},
  {id: 'come_back', label: '“Come back next week” (no real diagnosis)'},
  {id: 'sold_as_new', label: 'Sold as brand-new but looked used or repaired'},
  {id: 'parts_no_date', label: 'Waiting for parts, no date given'},
] as const

export function phraseLabel(id: string) {
  return DEALER_PHRASES.find(p => p.id === id)?.label ?? id
}

export function sortVisits<T extends Pick<VisitRow, 'date_in' | 'created_at'>>(visits: T[]) {
  return [...visits].sort((a, b) => a.date_in.localeCompare(b.date_in) || a.created_at.localeCompare(b.created_at))
}

export type FileClocks = {
  attempts: number
  daysInShop: number
  daysSinceFirst: number
  stillInside: boolean
  amountPaid: number
}

/** Attempt count, days at the shop (still-inside visits run to today), and days since the first report. */
export function fileClocks(
  file: Pick<RepairFileRow, 'started_at'>,
  visits: Pick<VisitRow, 'date_in' | 'date_out' | 'amount_paid'>[],
  today = dayjs(),
): FileClocks {
  const end = today.startOf('day')
  let daysInShop = 0
  let stillInside = false
  let amountPaid = 0
  for (const v of visits) {
    const out = v.date_out ? dayjs(v.date_out) : end
    if (!v.date_out) stillInside = true
    daysInShop += Math.max(0, out.diff(dayjs(v.date_in), 'day'))
    amountPaid += Number(v.amount_paid ?? 0)
  }
  return {
    attempts: visits.length,
    daysInShop,
    daysSinceFirst: Math.max(0, end.diff(dayjs(file.started_at), 'day')),
    stillInside,
    amountPaid,
  }
}

export type Hint = {id: 'lemon' | 'long_stay' | 'motorcycle' | 'consumer_act' | 'contractor'; title: string; body: string}

export const HINT_FOOTER = 'This may help a complaint. It is not a legal finding.'

export function fileHints(kind: VehicleKind | null | undefined, clocks: FileClocks): Hint[] {
  const hints: Hint[] = []
  const group = kindGroup(kind)
  if (kind === 'car' && clocks.attempts >= 4) {
    hints.push({
      id: 'lemon',
      title: 'This may fit the Lemon Law',
      body: `You've taken your car in ${clocks.attempts} times for the same problem. The Lemon Law (RA 10642) covers brand-new cars that still have the same defect after 4 repair attempts, within 12 months or 20,000 km of delivery, whichever comes first.`,
    })
  }
  if (clocks.daysInShop >= 30) {
    hints.push({
      id: 'long_stay',
      title: group === 'place' ? `${clocks.daysInShop} days of work` : `${clocks.daysInShop} days at the shop`,
      body: 'Long repair delays can be grounds for a complaint. In one DTI case, a dealer was held liable when repairs ran past 30 days. Keep every date in this file.',
    })
  }
  if (kind === 'motorcycle') {
    hints.push({
      id: 'motorcycle',
      title: 'Motorcycles and the Lemon Law',
      body: 'The Lemon Law usually covers cars, not motorcycles. You can still complain to DTI under the Consumer Act (RA 7394). Keep your warranty booklet and every job order.',
    })
  }
  if (group === 'device' && clocks.attempts >= 2) {
    hints.push({
      id: 'consumer_act',
      title: 'Repairs that do not hold',
      body: 'Repair shops and service centers are covered by the Consumer Act (RA 7394), and DTI takes these complaints. Keep the warranty card, the service report, and any replaced parts.',
    })
  }
  if (kind === 'construction' || kind === 'electrical' || kind === 'home') {
    hints.push({
      id: 'contractor',
      title: 'Check who did the work',
      body: 'DTI takes complaints about services, but a big contractor dispute may go to PCAB (the contractor license board) or small claims court instead. Keep the contract, the receipts, and dated photos of the work.',
    })
  }
  return hints
}

/** "639171234567" -> "+63 917 123 4567" */
export function formatMobile(phone: string | null | undefined) {
  if (!phone) return null
  const d = phone.replace(/\D/g, '')
  if (/^63\d{10}$/.test(d)) return `+63 ${d.slice(2, 5)} ${d.slice(5, 8)} ${d.slice(8)}`
  return phone
}

/** Name and mobile from the signed-in account, for slips and letters. */
export function ownerOf(user: {phone?: string; user_metadata?: Record<string, unknown>} | null | undefined) {
  const meta = user?.user_metadata ?? {}
  const name = [meta.first_name, meta.last_name].filter(v => typeof v === 'string' && v.trim()).join(' ')
  return {name, mobile: formatMobile(user?.phone)}
}

/** Days as words for the clocks: "1 day", "12 days". */
export function days(n: number) {
  return `${n} ${n === 1 ? 'day' : 'days'}`
}
