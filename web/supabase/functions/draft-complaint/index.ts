// Drafts the body of a complaint letter from one repair file, and only from that file.
// Deploy: npx supabase functions deploy draft-complaint --project-ref <ref>
// Secrets: AI_API_KEY (required), AI_MODEL (default gpt-4o-mini), AI_BASE_URL (any OpenAI-compatible API).
import {createClient} from 'npm:@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const TYPES = ['dti', 'shop', 'records'] as const
const REMEDIES = ['repair', 'replace', 'refund', 'decide'] as const
const LANGS = ['en', 'fil'] as const
// Laws the app itself mentions. Any other law number in a draft is treated as invented.
const KNOWN_LAWS = ['10642', '7394']

const PHRASES: Record<string, string> = {
  warranty_lang: '"Service warranty lang"',
  no_return: '"No return, no exchange"',
  come_back: '"Come back next week" (no real diagnosis)',
  sold_as_new: 'Sold as brand-new but looked used or repaired',
  parts_no_date: 'Waiting for parts, no date given',
}
const RESULTS: Record<string, string> = {
  fixed: 'Fixed',
  not_fixed: 'Not fixed',
  worse: 'Worse',
  waiting_parts: 'Waiting for parts',
}

function reply(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {status, headers: {...CORS, 'Content-Type': 'application/json'}})
}

type Visit = {
  date_in: string
  date_out: string | null
  story: string | null
  shop_said: string | null
  result: string | null
  amount_paid: number | null
  phrases: string[] | null
  created_at: string
}
type Extra = {text: string; cap: number | null; answer: 'yes' | 'no' | null; answered_at: string | null}

