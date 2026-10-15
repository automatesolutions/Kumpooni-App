// Pooni answers a question about the signed-in person's repairs, and only from their saved files.
// Deploy: npx supabase functions deploy ask-pooni --project-ref <ref>
// Secrets: AI_API_KEY (required), AI_MODEL (default gpt-4o-mini), AI_BASE_URL (any OpenAI-compatible API).
// Without the key it answers 503, and the app answers in the browser instead.
import {createClient} from 'npm:@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const NO_DATA =
  "I don't have any repair data yet, so I can't answer that. Add a repair first. Then ask me about it, and I'll answer from what you saved."

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
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', {headers: CORS})
  if (req.method !== 'POST') return reply(405, {error: 'method_not_allowed'})

  const auth = req.headers.get('Authorization')
  if (!auth) return reply(401, {error: 'unauthorized'})

  const apiKey = Deno.env.get('AI_API_KEY')
  if (!apiKey) return reply(503, {error: 'not_configured'})

  let input: {question?: string; file_id?: string | null; history?: {role: string; text: string}[]}
  try {
    input = await req.json()
  } catch {
    return reply(400, {error: 'bad_request'})
  }
  const question = String(input.question ?? '').trim().slice(0, 500)
  if (!question) return reply(400, {error: 'bad_request'})

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: {headers: {Authorization: auth}},
  })
  const {data: user} = await supabase.auth.getUser()
  if (!user.user) return reply(401, {error: 'unauthorized'})

  // RLS limits this to the caller's own files.
  let query = supabase
    .from('repair_files')
    .select(
      'id, problem, shop_name, shop_city, started_at, status, peso_cap, vehicle(kind, year_model, plate_no, make_text, model_text, brand(name), model(name)), visits(date_in, date_out, story, shop_said, result, amount_paid), attachments(kind, caption, taken_at), job_slips(job_text, peso_cap)',
    )
    .eq('user_id', user.user.id)
  if (input.file_id) query = query.eq('id', input.file_id)
  const {data: files, error} = await query
  if (error) return reply(500, {error: 'failed'})

  // No data: a fixed answer. The AI is never asked.
  if (!files?.length) return reply(200, {answer: NO_DATA, file_ids: [], follow_ups: [], no_data: true})

  const today = new Date().toISOString().slice(0, 10)
  const facts = files.map(f => {
    const visits = ((f.visits ?? []) as Visit[]).sort((a, b) => a.date_in.localeCompare(b.date_in))
    const v = (Array.isArray(f.vehicle) ? f.vehicle[0] : f.vehicle) as Record<string, any> | null
    const slip = (Array.isArray(f.job_slips) ? f.job_slips[0] : f.job_slips) as {job_text: string; peso_cap: number | null} | null
    return {
      file_id: f.id,
      problem: f.problem,
      item: v
        ? {
            kind: v.kind,
            name: [v.year_model, v.brand?.name ?? v.make_text, v.model?.name ?? v.model_text].filter(Boolean).join(' '),
            plate: v.plate_no,
          }
        : null,
      shop: {name: f.shop_name, city: f.shop_city},
      started: f.started_at,
      status: f.status,
      price_limit_php: slip?.peso_cap ?? f.peso_cap,
      job_slip: slip?.job_text ?? null,
      visits: visits.map((x, i) => ({
        number: i + 1,
        dropped_off: x.date_in,
        got_back: x.date_out ?? 'still with the shop',
        owner_said: x.story,
        shop_said: x.shop_said,
        result: x.result ? RESULTS[x.result] : null,
        paid_php: x.amount_paid,
      })),
      total_paid_php: visits.reduce((n, x) => n + Number(x.amount_paid ?? 0), 0),
      documents: ((f.attachments ?? []) as {kind: string; caption: string | null; taken_at: string | null}[]).map(a => ({
        kind: a.kind,
        note: a.caption,
        dated: a.taken_at,
      })),
    }
  })

  const system = [
    'You are Pooni, the friendly mascot of Kumpooni, a repair record app in the Philippines.',
    'Answer ONLY from the repair data in the JSON. Never use outside knowledge, never guess, never give legal, price, or technical advice.',
    'If the answer is not in the data, say plainly that it is not in their saved repairs, and suggest what they could add (a visit, a payment, a note on a photo).',
    'If the question is unclear or could mean more than one repair, ask ONE short question back instead of guessing.',
    'Peso amounts must appear exactly as in the data, written like ₱4,500. Dates as in the data, written like 3 Oct 2026.',
    'Keep it short: 1 to 4 sentences, or a short list. Warm and plain. Reply in the language of the question (English, Filipino, or Taglish).',
    'Return JSON only: {"answer": string, "file_ids": string[] (the files you used), "follow_ups": string[] (0 to 3 short questions the person could ask next, answerable from the data)}.',
    `Today is ${today}.`,
  ].join('\n')

  const history = (input.history ?? [])
    .slice(-6)
    .filter(t => t && (t.role === 'user' || t.role === 'assistant'))
    .map(t => ({role: t.role as 'user' | 'assistant', content: String(t.text).slice(0, 1000)}))

  const base = (Deno.env.get('AI_BASE_URL') ?? 'https://api.openai.com/v1').replace(/\/$/, '')
  const model = Deno.env.get('AI_MODEL') ?? 'gpt-4o-mini'
  let out: {answer?: string; file_ids?: string[]; follow_ups?: string[]} = {}
  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: {Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json'},
      body: JSON.stringify({
        model,
        temperature: 0.1,
        max_tokens: 500,
        response_format: {type: 'json_object'},
        messages: [
          {role: 'system', content: system},
          {role: 'system', content: `Repair data (JSON):\n${JSON.stringify(facts)}`},
          ...history,
          {role: 'user', content: question},
        ],
      }),
    })
    if (!res.ok) return reply(502, {error: 'failed'})
    const json = await res.json()
    out = JSON.parse(String(json.choices?.[0]?.message?.content ?? '{}'))
  } catch {
    return reply(502, {error: 'failed'})
  }
  const answer = String(out.answer ?? '').trim()
  if (!answer) return reply(502, {error: 'failed'})

  // Every peso amount in the answer must be one that is in the data. Otherwise the app answers instead.
  const allowed = new Set<number>()
  for (const f of facts) {
    allowed.add(f.total_paid_php)
    if (f.price_limit_php != null) allowed.add(Number(f.price_limit_php))
    for (const v of f.visits) if (v.paid_php != null) allowed.add(Number(v.paid_php))
  }
  allowed.add(facts.reduce((n, f) => n + f.total_paid_php, 0))
  const amounts = [...answer.matchAll(/(?:₱|PHP\s?|Php\s?)\s?([\d,]+(?:\.\d{1,2})?)/g)].map(m => Number(m[1].replace(/,/g, '')))
  if (amounts.some(a => !allowed.has(a))) return reply(422, {error: 'invented_fact'})

  const ids = new Set(facts.map(f => f.file_id))
  return reply(200, {
    answer,
    file_ids: (out.file_ids ?? []).filter(id => ids.has(id)),
    follow_ups: (out.follow_ups ?? []).slice(0, 3).map(String),
  })
})
