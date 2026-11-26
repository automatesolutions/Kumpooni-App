// The shop CRM: what a consumer can share, consent wording, stages, and follow-up dates.
// 8-business-crm.sql enforces the rules. These copies decide what the screens show.
import dayjs from 'dayjs'

/** What a consumer can share with a shop. problem is always on: it's what a quote needs. */
export const SHARE_FIELDS = ['problem', 'item', 'plate', 'slip', 'photos', 'estimates', 'visits', 'contact'] as const
export type ShareField = (typeof SHARE_FIELDS)[number]

export const SHARE_FIELD_INFO: Record<ShareField, {label: string; hint: string; default: boolean; locked?: boolean}> = {
  problem: {label: "What's wrong", hint: 'The problem and when it started', default: true, locked: true},
  item: {label: 'Item details', hint: 'Brand, model, and year', default: true},
  plate: {label: 'Plate or serial number', hint: 'Only if the shop needs it to find your records', default: false},
  slip: {label: 'Job slip', hint: 'The work you asked for and your price limit', default: true},
  photos: {label: 'Before photos', hint: 'Photos you took before the repair', default: true},
  estimates: {label: 'Estimates and job orders', hint: 'Quotes and job orders you saved', default: false},
  visits: {label: 'Visit history', hint: 'Every trip to the shop, with what you paid and your notes', default: false},
  contact: {label: 'Your name and mobile', hint: 'So the shop can call or text you', default: false},
}

export function defaultShareFields(): ShareField[] {
  return SHARE_FIELDS.filter(f => SHARE_FIELD_INFO[f].default)
}

/** Keeps problem in, drops anything unknown, and keeps the list order. */
export function normalizeShareFields(picked: readonly string[]): ShareField[] {
  return SHARE_FIELDS.filter(f => f === 'problem' || picked.includes(f))
}

/**
 * Consent wording, stored by version on each share and customer.
 * Draft for the Data Privacy Act of 2012 (Republic Act No. 10173). Have a lawyer check it before launch.
 */
export const CONSENT_VERSION = '2026-11-dpa-1'

export const shareConsentText = (shop: string) =>
  `I agree to share these details with ${shop} so they can quote and do this repair. We process your data under the Data Privacy Act of 2012 (Republic Act No. 10173).`

export const shareIntroText = (shop: string) =>
  `${shop} sees only what you tick. You can stop sharing from this repair file at any time, and they lose access right away. We keep a record of what you shared and when.`

export const MANUAL_CONSENT_TEXT = 'This customer agreed that we can keep their name and contact details to follow up on this job.'

/** Today in the Philippines, as YYYY-MM-DD. Follow-ups are due by Manila date. */
export function todayManila(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit'}).format(now)
}

/** The day after a warranty of `days` days, counted from the job date. */
export function warrantyFollowUpDate(jobDate: string, days: number) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(jobDate) || !Number.isInteger(days) || days < 1) return null
  return dayjs(jobDate).add(days + 1, 'day').format('YYYY-MM-DD')
}

/** Overdue, due today, or later, against Manila's date. */
export function dueState(dueOn: string, today = todayManila()): 'overdue' | 'today' | 'later' {
  return dueOn < today ? 'overdue' : dueOn === today ? 'today' : 'later'
}

export type StageLike = {id: string; name: string; position: number; kind: 'open' | 'won' | 'lost'}

export function sortStages<T extends StageLike>(stages: readonly T[]) {
  return [...stages].sort((a, b) => a.position - b.position)
}

/** Stages for the "Move to" menu: every stage except the one the lead is on. */
export function moveTargets<T extends StageLike>(stages: readonly T[], currentId: string) {
  return sortStages(stages).filter(s => s.id !== currentId)
}

/** Default stage names, in order, as seeded by 8-business-crm.sql. */
export const DEFAULT_STAGES = ['New', 'Quoted', 'Scheduled', 'In the shop', 'Ready for pickup', 'Done', 'Lost'] as const

export type ActivityLike = {
  type: 'created' | 'stage' | 'note' | 'quote' | 'assign' | 'follow_up' | 'share_revoked'
  body: string | null
  from_stage: string | null
  to_stage: string | null
}

/** One line for the timeline. Names come from the lookups, so nothing is stored twice. */
export function activityText(
  a: ActivityLike,
  stageName: (id: string | null) => string,
  personName: (id: string | null) => string,
  peso: (n: number) => string,
) {
  switch (a.type) {
    case 'created':
      return a.body ?? 'Lead added.'
    case 'stage':
      return `Moved from ${stageName(a.from_stage)} to ${stageName(a.to_stage)}.`
    case 'quote':
      return a.body ? `Quote set to ${peso(Number(a.body))}.` : 'Quote removed.'
    case 'assign':
      return a.body ? `Given to ${personName(a.body)}.` : 'No one is on this job now.'
    case 'follow_up': {
      const [date, ...rest] = (a.body ?? '').split(' ')
      return `Follow-up set for ${dayjs(date).format('D MMM YYYY')}${rest.length ? ', after the warranty' : ''}.`
    }
    case 'share_revoked':
      return a.body ?? 'The customer stopped sharing their repair file.'
    case 'note':
      return a.body ?? ''
  }
}