const dayDiff = (a: string, b: string) => Math.max(0, Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000))

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', {headers: CORS})
  if (req.method !== 'POST') return reply(405, {error: 'method_not_allowed'})

  const auth = req.headers.get('Authorization')
  if (!auth) return reply(401, {error: 'unauthorized', message: 'Sign in first.'})

  const apiKey = Deno.env.get('AI_API_KEY')
  if (!apiKey) return reply(503, {error: 'not_configured'})

  let input: {
    file_id?: string
    office_id?: number | null
    letter_type?: string
    remedy?: string
    language?: string
    owner_lat?: number | null
    owner_lng?: number | null
  }
  try {
    input = await req.json()
  } catch {
    return reply(400, {error: 'bad_request', message: 'The request was not valid JSON.'})
  }
  const type = TYPES.find(t => t === input.letter_type) ?? 'dti'
  const remedy = REMEDIES.find(r => r === input.remedy) ?? 'repair'
  const language = LANGS.find(l => l === input.language) ?? 'en'
  if (!input.file_id) return reply(400, {error: 'bad_request', message: 'Missing file_id.'})

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: {headers: {Authorization: auth}},
  })
  const {data: user} = await supabase.auth.getUser()
  if (!user.user) return reply(401, {error: 'unauthorized', message: 'Sign in again.'})

  // RLS limits this to the caller's own file.
  const {data: file, error: fileError} = await supabase
    .from('repair_files')
    .select(
      'id, shop_name, shop_city, problem, started_at, old_parts, peso_cap, vehicle(kind, year_model, plate_no, make_text, model_text, brand(name), model(name)), visits(date_in, date_out, story, shop_said, result, amount_paid, phrases, created_at), attachments(kind, caption), job_slips(job_text, peso_cap, dropoff_at, extras)',
    )
    .eq('id', input.file_id)
    .maybeSingle()
  if (fileError) return reply(500, {error: 'failed', message: fileError.message})
  if (!file) return reply(404, {error: 'not_found', message: "We couldn't find that file."})

  const visits = ((file.visits ?? []) as Visit[]).sort(
    (a, b) => a.date_in.localeCompare(b.date_in) || a.created_at.localeCompare(b.created_at),
  )
  if (!file.shop_name?.trim() || visits.length === 0) return reply(422, {error: 'thin_file'})

  let office: {name: string; address: string} | null = null
  if (type === 'dti' && input.office_id) {
    const {data} = await supabase.from('offices').select('name, address').eq('id', input.office_id).maybeSingle()
    office = data
  }

  const v = (Array.isArray(file.vehicle) ? file.vehicle[0] : file.vehicle) as
    | {
        kind: string
        year_model: string | null
        plate_no: string | null
        make_text: string | null
        model_text: string | null
        brand: {name: string} | null
        model: {name: string} | null
      }
    | null
  const slipRaw = Array.isArray(file.job_slips) ? file.job_slips[0] : file.job_slips
  const slip = slipRaw as {job_text: string; peso_cap: number | null; dropoff_at: string | null; extras: Extra[] | null} | null
  const today = new Date().toISOString().slice(0, 10)

  let daysInShop = 0
  let paid = 0
  for (const visit of visits) {
    daysInShop += dayDiff(visit.date_in, visit.date_out ?? today)
    paid += Number(visit.amount_paid ?? 0)
  }

  // Homes, wiring and builds are worked on where they are, not brought to a shop.
  const onSite = !!v && ['home', 'construction', 'electrical', 'other'].includes(v.kind)
  const isVehicle = !!v && (v.kind === 'car' || v.kind === 'motorcycle')

  const facts = {
    today,
    repaired_item: v
      ? {
          kind: v.kind,
          name: [isVehicle ? v.year_model : null, v.brand?.name ?? v.make_text, v.model?.name ?? v.model_text]
            .filter(Boolean)
            .join(' '),
          plate: v.plate_no,
          worked_on: onSite ? 'at the owner’s place' : 'at the shop',
        }
      : null,
    shop: {name: file.shop_name, city: file.shop_city},
    problem: file.problem,
    first_reported: file.started_at,
    quoted_price_php: file.peso_cap,
    visits: visits.map((visit, i) => ({
      number: i + 1,
      started: visit.date_in,
      done_on: visit.date_out ?? (onSite ? 'work not finished' : 'still at the shop'),
      owner_told_shop: visit.story,
      shop_said_or_did: visit.shop_said,
      dealer_phrases: (visit.phrases ?? []).map(p => PHRASES[p] ?? p),
      result: visit.result ? RESULTS[visit.result] : null,
      paid_php: visit.amount_paid,
    })),
    totals: {visits: visits.length, [onSite ? 'days_of_work' : 'days_at_shop']: daysInShop, paid_php: paid},
    old_parts: {no: 'not asked for', yes: 'asked for', refused: 'asked for, and the shop refused'}[file.old_parts as string],
    job_slip: slip
      ? {
          job: slip.job_text,
          price_limit_php: slip.peso_cap,
          dropoff: slip.dropoff_at,
          extras: (slip.extras ?? []).map(e => ({text: e.text, price_php: e.cap, owner_answer: e.answer ?? 'no answer'})),
        }
      : null,
    attachments: ((file.attachments ?? []) as {kind: string; caption: string | null}[]).map(a => a.caption || a.kind),
    lemon_law_hint: v?.kind === 'car' && visits.length >= 4,
    long_stay_hint: daysInShop >= 30,
    consumer_act_hint: !!v && v.kind !== 'car',
  }

  const recipient = {
    dti: office ? `the DTI office: ${office.name}` : 'DTI (Department of Trade and Industry)',
    shop: `the shop manager at ${file.shop_name}`,
    records: 'no one; it is a note for the owner’s own records',
  }[type]
  const ask = {
    repair: 'a proper repair at no extra cost',
    replace: 'replacement of the defective part or unit',
    refund: 'a refund of what was paid',
    decide: 'a fair settlement by repair, replacement, or refund',
  }[remedy]

  const system = [
    'You write the BODY of a short, polite, firm complaint letter for a consumer in the Philippines about a repair: a car, motorcycle, home repair, construction, electrical work, aircon, appliance, computer, or phone.',
    'Use ONLY the facts in the JSON. Do not add dates, amounts, names, parts, diagnoses, promises, or events that are not in it.',
    'If a fact is missing, leave it out. Never guess. Never write placeholders like [date].',
    'Peso amounts must appear exactly as given, written like ₱4,500.',
    'Do not cite any law unless lemon_law_hint is true (then you may mention RA 10642, the Lemon Law, as something the facts "may" fit) or consumer_act_hint is true (then you may mention RA 7394, the Consumer Act). Never say the shop broke the law; say the facts may support a complaint.',
    'Do not write the sender block, date, recipient address, subject line, salutation, attachment list, or sign-off. Those are added separately.',
    'Write in first person as the owner. Plain words. Short paragraphs. 180 to 380 words.',
    'If repaired_item.worked_on is at the owner’s place, call the visits work visits and never say the item was brought to the shop.',
    'Order: what was repaired and the problem; each visit in order with dates and what was said; totals (visits, days, amount paid); the job slip and any extra work not approved, if present; the request; for DTI, say the owner is ready for mediation.',
    language === 'fil'
      ? 'Write in clear, everyday Filipino (Tagalog). Keep brand names, model names, and amounts as they are.'
      : 'Write in clear US English.',
  ].join('\n')
  const user = `Letter goes to: ${recipient}.\nThe owner asks for: ${type === 'records' ? 'nothing; just a clear record' : ask}.\n\nFacts (JSON):\n${JSON.stringify(facts, null, 2)}`

  const base = (Deno.env.get('AI_BASE_URL') ?? 'https://api.openai.com/v1').replace(/\/$/, '')
  const model = Deno.env.get('AI_MODEL') ?? 'gpt-4o-mini'
  let body = ''
  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: {Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json'},
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 900,
        messages: [
          {role: 'system', content: system},
          {role: 'user', content: user},
        ],
      }),
    })
    if (!res.ok) return reply(502, {error: 'failed', message: `The AI service said ${res.status}. Try again, or use the plain template.`})
    const json = await res.json()
    body = String(json.choices?.[0]?.message?.content ?? '').trim()
  } catch {
    return reply(502, {error: 'failed'})
  }
  if (!body) return reply(502, {error: 'failed'})

  // Strip a greeting or sign-off if the model added one anyway.
  body = body
    .replace(/^(dear [^\n]*|mahal na [^\n]*|to whom it may concern[^\n]*)\n+/i, '')
    .replace(/\n+(respectfully|sincerely|lubos na gumagalang|gumagalang)[\s\S]*$/i, '')
    .trim()

  // Every peso amount in the draft must be one that is in the file.
  const allowed = new Set<number>([paid, ...visits.map(x => Number(x.amount_paid ?? 0))])
  if (file.peso_cap != null) allowed.add(Number(file.peso_cap))
  if (slip?.peso_cap != null) allowed.add(Number(slip.peso_cap))
  for (const e of slip?.extras ?? []) if (e.cap != null) allowed.add(Number(e.cap))
  const amounts = [...body.matchAll(/(?:₱|PHP\s?|Php\s?|P(?=\d))\s?([\d,]+(?:\.\d{1,2})?)/g)].map(m => Number(m[1].replace(/,/g, '')))
  const laws = [...body.matchAll(/\b(?:RA|R\.A\.|Republic Act(?: No\.)?)\s*(\d{3,5})/gi)].map(m => m[1])
  if (amounts.some(a => !allowed.has(a)) || laws.some(l => !KNOWN_LAWS.includes(l))) {
    return reply(422, {error: 'invented_fact'})
  }

  const {data: letter, error: insertError} = await supabase
    .from('letters')
    .insert({
      file_id: file.id,
      office_id: type === 'dti' ? (input.office_id ?? null) : null,
      letter_type: type,
      remedy,
      language,
      owner_lat: input.owner_lat ?? null,
      owner_lng: input.owner_lng ?? null,
      draft_text: body,
      model,
    })
    .select('*')
    .single()
  if (insertError) {
    if (/daily_draft_limit/.test(insertError.message)) return reply(429, {error: 'daily_draft_limit'})
    return reply(500, {error: 'failed', message: insertError.message})
  }
  return reply(200, {letter})
})
