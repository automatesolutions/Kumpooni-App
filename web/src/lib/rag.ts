import {ATTACHMENT_LABEL, DEALER_PHRASES, RESULT_LABEL, fileClocks, vehicleKindLabel, vehicleName, type VehicleLike} from './repair'
import {formatDate, formatPrice} from './format'
import type {AttachmentRow, JobSlipRow, RepairFileRow, SlipExtra, VisitRow} from '@/types/repair-proof'

export type RepairPack = RepairFileRow & {
  vehicle: VehicleLike | null
  visits: VisitRow[]
  attachments: AttachmentRow[]
  job_slip: JobSlipRow | null
}

export type RagChunk = {
  id: string
  fileId: string
  title: string
  text: string
  href: string
}

const STOP = new Set([
  'a',
  'an',
  'the',
  'and',
  'or',
  'to',
  'of',
  'in',
  'on',
  'for',
  'is',
  'it',
  'my',
  'i',
  'was',
  'at',
  'this',
  'that',
  'with',
  'from',
  'what',
  'when',
  'how',
  'did',
  'does',
  'do',
])

function tokens(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1 && !STOP.has(w))
}

function phrase(id: string) {
  return DEALER_PHRASES.find(p => p.id === id)?.label ?? id
}

/** Turns saved files, visits, slips, and document notes into searchable chunks. */
export function buildCorpus(files: RepairPack[]): RagChunk[] {
  const chunks: RagChunk[] = []
  for (const file of files) {
    const href = `/files/${file.id}`
    const vehicle = vehicleName(file.vehicle)
    const clocks = fileClocks(file, file.visits)
    chunks.push({
      id: `${file.id}-file`,
      fileId: file.id,
      title: file.problem,
      href,
      text: [
        `Repair file: ${file.problem}.`,
        `Shop: ${file.shop_name}${file.shop_city ? `, ${file.shop_city}` : ''}.`,
        vehicle ? `${vehicleKindLabel(file.vehicle?.kind)}: ${vehicle}${file.vehicle?.plate_no ? `, plate ${file.vehicle.plate_no}` : ''}.` : '',
        `Started ${formatDate(file.started_at)}. Status: ${file.status}.`,
        file.peso_cap != null ? `Price limit ${formatPrice(file.peso_cap)}.` : '',
        `${clocks.attempts} visits. ${clocks.daysInShop} days at the shop. Paid ${formatPrice(clocks.amountPaid)}.`,
      ]
        .filter(Boolean)
        .join(' '),
    })
    for (const visit of file.visits) {
      chunks.push({
        id: visit.id,
        fileId: file.id,
        title: `Visit at ${file.shop_name}`,
        href,
        text: [
          `Visit for ${file.problem} at ${file.shop_name}.`,
          `Dropped off ${formatDate(visit.date_in)}.`,
          visit.date_out ? `Got it back ${formatDate(visit.date_out)}.` : 'Still at the shop.',
          visit.result ? `Result: ${RESULT_LABEL[visit.result]}.` : '',
          visit.amount_paid != null ? `Paid ${formatPrice(visit.amount_paid)}.` : '',
          visit.story ? `You said: ${visit.story}` : '',
          visit.shop_said ? `Shop said: ${visit.shop_said}` : '',
          visit.phrases?.length ? `Dealer phrases: ${visit.phrases.map(phrase).join('; ')}.` : '',
        ]
          .filter(Boolean)
          .join(' '),
      })
    }
    for (const doc of file.attachments) {
      const name = doc.storage_path.split('/').pop() ?? 'file'
      chunks.push({
        id: doc.id,
        fileId: file.id,
        title: ATTACHMENT_LABEL[doc.kind],
        href,
        text: [
          `Saved document: ${ATTACHMENT_LABEL[doc.kind]} (${name}) on the file "${file.problem}".`,
          doc.caption ? `Note on the document: ${doc.caption}` : 'No note on this document yet.',
          doc.taken_at ? `Dated ${formatDate(doc.taken_at)}.` : '',
        ]
          .filter(Boolean)
          .join(' '),
      })
    }
    const slip = file.job_slip
    if (slip) {
      const extras = (slip.extras ?? []) as SlipExtra[]
      chunks.push({
        id: slip.id,
        fileId: file.id,
        title: 'Job slip',
        href: `/files/${file.id}/slip`,
        text: [
          `Job slip for ${file.problem} at ${file.shop_name}.`,
          slip.job_text,
          slip.peso_cap != null ? `Slip price limit ${formatPrice(slip.peso_cap)}.` : '',
          extras
            .map(e => `${e.text}${e.answer ? `: ${e.answer}` : ''}`)
            .filter(Boolean)
            .join('. '),
        ]
          .filter(Boolean)
          .join(' '),
      })
    }
  }
  return chunks
}

/** Plain-English and Taglish words people ask with, mapped to the words saved in files. */
const ALIASES: Record<string, string[]> = {
  say: ['said'],
  says: ['said'],
  told: ['said'],
  they: ['shop'],
  sinabi: ['said'],
  pay: ['paid'],
  magkano: ['paid'],
  nabayaran: ['paid'],
  bayad: ['paid'],
  ilan: ['visits'],
  trips: ['visits'],
  trip: ['visit'],
  balik: ['visit'],
  photo: ['document'],
  photos: ['document'],
  litrato: ['document'],
}

export function retrieveChunks(chunks: RagChunk[], question: string, limit = 6) {
  const q = [...new Set(tokens(question).flatMap(w => [w, ...(ALIASES[w] ?? [])]))]
  if (!q.length) return chunks.slice(0, limit)
  return chunks
    .map(chunk => {
      const bag = tokens(chunk.text)
      const score = q.reduce((n, w) => n + (bag.includes(w) ? 1 : 0), 0)
      return {chunk, score}
    })
    .filter(row => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(row => row.chunk)
}

/** Answers only from retrieved chunks. No invented pesos, dates, or laws. */
export function answerFromChunks(question: string, hits: RagChunk[]) {
  if (!hits.length) {
    return {
      text: 'That is not in your saved files or document notes yet. Add the visit or write a note on the photo, then ask again.',
      sources: [] as RagChunk[],
    }
  }
  const lines = hits.map(h => h.text)
  const text = [
    `From what you saved about "${question.trim()}":`,
    ...lines.map(line => `• ${line}`),
    'I only use your files and the notes on your documents. I do not read the pixels in photos unless you wrote a note.',
  ].join('\n')
  return {text, sources: hits}
}
