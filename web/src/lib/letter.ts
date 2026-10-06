import dayjs from 'dayjs'
import type {
  AttachmentRow,
  JobSlipRow,
  LetterLanguage,
  LetterType,
  OfficeRow,
  RepairFileRow,
  Remedy,
  VisitRow,
} from '@/types/repair-proof'
import {
  ATTACHMENT_LABEL,
  RESULT_LABEL,
  fileClocks,
  phraseLabel,
  sortVisits,
  vehicleName,
  type VehicleLike,
} from './repair'
import {problemKnown, shopKnown} from './next-step'
import {kindGroup, kindInfo} from './kinds'

export const LETTER_TYPE_LABEL: Record<LetterType, string> = {
  dti: 'Complaint to DTI',
  shop: 'Demand letter to the shop',
  records: 'Note for my records',
}

export const REMEDY_LABEL: Record<Remedy, string> = {
  repair: 'Repair it again, at no cost',
  replace: 'Replace the part or unit',
  refund: 'Refund what I paid',
  decide: 'Let them decide what is fair',
}

export const LETTER_DISCLAIMER =
  'This is a draft from your repair file. It is not legal advice. Read it. Change anything that is wrong. You file it yourself.'

export type LetterOwner = {name: string; mobile: string | null}

export type LetterContext = {
  file: RepairFileRow & {vehicle: VehicleLike | null}
  visits: VisitRow[]
  attachments: Pick<AttachmentRow, 'kind' | 'caption'>[]
  slip: Pick<JobSlipRow, 'job_text' | 'peso_cap' | 'dropoff_at' | 'extras'> | null
  owner: LetterOwner
}

export type LetterOptions = {type: LetterType; remedy: Remedy; language: LetterLanguage}

/** A file needs a shop and at least one visit before a letter makes sense. */
export function letterBlocker(ctx: Pick<LetterContext, 'file' | 'visits'>) {
  if (!shopKnown(ctx.file.shop_name)) return 'Add the shop name first.'
  if (!problemKnown(ctx.file.problem)) return "Say what's wrong first."
  if (!ctx.visits.length) return 'Add the shop name and at least one visit first.'
  return null
}

/**
 * How the letter names what was repaired. "2019 Toyota Vios" or "car" when it has no name.
 * Places (a home, wiring, a build) are worked on where they are, so they are never "brought to the shop".
 */
function itemWords(vehicle: VehicleLike | null, fil: boolean) {
  const info = kindInfo(vehicle?.kind)
  const noun = fil ? info.nounFil : info.noun
  return {name: vehicleName(vehicle) || noun, noun, atShop: !!vehicle && kindGroup(vehicle.kind) !== 'place'}
}

/** Owner text ends with exactly one stop, whatever they typed. */
const stop = (s: string) => s.trim().replace(/[.!?]+$/, '') + '.'

const peso = (n: number) =>
  `₱${Number(n).toLocaleString('en-PH', {minimumFractionDigits: 0, maximumFractionDigits: 2})}`
const day = (d: string, lang: LetterLanguage) =>
  lang === 'fil' ? dayjs(d).format('MMMM D, YYYY') : dayjs(d).format('D MMMM YYYY')

/** The "To" lines. Office details come from the map pick, never from the model. */
export function recipientLines(type: LetterType, office: OfficeRow | null, file: Pick<RepairFileRow, 'shop_name' | 'shop_city'>) {
  if (type === 'shop') return ['The Manager', file.shop_name, file.shop_city].filter(Boolean) as string[]
  if (type === 'records') return []
  if (!office) return ['The Regional Director', 'Department of Trade and Industry (DTI)']
  return ['The Regional Director', office.name, office.address]
}

export function composeLetter(
  ctx: LetterContext,
  opts: LetterOptions,
  office: OfficeRow | null,
  body: string,
  today = dayjs(),
) {
  const {head, foot} = letterFrame(ctx, opts, office, today)
  return [head, body.trim(), foot].filter(Boolean).join('\n\n')
}

