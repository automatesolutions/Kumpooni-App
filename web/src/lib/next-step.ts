import type {RepairFileRow, VisitRow} from '@/types/repair-proof'

/** Stand-ins saved when someone starts a file with only a photo or one sentence. */
export const SHOP_LATER = 'Shop not added yet'
export const PROBLEM_LATER = 'New repair file'

export const shopKnown = (name: string | null | undefined) => !!name?.trim() && name.trim() !== SHOP_LATER
export const problemKnown = (text: string | null | undefined) => !!text?.trim() && text.trim() !== PROBLEM_LATER

export type StepId = 'quote' | 'trip' | 'pickup' | 'close' | 'complaint' | 'another'

export type NextStep = {
  id: StepId
  label: string
  /** The mechanic-friend line under the button. */
  line: string
}

type StepFile = Pick<RepairFileRow, 'status'> & {
  visits: Pick<VisitRow, 'date_in' | 'date_out' | 'result'>[]
  attachments: unknown[]
  letters?: unknown[]
}

export const NO_FILE_STEP: NextStep = {
  id: 'quote',
  label: 'Save the quote',
  line: 'Do this before you leave the shop.',
}

/** Visits marked "Not fixed" or "Worse". */
export function failedVisits(visits: Pick<VisitRow, 'result'>[]) {
  return visits.filter(v => v.result === 'not_fixed' || v.result === 'worse').length
}

/** The one thing to do next for a file. Null when the file is closed. */
export function nextStep(file: StepFile | null | undefined): NextStep | null {
  if (!file) return NO_FILE_STEP
  if (file.status === 'closed') return null
  const visits = [...file.visits].sort((a, b) => a.date_in.localeCompare(b.date_in))
  const last = visits[visits.length - 1]

  if (!last && file.attachments.length === 0) return NO_FILE_STEP
  if (!last) {
    return {id: 'trip', label: 'Log this trip', line: "Write it down today, while you still remember what they said."}
  }
  if (!last.date_out) {
    return {id: 'pickup', label: 'Log the pickup', line: 'When you get it back, add the date and what they did.'}
  }
  if (last.result === 'fixed') {
    return {id: 'close', label: 'Close the file', line: 'Fixed? Close it, and keep the receipts anyway.'}
  }
  if (failedVisits(visits) >= 2) {
    return {
      id: 'complaint',
      label: file.letters?.length ? 'Open your letter' : 'Write the complaint',
      line: 'Two trips and still not fixed. Time to put it in writing.',
    }
  }
  return {id: 'another', label: 'Add another visit', line: 'Back for the same problem? Log every trip. They add up.'}
}
