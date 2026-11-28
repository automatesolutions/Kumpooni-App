// Row level security tests for 10-business-tasks.sql, 11-business-huddles.sql, and
// 12-business-clips.sql: who sees each task, who can join a call, and who can send a clip.
import {afterAll, beforeAll, describe, expect, it} from 'vitest'
import {openDb, openPglite, person, type Db, type Row} from './harness'

const A1 = person(31, 'owner-a@example.com') // owner of shop A
const AM = person(32, 'member-a@example.com') // member of shop A
const AG = person(33, 'guest-a@example.com') // guest of shop A
const A3 = person(34, 'member3-a@example.com')
const A4 = person(35, 'member4-a@example.com')
const B1 = person(36, 'owner-b@example.com') // owner of shop B
const ALL = [A1, AM, AG, A3, A4, B1]

const FILES = [
  '1-schema.sql',
  '3-repair-proof.sql',
  '4-more-repairs.sql',
  '6-top-shops.sql',
  '7-business.sql',
  '8-business-crm.sql',
  '9-business-chat.sql',
  '10-business-tasks.sql',
  '11-business-huddles.sql',
  '12-business-clips.sql',
]

describe.skipIf(!openPglite)('tasks, huddles, and clips row level security', () => {
  let db: Db
  let as: Awaited<ReturnType<typeof openDb>>['as']
  let q: <T = Row>(text: string, params?: unknown[]) => Promise<T[]>
  let count: (text: string, params?: unknown[]) => Promise<number>
  let shopA: string, shopB: string
  let generalA: string, generalB: string
  let leadA: string

  const newShop = async (who: typeof A1, name: string) =>
    as(
      who,
      async () => (await q<{id: string}>(`select public.create_shop($1, 'Bacolod', '{car}') as id`, [name]))[0].id,
    )
  const general = async (org: string) =>
    (await q<{id: string}>(`select id from public.chat_channels where org_id = $1 and name = 'general'`, [org]))[0].id
  const addTask = (who: typeof A1, org: string, title: string, extra: Record<string, unknown> = {}) =>
    as(who, async () => {
      const cols = ['org_id', 'title', ...Object.keys(extra)]
      const vals = [org, title, ...Object.values(extra)]
      return (
        await q<{id: string; created_by: string; done_at: string | null}>(
          `insert into public.shop_tasks (${cols.join(', ')}) values (${cols.map((_, i) => `$${i + 1}`).join(', ')}) returning id, created_by, done_at`,
          vals,
        )
      )[0]
    })
  const join = (who: typeof A1, channel: string) =>
    as(
      who,
      async () =>
        (await q<{huddle_id: string; others: string[]}>(`select * from public.join_huddle($1)`, [channel]))[0],
    )

  beforeAll(async () => {
    ;({db, as, q, count} = await openDb(FILES, ALL))
    shopA = await newShop(A1, 'Shop A')
    shopB = await newShop(B1, 'Shop B')
    await db.query(
      `insert into public.shop_members (org_id, user_id, role) values ($1, $2, 'member'), ($1, $3, 'guest'), ($1, $4, 'member'), ($1, $5, 'member')`,
      [shopA, AM.id, AG.id, A3.id, A4.id],
    )
    generalA = await general(shopA)
    generalB = await general(shopB)
    const [{id: stage}] = await q<{id: string}>(
      `select id from public.pipeline_stages where org_id = $1 order by position limit 1`,
      [shopA],
    )
    const [{id: customer}] = await q<{id: string}>(
      `insert into public.customers (org_id, name, source, consent_version) values ($1, 'Ana', 'manual', 'test') returning id`,
      [shopA],
    )
    ;[{id: leadA}] = await q<{id: string}>(
      `insert into public.leads (org_id, customer_id, stage_id, title) values ($1, $2, $3, 'Brake job') returning id`,
      [shopA, customer, stage],
    )
  }, 120_000)

  afterAll(async () => {
    await db?.close()
  })

  // ---------- Tasks ----------

  it('lets members add tasks and writes the maker from the session', async () => {
    const t = await addTask(AM, shopA, 'Order brake pads', {created_by: A1.id, lead_id: leadA})
    expect(t.created_by).toBe(AM.id)
    await expect(addTask(AG, shopA, 'Guest task')).rejects.toThrow(/row-level security/)
    await expect(addTask(B1, shopA, 'Other shop')).rejects.toThrow(/row-level security/)
  })

  it('shows guests only the tasks given to them', async () => {
    const mine = await addTask(A1, shopA, 'Test drive', {assignee_id: AG.id})
    await addTask(A1, shopA, 'Clean the bay')
    const seen = await as(AG, () => q<{id: string}>(`select id from public.shop_tasks where org_id = $1`, [shopA]))
    expect(seen.map(r => r.id)).toEqual([mine.id])
    expect(await as(B1, () => q(`select * from public.shop_tasks where org_id = $1`, [shopA]))).toHaveLength(0)
  })

  it('lets a guest move their task but not change it', async () => {
    const t = await addTask(A1, shopA, 'Check tires', {assignee_id: AG.id})
    await as(AG, () => q(`update public.shop_tasks set status = 'done' where id = $1`, [t.id]))
    const [row] = await q<{status: string; done_at: string | null}>(
      `select status, done_at from public.shop_tasks where id = $1`,
      [t.id],
    )
    expect(row.status).toBe('done')
    expect(row.done_at).not.toBeNull()
    await expect(
      as(AG, () => q(`update public.shop_tasks set title = 'Renamed' where id = $1`, [t.id])),
    ).rejects.toThrow(/guest_status_only/)
    await expect(
      as(AG, () => q(`update public.shop_tasks set assignee_id = $2 where id = $1`, [t.id, AM.id])),
    ).rejects.toThrow(/guest_status_only/)
  })

  it("won't give a task to someone outside the shop or link another shop's lead", async () => {
    await expect(addTask(A1, shopA, 'Wrong person', {assignee_id: B1.id})).rejects.toThrow(/not_in_shop/)
    const [{id: stageB}] = await q<{id: string}>(`select id from public.pipeline_stages where org_id = $1 limit 1`, [
      shopB,
    ])
    const [{id: custB}] = await q<{id: string}>(
      `insert into public.customers (org_id, name, source, consent_version) values ($1, 'Ben', 'manual', 'test') returning id`,
      [shopB],
    )
    const [{id: leadB}] = await q<{id: string}>(
      `insert into public.leads (org_id, customer_id, stage_id, title) values ($1, $2, $3, 'B job') returning id`,
      [shopB, custB, stageB],
    )
    await expect(addTask(A1, shopA, 'Wrong lead', {lead_id: leadB})).rejects.toThrow(/bad_lead/)
  })

  it('lets only admins and the maker delete a task', async () => {
    const t = await addTask(AM, shopA, 'Call supplier')
    expect(await as(A3, () => count(`delete from public.shop_tasks where id = $1`, [t.id]))).toBe(0)
    expect(await as(AM, () => count(`delete from public.shop_tasks where id = $1`, [t.id]))).toBe(1)
    const u = await addTask(AM, shopA, 'Sweep')
    expect(await as(A1, () => count(`delete from public.shop_tasks where id = $1`, [u.id]))).toBe(1)
  })

  // ---------- Huddles ----------

  it('starts one call per channel and tells newcomers who is already in it', async () => {
    const first = await join(A1, generalA)
    expect(first.others).toEqual([])
    const second = await join(AM, generalA)
    expect(second.huddle_id).toBe(first.huddle_id)
    expect(second.others).toEqual([A1.id])
    const live = await as(A3, () => q<{people: string[]}>(`select * from public.shop_huddles($1)`, [shopA]))
    expect(live).toHaveLength(1)
    expect(live[0].people).toEqual([A1.id, AM.id])
  })

  it('keeps people who cannot read the channel out of the call', async () => {
    await expect(join(AG, generalA)).rejects.toThrow(/not_allowed/)
    await expect(join(B1, generalA)).rejects.toThrow(/not_allowed/)
    expect(await as(B1, () => q(`select * from public.shop_huddles($1)`, [shopA]))).toHaveLength(0)
    expect(await as(B1, () => q(`select * from public.huddle_people`))).toHaveLength(0)
  })

  it('passes setup messages only between people in the call', async () => {
    const {huddle_id} = await join(A1, generalA)
    await as(AM, () =>
      q(
        `insert into public.huddle_signals (huddle_id, to_user, kind, payload) values ($1, $2, 'offer', '{"sdp":"x"}')`,
        [huddle_id, A1.id],
      ),
    )
    expect(await as(A1, () => q(`select * from public.huddle_signals where to_user = $1`, [A1.id]))).toHaveLength(1)
    expect(await as(A3, () => q(`select * from public.huddle_signals`))).toHaveLength(0)
    // Someone not in the call can't send one, even in the same shop.
    await expect(
      as(A3, () =>
        q(`insert into public.huddle_signals (huddle_id, to_user, kind, payload) values ($1, $2, 'offer', '{}')`, [
          huddle_id,
          A1.id,
        ]),
      ),
    ).rejects.toThrow(/not_in_huddle/)
    await expect(
      as(B1, () =>
        q(`insert into public.huddle_signals (huddle_id, to_user, kind, payload) values ($1, $2, 'offer', '{}')`, [
          huddle_id,
          A1.id,
        ]),
      ),
    ).rejects.toThrow()
  })

  it('has room for 4 people', async () => {
    await join(A3, generalA)
    await join(A4, generalA)
    const [{id: extra}] = await q<{id: string}>(
      `insert into auth.users (id, email) values ('00000000-0000-4000-8000-000000000099', 'fifth@example.com') returning id`,
    )
    await db.query(`insert into public.shop_members (org_id, user_id, role) values ($1, $2, 'member')`, [shopA, extra])
    await expect(join({id: extra, email: 'fifth@example.com'}, generalA)).rejects.toThrow(/huddle_full/)
  })

  it('ends the call when the last person leaves, and drops people who stop checking in', async () => {
    const {huddle_id} = await join(A1, generalA)
    // Everyone else went quiet a minute ago.
    await db.query(
      `update public.huddle_people set seen_at = now() - interval '1 minute' where huddle_id = $1 and user_id <> $2`,
      [huddle_id, A1.id],
    )
    const live = await as(AM, () => q<{people: string[]}>(`select * from public.shop_huddles($1)`, [shopA]))
    expect(live[0].people).toEqual([A1.id])
    expect(await as(AM, () => q<{ok: boolean}>(`select public.huddle_ping($1) as ok`, [huddle_id]))).toEqual([
      {ok: true},
    ])
    for (const who of [A1, AM, A3, A4]) await as(who, () => q(`select public.leave_huddle($1)`, [huddle_id]))
    const [{ended_at}] = await q<{ended_at: string | null}>(`select ended_at from public.huddles where id = $1`, [
      huddle_id,
    ])
    expect(ended_at).not.toBeNull()
    expect(await as(A1, () => q(`select * from public.shop_huddles($1)`, [shopA]))).toHaveLength(0)
  })

  // ---------- Clips ----------

  it('reserves a clip path in the channel and checks the storage cap', async () => {
    const [{path}] = await as(AM, () =>
      q<{path: string}>(`select public.reserve_clip($1, 5000000, 90, 'webm') as path`, [generalA]),
    )
    expect(path.startsWith(`${shopA}/${generalA}/`)).toBe(true)
    expect(path.endsWith('.webm')).toBe(true)
    await expect(as(AM, () => q(`select public.reserve_clip($1, 1000, 121, 'webm')`, [generalA]))).rejects.toThrow(
      /clip_too_long/,
    )
    await expect(as(AG, () => q(`select public.reserve_clip($1, 1000, 10, 'webm')`, [generalA]))).rejects.toThrow(
      /not_allowed/,
    )
    await db.query(`update public.business_settings set clip_cap_mb = 10`)
    await expect(as(AM, () => q(`select public.reserve_clip($1, 6000000, 60, 'webm')`, [generalA]))).rejects.toThrow(
      /clip_storage_full/,
    )
    const [usage] = await as(AG, () =>
      q<{used_bytes: string; clips: number}>(`select * from public.shop_clip_usage($1)`, [shopA]),
    )
    expect(Number(usage.used_bytes)).toBe(5000000)
    expect(await as(B1, () => q(`select * from public.shop_clip_usage($1)`, [shopA]))).toHaveLength(0)
    await db.query(`update public.business_settings set clip_cap_mb = 300`)
  })

  it('lets only the person who reserved a clip upload it, and only channel readers watch it', async () => {
    const [{path}] = await as(AM, () =>
      q<{path: string}>(`select public.reserve_clip($1, 1000000, 30, 'webm') as path`, [generalA]),
    )
    await expect(
      as(A1, () =>
        q(`insert into storage.objects (bucket_id, name, owner) values ('shop-clips', $1, $2)`, [path, A1.id]),
      ),
    ).rejects.toThrow(/row-level security/)
    expect(
      await as(AM, () =>
        count(`insert into storage.objects (bucket_id, name, owner) values ('shop-clips', $1, $2)`, [path, AM.id]),
      ),
    ).toBe(1)
    // A path nobody reserved.
    await expect(
      as(AM, () =>
        q(`insert into storage.objects (bucket_id, name, owner) values ('shop-clips', $1, $2)`, [
          `${shopA}/${generalA}/free.webm`,
          AM.id,
        ]),
      ),
    ).rejects.toThrow(/row-level security/)
    expect(await as(A3, () => q(`select name from storage.objects where name = $1`, [path]))).toHaveLength(1)
    expect(await as(AG, () => q(`select name from storage.objects where name = $1`, [path]))).toHaveLength(0)
    expect(await as(B1, () => q(`select name from storage.objects where name = $1`, [path]))).toHaveLength(0)

    // The message must point at a clip reserved in the same channel.
    await as(AM, () =>
      q(`insert into public.chat_messages (channel_id, attachment_path, attachment_kind) values ($1, $2, 'clip')`, [
        generalA,
        path,
      ]),
    )
    await expect(
      as(B1, () =>
        q(`insert into public.chat_messages (channel_id, attachment_path, attachment_kind) values ($1, $2, 'clip')`, [
          generalB,
          `${shopB}/${generalB}/nothing.webm`,
        ]),
      ),
    ).rejects.toThrow(/bad_attachment/)
  })

  it('frees the space when the message with the clip is deleted', async () => {
    const [{path}] = await as(A3, () =>
      q<{path: string}>(`select public.reserve_clip($1, 2000000, 20, 'mp4') as path`, [generalA]),
    )
    const [{id}] = await as(A3, () =>
      q<{id: string}>(
        `insert into public.chat_messages (channel_id, attachment_path, attachment_kind) values ($1, $2, 'clip') returning id`,
        [generalA, path],
      ),
    )
    // Another member can't delete the file.
    expect(await as(AM, () => count(`delete from storage.objects where name = $1`, [path]))).toBe(0)
    await as(A1, () => q(`update public.chat_messages set deleted_at = now() where id = $1`, [id]))
    expect(await q(`select * from public.chat_clips where path = $1`, [path])).toHaveLength(0)
  })
})