/** Everything around the body: sender, date, To block, subject, salutation, then attachments and closing. */
export function letterFrame(ctx: LetterContext, opts: LetterOptions, office: OfficeRow | null, today = dayjs()) {
  const fil = opts.language === 'fil'
  const vehicle = itemWords(ctx.file.vehicle, fil).name
  const to = recipientLines(opts.type, office, ctx.file)
  const subject =
    opts.type === 'records'
      ? fil
        ? `Tala tungkol sa pagpapaayos ng aking ${vehicle} sa ${ctx.file.shop_name}`
        : `Record of the repair of my ${vehicle} at ${ctx.file.shop_name}`
      : fil
        ? `Reklamo tungkol sa pagpapaayos ng aking ${vehicle} sa ${ctx.file.shop_name}`
        : `Complaint about the repair of my ${vehicle} at ${ctx.file.shop_name}`

  const head: string[] = [ctx.owner.name]
  if (ctx.owner.mobile) head.push(ctx.owner.mobile)
  head.push(fil ? today.format('MMMM D, YYYY') : today.format('D MMMM YYYY'), '')
  if (to.length) head.push(...to, '')
  head.push(`${fil ? 'Paksa' : 'Subject'}: ${subject}`)
  if (opts.type !== 'records') head.push('', fil ? 'Mahal na Ginoo o Ginang:' : 'Dear Sir or Madam:')

  const foot: string[] = []
  if (ctx.attachments.length) {
    foot.push(fil ? 'Mga kalakip:' : 'Attachments:')
    ctx.attachments.forEach((a, i) =>
      foot.push(`${i + 1}. ${ATTACHMENT_LABEL[a.kind]}${a.caption ? `: ${a.caption}` : ''}`),
    )
  }
  if (opts.type !== 'records') {
    if (foot.length) foot.push('')
    foot.push(fil ? 'Lubos na gumagalang,' : 'Respectfully,', '', ctx.owner.name)
  }
  return {head: head.join('\n'), foot: foot.join('\n'), subject}
}

