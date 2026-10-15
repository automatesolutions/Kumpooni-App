// Pooni answers questions about your repairs, and only from what you saved.
// The AI function writes the reply when it is deployed. Without it, the rules
// below build the reply in the browser from the same data.
import {ATTACHMENT_LABEL, RESULT_LABEL, fileClocks, sortVisits, vehicleName} from './repair'
import {formatDate, formatPrice, plural} from './format'
import {buildCorpus, retrieveChunks, type RepairPack} from './rag'
import {supabase} from './supabase'

export type PooniSource = {title: string; href: string}

export type PooniReply = {
  text: string
  sources: PooniSource[]
  /** Questions Pooni offers back, shown as chips. */
  followUps: string[]
  /** True when there is no repair data to answer from. */
  noData?: boolean
}

export const NO_DATA_REPLY: PooniReply = {
  text: "I don't have any repair data yet, so I can't answer that. Add a repair first. Then ask me about it, and I'll answer from what you saved.",
  sources: [],
  followUps: [],
  noData: true,
}

export const STARTERS = ['How much have I paid?', 'How many visits?', 'What did the shop say?', 'What is my latest visit?']

type Intent = 'paid' | 'visits' | 'days' | 'shopSaid' | 'latest' | 'shop' | 'status' | 'docs' | 'limit' | 'list'

// Most specific first. Pooni answers the first topic that matches.
const INTENTS: [Intent, RegExp][] = [
  ['limit', /\b(limit|cap|budget|quote|quoted|estimate)\b/i],
  ['paid', /\b(paid|pay|cost|spent|spend|price|presyo|bayad|binayad|nabayaran|binayaran|magkano|gastos|ginastos)\b/i],
  ['shopSaid', /\b(said|say|says|told|sinabi|sabi|explain\w*|diagnos\w*)\b/i],
  ['latest', /\b(latest|last|recent|newest|huli|huling|pinakabago|kailan)\b/i],
  ['days', /\b(days?|how long|weeks?|araw|katagal|tagal|matagal)\b/i],
  ['docs', /\b(photos?|pictures?|documents?|docs?|receipts?|litrato|resibo|attachments?)\b/i],
  ['status', /\b(status|fixed|done|open|closed|ayos|tapos|okay|working|broken|sira)\b/i],
  ['visits', /\b(visits?|times?|trips?|balik|bumalik|beses|ilan)\b/i],
  ['shop', /\b(shops?|where|saan|mechanic|technician|contractor|kanino)\b/i],
  ['list', /\b(repairs|list|all|lahat|ano.?ano|which)\b/i],
]

function detect(question: string): Intent | null {
  return INTENTS.find(([, re]) => re.test(question))?.[0] ?? null
}

function words(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2)
}

/** Files the question names by problem, shop, item, or plate. All files when it names none. */
function pickFiles(files: RepairPack[], question: string) {
  const q = new Set(words(question))
  const named = files.filter(f =>
    words([f.problem, f.shop_name, vehicleName(f.vehicle), f.vehicle?.kind ?? '', f.vehicle?.plate_no ?? ''].join(' ')).some(w =>
      q.has(w),
    ),
  )
  return {files: named.length ? named : files, named: named.length > 0}
}

/** A short summary of one repair, for "Tell me about …". */
function summary(f: RepairPack) {
  const clocks = fileClocks(f, f.visits)
  const item = vehicleName(f.vehicle)
  const visits = sortVisits(f.visits)
  const last = visits[visits.length - 1]
  return [
    `“${f.problem}”${item ? ` on your ${item}` : ''}, at ${f.shop_name}${f.shop_city ? `, ${f.shop_city}` : ''}.`,
    `Started ${formatDate(f.started_at)}. It is ${f.status === 'open' ? 'still open' : 'closed'}.`,
    clocks.attempts
      ? `${plural(clocks.attempts, 'visit')}, ${plural(clocks.daysInShop, 'day')} with the shop, ${formatPrice(clocks.amountPaid)} paid.`
      : 'No visit saved yet.',
    last?.result ? `Last result: ${RESULT_LABEL[last.result]}.` : '',
  ]
    .filter(Boolean)
    .join(' ')
}

const href = (f: RepairPack) => `/files/${f.id}`
const source = (f: RepairPack): PooniSource => ({title: f.problem, href: href(f)})

