// Row level security tests for 8-business-crm.sql, with the real consumer tables loaded
// (1, 3, 4, 6, 7, then 8). The main question: can a shop ever read a repair file that
// wasn't shared with it?
import {afterAll, beforeAll, describe, expect, it} from 'vitest'
import {openDb, openPglite, person, type Db, type Row} from './harness'

const A1 = person(11, 'owner-a@example.com') // owner of shop A (verified)
const AM = person(12, 'member-a@example.com') // member of shop A
const AG = person(13, 'guest-a@example.com') // guest of shop A
const B1 = person(14, 'owner-b@example.com') // owner of shop B (verified)
const U1 = person(15, 'owner-u@example.com') // owner of shop U (not verified)
const C = person(16, 'consumer-c@example.com') // a consumer with a repair file
const D = person(17, 'consumer-d@example.com') // another consumer
const ALL = [A1, AM, AG, B1, U1, C, D]

const FILES = ['1-schema.sql', '3-repair-proof.sql', '4-more-repairs.sql', '6-top-shops.sql', '7-business.sql', '8-business-crm.sql']

describe.skipIf(!openPglite)('8-business-crm.sql row level security', () => {
  let db: Db
  let as: Awaited<ReturnType<typeof openDb>>['as']
  let q: <T = Row>(text: string, params?: unknown[]) => Promise<T[]>
  let count: (text: string, params?: unknown[]) => Promise<number>
  let shopA: string, shopB: string, shopU: string
  let fileC: string, fileD: string
  const photo = () => `${C.id}/${fileC}/before.jpg`
  const estimate = () => `${C.id}/${fileC}/estimate.jpg`
  const receipt = () => `${C.id}/${fileC}/receipt.jpg`

  const newShop = async (who: typeof A1, name: string) =>
    as(who, async () => (await q<{id: string}>(`select public.create_shop($1, 'Bacolod', '{car}') as id`, [name]))[0].id)
  const stage = async (org: string, name: string) =>
    (await q<{id: string}>(`select id from public.pipeline_stages where org_id = $1 and name = $2`, [org, name]))[0].id

  beforeAll(async () => {
    ;({db, as, q, count} = await openDb(FILES, ALL))
    shopA = await newShop(A1, 'Shop A')
    shopB = await newShop(B1, 'Shop B')
    shopU = await newShop(U1, 'Shop U')
    await db.query(`update public.shop_orgs set verification_status = 'verified' where id in ($1, $2)`, [shopA, shopB])
    await db.query(`insert into public.shop_members (org_id, user_id, role) values ($1, $2, 'member'), ($1, $3, 'guest')`, [
      shopA,
      AM.id,
      AG.id,
    ])

    // C's repair file: a car, a slip, three attachments, and a visit. Made as the superuser.
    const [{id: vehicle}] = await q<{id: string}>(
      `insert into public.vehicle (user_id, kind, make_text, model_text, year_model, plate_no)
       values ($1, 'car', 'Toyota', 'Vios', '2019', 'ABC 1234') returning id`,
      [C.id],
    )
    ;[{id: fileC}] = await q<{id: string}>(
      `insert into public.repair_files (user_id, vehicle_id, shop_name, problem) values ($1, $2, 'Shop A', 'Engine light came back') returning id`,
      [C.id, vehicle],
    )
    ;[{id: fileD}] = await q<{id: string}>(
      `insert into public.repair_files (user_id, shop_name, problem) values ($1, 'Shop A', 'Aircon blows warm') returning id`,
      [D.id],
    )
    // No job slip yet: before photos on a slip are public to anyone with the slip link
    // (3-repair-proof.sql), which would hide what sharing adds. The contact test adds one.
    await db.query(`insert into public.visits (file_id, user_id, date_in, story, amount_paid) values ($1, $2, '2026-11-01', 'Private note', 1500)`, [
      fileC,
      C.id,
    ])
    for (const [kind, path] of [
      ['before_photo', photo()],
      ['estimate', estimate()],
      ['receipt', receipt()],
    ]) {
      await db.query(`insert into public.attachments (file_id, user_id, kind, storage_path) values ($1, $2, $3, $4)`, [
        fileC,
        C.id,
        kind,
        path,
      ])
      await db.query(`insert into storage.objects (bucket_id, name, owner) values ('repair-proof', $1, $2)`, [path, C.id])
    }
  }, 120_000)

  afterAll(async () => {
    await db?.close()
  })

  const consumerTables = ['repair_files', 'visits', 'attachments', 'job_slips', 'letters', 'vehicle']
  const shareWithA = (fields: string) =>
    as(C, async () =>
      (
        await q<{id: string}>(
          `insert into public.file_shares (file_id, org_id, fields, consent_version) values ($1, $2, $3, '2026-11-dpa-1') returning id`,
          [fileC, shopA, fields],
        )
      )[0].id,
    )

  it('gives every shop the seven default stages', async () => {
    const names = await as(A1, () => q<{name: string}>(`select name from public.pipeline_stages where org_id = $1 order by position`, [shopA]))
    expect(names.map(n => n.name)).toEqual(['New', 'Quoted', 'Scheduled', 'In the shop', 'Ready for pickup', 'Done', 'Lost'])
    expect(await as(B1, () => q(`select id from public.pipeline_stages where org_id = $1`, [shopA]))).toEqual([])
  })

  it('keeps every consumer table closed to shops before any share', async () => {
    for (const who of [A1, AM, AG, B1]) {
      for (const t of consumerTables) {
        expect(await as(who, () => q(`select * from public.${t}`)), `${who.email} on ${t}`).toEqual([])
      }
      expect(await as(who, () => q(`select name from storage.objects`))).toEqual([])
    }
  })

  describe('sharing', () => {
    it("refuses a share to an unverified shop, or of someone else's file", async () => {
      await expect(
        as(C, () =>
          q(`insert into public.file_shares (file_id, org_id, fields, consent_version) values ($1, $2, '{problem}', 'v1')`, [fileC, shopU]),
        ),
      ).rejects.toThrow(/row-level security/)
      await expect(
        as(C, () =>
          q(`insert into public.file_shares (file_id, org_id, fields, consent_version) values ($1, $2, '{problem}', 'v1')`, [fileD, shopA]),
        ),
      ).rejects.toThrow(/row-level security/)
      await expect(
        as(A1, () =>
          q(`insert into public.file_shares (file_id, org_id, fields, consent_version) values ($1, $2, '{problem}', 'v1')`, [fileC, shopA]),
        ),
      ).rejects.toThrow(/row-level security/)
    })

    it('needs the problem in every share', async () => {
      await expect(shareWithA('{photos}')).rejects.toThrow(/check constraint/)
    })

    let share: string
    it('creates one lead in New for the right shop', async () => {
      share = await shareWithA('{problem,photos}')
      const leads = await as(AM, () =>
        q<{title: string; source: string; stage_id: string; kind: string}>(`select title, source, stage_id, kind from public.leads`),
      )
      expect(leads).toEqual([{title: 'Engine light came back', source: 'share', stage_id: await stage(shopA, 'New'), kind: 'car'}])
      expect(await as(B1, () => q(`select id from public.leads`))).toEqual([])
      const [customer] = await as(AM, () => q(`select name, user_id, mobile, source from public.customers`))
      expect(customer).toEqual({name: 'Kumpooni customer', user_id: C.id, mobile: null, source: 'share'})
      const acts = await as(AM, () => q<{type: string}>(`select type from public.lead_activities`))
      expect(acts.map(a => a.type)).toEqual(['created'])
    })

    it('still keeps the consumer tables closed to the shop', async () => {
      for (const t of consumerTables) expect(await as(AM, () => q(`select * from public.${t}`)), t).toEqual([])
    })

    it('shows the shop only the ticked fields, through shared_file()', async () => {
      const [{f}] = await as(AM, () => q<{f: Row}>(`select public.shared_file($1) as f`, [share]))
      expect(f.problem).toBe('Engine light came back')
      expect(f.photos).toEqual([{path: photo(), caption: null}])
      for (const hidden of ['visits', 'contact', 'plate', 'slip', 'estimates', 'item']) expect(f).not.toHaveProperty(hidden)
      expect(await as(B1, () => q(`select public.shared_file($1) as f`, [share]))).toEqual([{f: null}])
      expect(await as(AG, () => q(`select public.shared_file($1) as f`, [share]))).toEqual([{f: null}])
      expect(await as(D, () => q(`select public.shared_file($1) as f`, [share]))).toEqual([{f: null}])
      const [{f: own}] = await as(C, () => q<{f: Row}>(`select public.shared_file($1) as f`, [share]))
      expect(own.problem).toBe('Engine light came back')
    })

    it('opens only the shared photo in storage, only for shop A members', async () => {
      expect(await as(AM, () => q(`select name from storage.objects`))).toEqual([{name: photo()}])
      expect(await as(AG, () => q(`select name from storage.objects`))).toEqual([])
      expect(await as(B1, () => q(`select name from storage.objects`))).toEqual([])
    })

    it("doesn't let the consumer change what was shared", async () => {
      await expect(
        as(C, () => q(`update public.file_shares set fields = '{problem,visits}' where id = $1`, [share])),
      ).rejects.toThrow(/share_locked/)
      expect(await as(AM, () => count(`update public.file_shares set revoked_at = now() where id = $1`, [share]))).toBe(0)
    })

    it('removes access at once when the consumer stops sharing', async () => {
      expect(await as(C, () => count(`update public.file_shares set revoked_at = now() where id = $1`, [share]))).toBe(1)
      expect(await as(AM, () => q(`select public.shared_file($1) as f`, [share]))).toEqual([{f: null}])
      expect(await as(AM, () => q(`select name from storage.objects`))).toEqual([])
      const acts = await as(AM, () => q<{type: string}>(`select type from public.lead_activities order by created_at`))
      expect(acts.map(a => a.type)).toContain('share_revoked')
      await expect(
        as(C, () => q(`update public.file_shares set revoked_at = null where id = $1`, [share])),
      ).rejects.toThrow(/share_locked/)
    })

    it('reads contact details live from a share, never copied', async () => {
      await db.query(
        `insert into public.job_slips (file_id, user_id, job_text, peso_cap, owner_name, owner_mobile) values ($1, $2, 'Check engine', 3000, 'Carla', '09171234567')`,
        [fileC, C.id],
      )
      const again = await shareWithA('{problem,contact,visits}')
      const [{f}] = await as(AM, () => q<{f: Record<string, Row[] & Row>}>(`select public.shared_file($1) as f`, [again]))
      expect(f.contact).toEqual({name: 'Carla', mobile: '09171234567'})
      expect((f.visits as unknown as Row[])[0]).toMatchObject({amount_paid: 1500, story: 'Private note'})
      expect(await as(AM, () => q(`select mobile from public.customers`))).toEqual([{mobile: null}])
      await as(C, () => q(`update public.file_shares set revoked_at = now() where id = $1`, [again]))
    })
  })

  describe('leads and the timeline', () => {
    let lead: string
    let customer: string

    beforeAll(async () => {
      await as(AM, async () => {
        ;[{id: customer}] = await q<{id: string}>(
          `insert into public.customers (org_id, name, mobile, consent_version) values ($1, 'Walk-in Ben', '0918', '2026-11-dpa-1') returning id`,
          [shopA],
        )
        ;[{id: lead}] = await q<{id: string}>(
          `insert into public.leads (org_id, customer_id, stage_id, title, kind) values ($1, $2, $3, 'Brake squeak', 'motorcycle') returning id`,
          [shopA, customer, await stage(shopA, 'New')],
        )
      })
    })

    it("refuses customers or leads that pretend to come from Kumpooni", async () => {
      await expect(
        as(AM, () =>
          q(`insert into public.customers (org_id, name, user_id, consent_version) values ($1, 'Fake', $2, 'v1')`, [shopA, D.id]),
        ),
      ).rejects.toThrow(/manual_only/)
      await expect(
        as(AM, () =>
          q(`insert into public.leads (org_id, customer_id, stage_id, title, source) values ($1, $2, $3, 'x', 'share')`, [
            shopA,
            customer,
            lead,
          ]),
        ),
      ).rejects.toThrow(/bad_stage|manual_only/)
    })

    it("refuses another shop's stage, or an assignee from outside the team", async () => {
      const stageB = await stage(shopB, 'New')
      await expect(as(AM, () => q(`update public.leads set stage_id = $1 where id = $2`, [stageB, lead]))).rejects.toThrow(/bad_stage/)
      await expect(as(AM, () => q(`update public.leads set assignee_id = $1 where id = $2`, [B1.id, lead]))).rejects.toThrow(/bad_assignee/)
    })

    it('logs stage, quote, and assignee changes, and closes the lead when Done', async () => {
      const quoted = await stage(shopA, 'Quoted')
      const done = await stage(shopA, 'Done')
      await as(AM, async () => {
        await q(`update public.leads set stage_id = $1 where id = $2`, [quoted, lead])
        await q(`update public.leads set quote_amount = 1800 where id = $1`, [lead])
        await q(`update public.leads set stage_id = $1 where id = $2`, [done, lead])
      })
      const acts = await as(AM, () =>
        q<{type: string; to_stage: string | null}>(`select type, to_stage from public.lead_activities where lead_id = $1 order by created_at, type`, [lead]),
      )
      expect(acts.filter(a => a.type === 'stage').map(a => a.to_stage)).toEqual([quoted, done])
      expect(acts.some(a => a.type === 'quote')).toBe(true)
      const [l] = await q<{closed_at: string | null}>(`select closed_at from public.leads where id = $1`, [lead])
      expect(l.closed_at).not.toBeNull()
    })

    it('takes notes, but never edits or deletes the timeline', async () => {
      await as(AM, () => q(`insert into public.lead_activities (lead_id, type, body) values ($1, 'note', 'Called back')`, [lead]))
      await expect(
        as(AM, () => q(`insert into public.lead_activities (lead_id, type) values ($1, 'stage')`, [lead])),
      ).rejects.toThrow(/notes_only|row-level security/)
      await expect(as(AM, () => q(`update public.lead_activities set body = 'x'`))).rejects.toThrow(/permission denied/)
      await expect(as(A1, () => q(`delete from public.lead_activities`))).rejects.toThrow(/permission denied/)
    })

    it('logs follow-ups', async () => {
      await as(AM, () =>
        q(`insert into public.follow_ups (lead_id, due_on, reason) values ($1, '2027-01-15', 'warranty_end')`, [lead]),
      )
      const [f] = await q<{org_id: string}>(`select org_id from public.follow_ups where lead_id = $1`, [lead])
      expect(f.org_id).toBe(shopA)
      const acts = await q<{body: string}>(`select body from public.lead_activities where lead_id = $1 and type = 'follow_up'`, [lead])
      expect(acts).toEqual([{body: '2027-01-15 (warranty)'}])
    })

    it('shows a guest only the leads assigned to them, read-only', async () => {
      expect(await as(AG, () => q(`select id from public.leads`))).toEqual([])
      expect(await as(AG, () => q(`select id from public.customers`))).toEqual([])
      await as(A1, () => q(`update public.leads set assignee_id = $1 where id = $2`, [AG.id, lead]))
      expect(await as(AG, () => q(`select id from public.leads`))).toEqual([{id: lead}])
      expect(await as(AG, () => q(`select id from public.customers`))).toEqual([{id: customer}])
      expect((await as(AG, () => q(`select id from public.follow_ups`))).length).toBe(1)
      expect((await as(AG, () => q(`select id from public.lead_activities`))).length).toBeGreaterThan(0)
      expect(await as(AG, () => count(`update public.leads set title = 'x' where id = $1`, [lead]))).toBe(0)
      await expect(
        as(AG, () => q(`insert into public.lead_activities (lead_id, type, body) values ($1, 'note', 'x')`, [lead])),
      ).rejects.toThrow(/row-level security/)
    })

    it('keeps shop B out of everything in shop A', async () => {
      const newA = await stage(shopA, 'New')
      await as(B1, async () => {
        for (const t of ['customers', 'leads', 'lead_activities', 'follow_ups', 'file_shares']) {
          expect(await q(`select * from public.${t}`), t).toEqual([])
        }
        expect(await count(`update public.leads set title = 'Taken' where id = $1`, [lead])).toBe(0)
        expect(await count(`delete from public.customers where id = $1`, [customer])).toBe(0)
        await expect(
          q(`insert into public.leads (org_id, customer_id, stage_id, title) values ($1, $2, $3, 'x')`, [shopA, customer, newA]),
        ).rejects.toThrow(/row-level security|bad_/)
      })
    })

    it('lets only owners and admins delete', async () => {
      expect(await as(AM, () => count(`delete from public.leads where id = $1`, [lead]))).toBe(0)
      expect(await as(A1, () => count(`delete from public.leads where id = $1`, [lead]))).toBe(1)
    })

    it('gives anon nothing', async () => {
      for (const t of ['customers', 'leads', 'file_shares', 'pipeline_stages']) {
        await expect(as(null, () => q(`select * from public.${t}`))).rejects.toThrow(/permission denied/)
      }
    })
  })
})