/** A plain letter body built only from the file, for when the AI is off or the owner prefers it. */
export function templateBody(ctx: LetterContext, opts: LetterOptions) {
  const fil = opts.language === 'fil'
  const visits = sortVisits(ctx.visits)
  const clocks = fileClocks(ctx.file, visits)
  const item = itemWords(ctx.file.vehicle, fil)
  const vehicle = item.name
  const plate = ctx.file.vehicle?.plate_no ? (fil ? `, plakang ${ctx.file.vehicle.plate_no}` : `, plate ${ctx.file.vehicle.plate_no}`) : ''
  const where = [ctx.file.shop_name, ctx.file.shop_city].filter(Boolean).join(', ')
  const p: string[] = []

  p.push(
    fil
      ? `Isinusulat ko ito tungkol sa pagpapaayos ng aking ${vehicle}${plate} sa ${where}. Ang problema: ${stop(ctx.file.problem)} Una ko itong inireport noong ${day(ctx.file.started_at, 'fil')}.`
      : `I am writing about the repair of my ${vehicle}${plate} at ${where}. The problem is: ${stop(ctx.file.problem)} I first reported it on ${day(ctx.file.started_at, 'en')}.`,
  )

  const visitLines = visits.map((v, i) => {
    const when = v.date_out
      ? `${day(v.date_in, opts.language)} ${fil ? 'hanggang' : 'to'} ${day(v.date_out, opts.language)}.`
      : `${day(v.date_in, opts.language)}, ${
          item.atShop
            ? fil
              ? 'nasa shop pa hanggang ngayon'
              : 'still at the shop'
            : fil
              ? 'hindi pa tapos ang trabaho'
              : 'the work is not finished'
        }.`
    const parts = [`${i + 1}. ${when}`]
    if (v.story) parts.push(fil ? `Sinabi ko: ${stop(v.story)}` : `I reported: ${stop(v.story)}`)
    if (v.shop_said) parts.push(fil ? `Sabi o ginawa ng shop: ${stop(v.shop_said)}` : `The shop said or did: ${stop(v.shop_said)}`)
    if (v.phrases?.length) parts.push(fil ? `Sinabi ng shop: ${v.phrases.map(phraseLabel).join('; ')}.` : `The shop told me: ${v.phrases.map(phraseLabel).join('; ')}.`)
    if (v.result) parts.push(fil ? `Resulta: ${RESULT_LABEL[v.result]}.` : `Result: ${RESULT_LABEL[v.result]}.`)
    if (v.amount_paid) parts.push(fil ? `Nagbayad ako ng ${peso(v.amount_paid)}.` : `I paid ${peso(v.amount_paid)}.`)
    return parts.join(' ')
  })
  p.push(
    (item.atShop
      ? fil
        ? `Dinala ko ang ${item.noun} sa shop nang ${clocks.attempts} beses para sa parehong problema:`
        : `I brought the ${item.noun} to the shop ${clocks.attempts === 1 ? 'once' : `${clocks.attempts} times`} for this problem:`
      : fil
        ? `Bumalik ang shop o gumawa ng trabaho nang ${clocks.attempts} beses para sa parehong problema:`
        : `The shop worked on this problem ${clocks.attempts === 1 ? 'once' : `${clocks.attempts} times`}:`) +
      '\n' +
      visitLines.join('\n'),
  )

  const dayWord = clocks.daysInShop === 1 ? 'day' : 'days'
  const totals = item.atShop
    ? fil
      ? [`Sa kabuuan, ${clocks.daysInShop} araw nang nasa shop ang ${item.noun}.`]
      : [`In total, the ${item.noun} has spent ${clocks.daysInShop} ${dayWord} at the shop.`]
    : fil
      ? [`Sa kabuuan, ${clocks.daysInShop} araw na ang trabaho.`]
      : [`In total, the work has taken ${clocks.daysInShop} ${dayWord}.`]
  if (clocks.amountPaid) totals.push(fil ? `Nakapagbayad na ako ng ${peso(clocks.amountPaid)}.` : `I have paid ${peso(clocks.amountPaid)}.`)
  if (ctx.slip) {
    totals.push(
      fil
        ? `Bago magsimula ang trabaho, sumulat ako ng job slip: "${ctx.slip.job_text}"${ctx.slip.peso_cap ? `, na may limitasyong ${peso(ctx.slip.peso_cap)}` : ''}.`
        : `Before work started, I wrote a job slip: "${ctx.slip.job_text}"${ctx.slip.peso_cap ? `, with a limit of ${peso(ctx.slip.peso_cap)}` : ''}.`,
    )
    const refused = ctx.slip.extras.filter(e => e.answer === 'no')
    if (refused.length) {
      totals.push(
        fil
          ? `Hindi ko inaprubahan ang dagdag na trabahong ito: ${refused.map(e => e.text).join('; ')}.`
          : `I did not approve this extra work: ${refused.map(e => e.text).join('; ')}.`,
      )
    }
  }
  if (ctx.file.old_parts === 'refused') {
    totals.push(fil ? 'Hiningi ko ang mga lumang piyesa, pero tumanggi ang shop.' : 'I asked for my old parts back, and the shop refused.')
  }
  p.push(totals.join(' '))

  if (opts.type !== 'records') {
    const ask = {
      repair: item.atShop
        ? fil
          ? `Hinihiling kong ayusin nang tama ang ${item.noun} nang walang dagdag na bayad.`
          : `I ask that the shop repair the ${item.noun} properly, at no extra cost.`
        : fil
          ? 'Hinihiling kong ayusin nang tama ang trabaho nang walang dagdag na bayad.'
          : 'I ask that the shop fix the work properly, at no extra cost.',
      replace: fil ? 'Hinihiling kong palitan ang depektibong piyesa o unit.' : 'I ask for a replacement of the defective part or unit.',
      refund: clocks.amountPaid
        ? fil
          ? `Hinihiling kong ibalik ang ${peso(clocks.amountPaid)} na ibinayad ko.`
          : `I ask for a refund of the ${peso(clocks.amountPaid)} I paid.`
        : fil
          ? 'Hinihiling kong ibalik ang ibinayad ko.'
          : 'I ask for a refund of what I paid.',
      decide: fil
        ? 'Humihingi ako ng tulong para maayos ito nang patas, sa pamamagitan ng pagkumpuni, pagpapalit, o refund.'
        : 'I ask for help to settle this fairly, by repair, replacement, or refund.',
    }[opts.remedy]
    const attached = ctx.attachments.length > 0
    const close =
      opts.type === 'dti'
        ? fil
          ? `Handa akong dumalo sa mediation.${attached ? ' Kalakip ang kopya ng mga dokumentong nakalista sa ibaba.' : ''}`
          : `I am ready to attend mediation.${attached ? ' Copies of the documents listed below are attached.' : ''}`
        : fil
          ? 'Hinihintay ko ang inyong nakasulat na sagot sa loob ng pitong araw. Kung wala akong matanggap, magsasampa ako ng reklamo sa DTI.'
          : 'I ask for your written reply within seven days. If I do not hear from you, I will file a complaint with DTI.'
    p.push(`${ask} ${close}`)
  }
  return p.join('\n\n')
}