function lineFor(intent: Intent, f: RepairPack): string | null {
  const clocks = fileClocks(f, f.visits)
  const visits = sortVisits(f.visits)
  const last = visits[visits.length - 1]
  const name = `“${f.problem}”`
  switch (intent) {
    case 'paid':
      return visits.some(v => v.amount_paid != null)
        ? `${name}: you paid ${formatPrice(clocks.amountPaid)} over ${plural(clocks.attempts, 'visit')}.`
        : `${name}: no payment saved yet.`
    case 'limit': {
      const cap = f.job_slip?.peso_cap ?? f.peso_cap
      return cap != null ? `${name}: your price limit is ${formatPrice(cap)}.` : `${name}: no quote or price limit saved.`
    }
    case 'visits':
      return `${name}: ${plural(clocks.attempts, 'visit')} at ${f.shop_name}.`
    case 'days':
      return clocks.attempts
        ? `${name}: ${plural(clocks.daysInShop, 'day')} with the shop${clocks.stillInside ? ', and it is still there' : ''}.`
        : `${name}: no visit saved yet, so I can't count the days.`
    case 'shopSaid': {
      const said = visits.filter(v => v.shop_said?.trim())
      if (!said.length) return `${name}: you didn't save what the shop said.`
      const v = said[said.length - 1]
      return `${name}: on ${formatDate(v.date_in)}, the shop said: “${v.shop_said!.trim()}”`
    }
    case 'latest':
      if (!last) return `${name}: no visit saved yet. You started this file on ${formatDate(f.started_at)}.`
      return [
        `${name}: latest visit on ${formatDate(last.date_in)}`,
        last.date_out ? `, back on ${formatDate(last.date_out)}` : ', still with the shop',
        last.result ? `. Result: ${RESULT_LABEL[last.result]}` : '',
        last.amount_paid != null ? `. Paid ${formatPrice(last.amount_paid)}` : '',
        '.',
      ].join('')
    case 'shop':
      return `${name}: ${f.shop_name}${f.shop_city ? `, ${f.shop_city}` : ''}.`
    case 'status': {
      const result = last?.result ? ` Last result: ${RESULT_LABEL[last.result]}.` : ''
      return `${name}: ${f.status === 'open' ? 'still open' : 'closed'}.${result}`
    }
    case 'docs': {
      if (!f.attachments.length) return `${name}: no photos or documents saved.`
      const list = f.attachments
        .map(a => `${ATTACHMENT_LABEL[a.kind]}${a.caption?.trim() ? ` (“${a.caption.trim()}”)` : ''}`)
        .join(', ')
      return `${name}: ${list}.`
    }
    case 'list': {
      const item = vehicleName(f.vehicle)
      return `${name}${item ? ` on your ${item}` : ''} at ${f.shop_name}, ${f.status === 'open' ? 'open' : 'closed'}.`
    }
  }
}

function totalLine(intent: Intent, files: RepairPack[]) {
  if (files.length < 2) return null
  if (intent === 'paid') {
    const total = files.reduce((n, f) => n + fileClocks(f, f.visits).amountPaid, 0)
    return `In total, you paid ${formatPrice(total)} across ${plural(files.length, 'repair')}.`
  }
  if (intent === 'visits') {
    const total = files.reduce((n, f) => n + f.visits.length, 0)
    return `In total, ${plural(total, 'visit')} across ${plural(files.length, 'repair')}.`
  }
  return null
}

/** Builds a reply in the browser, only from the saved files. */
export function answerLocally(question: string, all: RepairPack[]): PooniReply {
  if (!all.length) return NO_DATA_REPLY
  const {files, named} = pickFiles(all, question)
  const intent = detect(question)
  const one = files.length === 1 ? files[0] : null

  if (intent) {
    const lines = files.map(f => lineFor(intent, f)).filter((l): l is string => !!l)
    const total = totalLine(intent, files)
    if (total) lines.push(total)
    return {text: lines.join('\n'), sources: files.map(source), followUps: nextQuestions(intent, named ? one : null)}
  }

  // The question names a repair but no topic, like "Tell me about the aircon".
  if (named) {
    return {text: files.map(summary).join('\n'), sources: files.map(source), followUps: nextQuestions(null, one)}
  }

  // No known topic. Search the notes word by word.
  const hits = retrieveChunks(buildCorpus(files), question, 4)
  if (hits.length) {
    return {
      text: ['Here is what I found in your repairs:', ...hits.map(h => `• ${h.text}`)].join('\n'),
      sources: hits.map(h => ({title: h.title, href: h.href})),
      followUps: nextQuestions(null, null),
    }
  }

  // Nothing matched, so Pooni asks back instead of guessing.
  return {
    text:
      all.length > 1
        ? "I couldn't find that in your repairs. Which repair do you mean? You can also ask me about cost, visits, days, or what the shop said."
        : `I couldn't find that in “${all[0].problem}”. Do you want to know the cost, the visits, or what the shop said?`,
    sources: [],
    followUps: all.length > 1 ? all.slice(0, 3).map(f => `Tell me about “${f.problem}”`) : STARTERS.slice(0, 3),
  }
}

/** Questions Pooni asks back. About one repair when the talk is about one. */
function nextQuestions(asked: Intent | null, file: RepairPack | null) {
  const about = file ? ` for “${file.problem}”` : ''
  const pool: [Intent, string][] = [
    ['paid', `How much have I paid${about}?`],
    ['shopSaid', `What did the shop say${about}?`],
    ['latest', `What is the latest visit${about}?`],
    ['days', `How many days at the shop${about}?`],
    ['docs', `What photos did I save${about}?`],
  ]
  return pool.filter(([id]) => id !== asked).slice(0, 3).map(([, q]) => q)
}

/** null means the AI function is not deployed or has no key. Then Pooni stays in the browser. */
let aiReady: boolean | null = null

export type PooniTurn = {role: 'user' | 'assistant'; text: string}

/**
 * Asks Pooni. No data: the reply is fixed and nothing is sent anywhere.
 * With data: the AI function answers when it is set up, otherwise the browser does.
 */
export async function askPooni(question: string, files: RepairPack[], history: PooniTurn[], fileId: string | null): Promise<PooniReply> {
  if (!files.length) return NO_DATA_REPLY
  if (aiReady !== false) {
    try {
      const {data, error} = await supabase.functions.invoke('ask-pooni', {
        body: {question, file_id: fileId, history: history.slice(-6)},
      })
      if (error) throw error
      if (data?.answer) {
        aiReady = true
        const ids = new Set<string>(data.file_ids ?? [])
        return {
          text: String(data.answer),
          sources: files.filter(f => ids.has(f.id)).map(source),
          followUps: Array.isArray(data.follow_ups) ? data.follow_ups.slice(0, 3).map(String) : [],
        }
      }
    } catch {
      // Not deployed, no key, or the AI service failed. The browser answers instead.
    }
    aiReady = false
  }
  return answerLocally(question, files)
}
