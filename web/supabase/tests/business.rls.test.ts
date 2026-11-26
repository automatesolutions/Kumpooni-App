// Row level security tests for 7-business.sql, run in PGlite (Postgres in WebAssembly).
// Nothing here touches a Supabase project. Each person is a row in a stub auth.users table,
// and each query runs as the `authenticated` role with that person's JWT claims.
//
// If @electric-sql/pglite isn't installed, these tests are skipped and say so.
import {afterAll, beforeAll, describe, expect, it} from 'vitest'
import {openDb, openPglite, person, type Db, type Person, type Row} from './harness'

const A1 = person(1, 'owner-a@example.com') // owner of shop A
const AD = person(2, 'admin-a@example.com') // admin of shop A
const A2 = person(3, 'member-a@example.com') // member of shop A
const AG = person(4, 'guest-a@example.com') // guest of shop A
const B1 = person(5, 'owner-b@example.com') // owner of shop B
const X = person(6, 'staff@example.com', true) // Kumpooni admin
const NEW = person(7, 'new@example.com') // invited later
const ALL = [A1, AD, A2, AG, B1, X, NEW]

const PLACE_A = 'ChIJ_place_a_0000000001'
const PLACE_B = 'ChIJ_place_b_0000000002'

describe.skipIf(!openPglite)('7-business.sql row level security', () => {
  let db: Db
  let shopA: string
  let shopB: string

  let as: Awaited<ReturnType<typeof openDb>>['as']
  let q: <T = Row>(text: string, params?: unknown[]) => Promise<T[]>
  let count: (text: string, params?: unknown[]) => Promise<number>

  beforeAll(async () => {
    ;({db, as, q, count} = await openDb(['7-business.sql'], ALL))
    shopA = await as(A1, async () =>
      (await q<{id: string}>(`select public.create_shop('Shop A', 'Bacolod', '{car}', $1) as id`, [PLACE_A]))[0].id,
    )
    shopB = await as(B1, async () =>
      (await q<{id: string}>(`select public.create_shop('Shop B', 'Iloilo', '{aircon}', $1) as id`, [PLACE_B]))[0].id,
    )
    // Team for shop A, set up directly as the superuser.
    for (const [p, role] of [
      [AD, 'admin'],
      [A2, 'member'],
      [AG, 'guest'],
    ] as const) {
      await db.query(`insert into public.shop_members (org_id, user_id, role) values ($1, $2, $3)`, [shopA, p.id, role])
    }
  }, 60_000)

  afterAll(async () => {
    await db?.close()
  })

  describe('shops', () => {
    it('makes the creator the owner, unverified', async () => {
      const rows = await q(`select role from public.shop_members where org_id = $1 and user_id = $2`, [shopA, A1.id])
      expect(rows).toEqual([{role: 'owner'}])
      const [org] = await q(`select verification_status, created_by from public.shop_orgs where id = $1`, [shopA])
      expect(org).toEqual({verification_status: 'unverified', created_by: A1.id})
    })

    it('lets each person see only their own shops', async () => {
      expect(await as(A1, () => q(`select id from public.shop_orgs`))).toEqual([{id: shopA}])
      expect(await as(B1, () => q(`select id from public.shop_orgs`))).toEqual([{id: shopB}])
      expect(await as(AG, () => q(`select id from public.shop_orgs`))).toEqual([{id: shopA}])
      expect(await as(NEW, () => q(`select id from public.shop_orgs`))).toEqual([])
    })

    it("stops shop B's owner from reading or changing shop A", async () => {
      await as(B1, async () => {
        expect(await q(`select * from public.shop_members where org_id = $1`, [shopA])).toEqual([])
        expect(await q(`select id from public.shop_invites where org_id = $1`, [shopA])).toEqual([])
        expect(await q(`select id from public.shop_claims where org_id = $1`, [shopA])).toEqual([])
        expect(await count(`update public.shop_orgs set name = 'Taken' where id = $1`, [shopA])).toBe(0)
        expect(await count(`delete from public.shop_orgs where id = $1`, [shopA])).toBe(0)
        expect(await count(`delete from public.shop_members where org_id = $1`, [shopA])).toBe(0)
        expect(await q(`select * from public.shop_member_list($1)`, [shopA])).toEqual([])
      })
      expect(await q(`select name from public.shop_orgs where id = $1`, [shopA])).toEqual([{name: 'Shop A'}])
    })

    it('gives anon nothing', async () => {
      await expect(as(null, () => q(`select id from public.shop_orgs`))).rejects.toThrow(/permission denied/)
      await expect(as(null, () => q(`select org_id from public.shop_members`))).rejects.toThrow(/permission denied/)
      await expect(as(null, () => q(`select public.create_shop('X', null, '{car}')`))).rejects.toThrow(
        /permission denied/,
      )
    })

    it("doesn't let a shop verify itself", async () => {
      await expect(
        as(A1, () => q(`update public.shop_orgs set verification_status = 'verified' where id = $1`, [shopA])),
      ).rejects.toThrow(/verification_locked/)
    })

    it("doesn't let a member or guest edit the shop", async () => {
      expect(await as(A2, () => count(`update public.shop_orgs set name = 'Mine' where id = $1`, [shopA]))).toBe(0)
      expect(await as(AG, () => count(`update public.shop_orgs set name = 'Mine' where id = $1`, [shopA]))).toBe(0)
      expect(await as(AD, () => count(`update public.shop_orgs set city = 'Talisay' where id = $1`, [shopA]))).toBe(1)
    })

    it('refuses sample places and a second shop on the same place', async () => {
      await expect(as(NEW, () => q(`select public.create_shop('Copy', null, '{car}', $1)`, [PLACE_A]))).rejects.toThrow(
        /place_taken/,
      )
      await expect(
        as(NEW, () => q(`select public.create_shop('Fake', null, '{car}', 'sample-car-123456')`)),
      ).rejects.toThrow(/check constraint/)
      await expect(as(NEW, () => q(`select public.create_shop('Bad', null, '{spaceship}')`))).rejects.toThrow(
        /check constraint/,
      )
    })
  })

  describe('team roles', () => {
    it('blocks adding members directly', async () => {
      await expect(
        as(A1, () => q(`insert into public.shop_members (org_id, user_id, role) values ($1, $2, 'member')`, [shopA, NEW.id])),
      ).rejects.toThrow(/permission denied/)
    })

    it('lets only owners and admins invite', async () => {
      const invite = (who: Person) =>
        as(who, () => q(`select public.create_shop_invite($1, 'someone@example.com', 'member')`, [shopA]))
      await expect(invite(A2)).rejects.toThrow(/not_allowed/)
      await expect(invite(AG)).rejects.toThrow(/not_allowed/)
      await expect(invite(B1)).rejects.toThrow(/not_allowed/)
      await expect(invite(AD)).resolves.toHaveLength(1)
      await expect(
        as(A1, () => q(`select public.create_shop_invite($1, 'x@example.com', 'owner')`, [shopA])),
      ).rejects.toThrow(/bad_role/)
    })

    it('hides invites from members and keeps token hashes private', async () => {
      expect(await as(A2, () => q(`select id from public.shop_invites`))).toEqual([])
      await expect(as(A1, () => q(`select token_hash from public.shop_invites`))).rejects.toThrow(/permission denied/)
    })

    it("doesn't let a member change roles", async () => {
      expect(
        await as(A2, () => count(`update public.shop_members set role = 'admin' where org_id = $1 and user_id = $2`, [shopA, A2.id])),
      ).toBe(0)
      expect(
        await as(A2, () => count(`delete from public.shop_members where org_id = $1 and user_id = $2`, [shopA, AG.id])),
      ).toBe(0)
    })

    it('lets an admin change roles, but never to or from owner', async () => {
      await as(AD, async () => {
        expect(
          await count(`update public.shop_members set role = 'member' where org_id = $1 and user_id = $2`, [shopA, AG.id]),
        ).toBe(1)
        await expect(
          q(`update public.shop_members set role = 'owner' where org_id = $1 and user_id = $2`, [shopA, A2.id]),
        ).rejects.toThrow(/owner_not_granted/)
        await expect(
          q(`update public.shop_members set role = 'member' where org_id = $1 and user_id = $2`, [shopA, A1.id]),
        ).rejects.toThrow(/owner_locked/)
        await expect(
          q(`delete from public.shop_members where org_id = $1 and user_id = $2`, [shopA, A1.id]),
        ).rejects.toThrow(/owner_locked/)
      })
      await db.query(`update public.shop_members set role = 'guest' where org_id = $1 and user_id = $2`, [shopA, AG.id])
    })

    it('keeps the last owner', async () => {
      await expect(
        as(A1, () => q(`delete from public.shop_members where org_id = $1 and user_id = $2`, [shopA, A1.id])),
      ).rejects.toThrow(/last_owner/)
    })

    it('shows the team to members, not guests', async () => {
      const members = await as(A2, () => q<{email: string}>(`select email from public.shop_member_list($1)`, [shopA]))
      expect(members.map(m => m.email)).toEqual([A1.email, AD.email, A2.email, AG.email])
      expect(await as(AG, () => q(`select * from public.shop_member_list($1)`, [shopA]))).toEqual([])
    })
  })

  describe('invites', () => {
    let token: string

    beforeAll(async () => {
      token = await as(A1, async () =>
        (await q<{t: string}>(`select public.create_shop_invite($1, 'NEW@example.com', 'member') as t`, [shopA]))[0].t,
      )
    })

    it('refuses someone signed in with another email', async () => {
      await expect(as(B1, () => q(`select public.accept_shop_invite($1)`, [token]))).rejects.toThrow(/invite_wrong_email/)
    })

    it('refuses an unconfirmed email', async () => {
      await db.query(`update auth.users set email_confirmed_at = null where id = $1`, [NEW.id])
      await expect(as(NEW, () => q(`select public.accept_shop_invite($1)`, [token]))).rejects.toThrow(/invite_wrong_email/)
      await db.query(`update auth.users set email_confirmed_at = now() where id = $1`, [NEW.id])
    })

    it('adds the invited person once, and the link stops working', async () => {
      const [{org}] = await as(NEW, () => q<{org: string}>(`select public.accept_shop_invite($1) as org`, [token]))
      expect(org).toBe(shopA)
      expect(await q(`select role from public.shop_members where org_id = $1 and user_id = $2`, [shopA, NEW.id])).toEqual([
        {role: 'member'},
      ])
      await expect(as(NEW, () => q(`select public.accept_shop_invite($1)`, [token]))).rejects.toThrow(/invite_not_found/)
    })

    it('refuses an expired invite', async () => {
      const t = await as(A1, async () =>
        (await q<{t: string}>(`select public.create_shop_invite($1, $2, 'guest') as t`, [shopA, B1.email]))[0].t,
      )
      await db.query(`update public.shop_invites set expires_at = now() - interval '1 minute' where email = $1`, [B1.email])
      await expect(as(B1, () => q(`select public.accept_shop_invite($1)`, [t]))).rejects.toThrow(/invite_expired/)
    })

    it('lets a member leave', async () => {
      expect(
        await as(NEW, () => count(`delete from public.shop_members where org_id = $1 and user_id = $2`, [shopA, NEW.id])),
      ).toBe(1)
    })
  })

  describe('claims', () => {
    const setSample = (on: boolean) => db.query(`update public.business_settings set claim_codes_sample = $1`, [on])

    it('refuses live codes until sending is turned on', async () => {
      await setSample(false)
      await expect(as(A1, () => q(`select public.request_shop_claim($1, 'phone_code')`, [shopA]))).rejects.toThrow(
        /live_codes_off/,
      )
    })

    it('lets only owners and admins claim', async () => {
      await expect(as(A2, () => q(`select public.request_shop_claim($1, 'manual')`, [shopA]))).rejects.toThrow(/not_allowed/)
      await expect(as(B1, () => q(`select public.request_shop_claim($1, 'manual')`, [shopA]))).rejects.toThrow(/not_allowed/)
    })

    it('verifies with a sample code, counting wrong tries', async () => {
      await setSample(true)
      const [{r}] = await as(A1, () =>
        q<{r: {claim_id: string; sample_code: string}}>(`select public.request_shop_claim($1, 'phone_code') as r`, [shopA]),
      )
      expect(r.sample_code).toMatch(/^\d{6}$/)
      const wrong = r.sample_code === '000000' ? '111111' : '000000'
      await as(A1, async () => {
        expect(await q(`select public.verify_claim_code($1, $2) as v`, [r.claim_id, wrong])).toEqual([{v: 'wrong_code'}])
        await expect(q(`select code_hash from public.shop_claims`)).rejects.toThrow(/permission denied/)
      })
      // B can't verify A's claim even with the right code.
      await expect(as(B1, () => q(`select public.verify_claim_code($1, $2)`, [r.claim_id, r.sample_code]))).rejects.toThrow(
        /not_allowed/,
      )
      expect(await as(A1, () => q(`select public.verify_claim_code($1, $2) as v`, [r.claim_id, r.sample_code]))).toEqual([
        {v: 'approved'},
      ])
      const [org] = await q(`select verification_status, verified_method from public.shop_orgs where id = $1`, [shopA])
      expect(org).toEqual({verification_status: 'verified', verified_method: 'sample_code'})
      await setSample(false)
    })

    it('stops after five wrong codes', async () => {
      await setSample(true)
      const [{r}] = await as(B1, () =>
        q<{r: {claim_id: string; sample_code: string}}>(`select public.request_shop_claim($1, 'email_code') as r`, [shopB]),
      )
      const wrong = r.sample_code === '000000' ? '111111' : '000000'
      await as(B1, async () => {
        for (let i = 0; i < 5; i++) await q(`select public.verify_claim_code($1, $2)`, [r.claim_id, wrong])
        expect(await q(`select public.verify_claim_code($1, $2) as v`, [r.claim_id, r.sample_code])).toEqual([
          {v: 'too_many'},
        ])
        await q(`select public.cancel_shop_claim($1)`, [r.claim_id])
      })
      await setSample(false)
    })

    it("can't hold two open claims on one place", async () => {
      await db.query(
        `insert into public.shop_claims (org_id, place_id, method, status) values ($1, 'ChIJ_dupe_00000000003', 'manual', 'pending')`,
        [shopB],
      )
      await expect(
        db.query(
          `insert into public.shop_claims (org_id, place_id, method, status) values ($1, 'ChIJ_dupe_00000000003', 'manual', 'pending')`,
          [shopA],
        ),
      ).rejects.toThrow(/duplicate key/)
      await db.query(`delete from public.shop_claims where place_id = 'ChIJ_dupe_00000000003'`)
    })

    it('sends a disputed place to review, and only staff approve it', async () => {
      const shopC = await as(NEW, async () =>
        (await q<{id: string}>(`select public.create_shop('Shop C', 'Bacolod', '{car}') as id`))[0].id,
      )
      await expect(
        as(NEW, () => q(`select public.request_shop_claim($1, 'phone_code', null, null, null, $2)`, [shopC, PLACE_A])),
      ).rejects.toThrow(/dispute_needs_review|needs_place/)
      const [{r}] = await as(NEW, () =>
        q<{r: {claim_id: string}}>(
          `select public.request_shop_claim($1, 'dti_bn', '1234567', null, 'This is my shop', $2) as r`,
          [shopC, PLACE_A],
        ),
      )
      await expect(as(NEW, () => q(`select public.review_shop_claim($1, true)`, [r.claim_id]))).rejects.toThrow(
        /not_allowed/,
      )
      const queue = await as(X, () => q<{disputed_place_id: string}>(`select disputed_place_id from public.shop_claims where status = 'pending'`))
      expect(queue).toEqual([{disputed_place_id: PLACE_A}])
      await as(X, () => q(`select public.review_shop_claim($1, false, 'Shop A already verified this place')`, [r.claim_id]))
      expect(await q(`select verification_status from public.shop_orgs where id = $1`, [shopC])).toEqual([
        {verification_status: 'rejected'},
      ])
    })
  })

  describe('claim documents in storage', () => {
    it('lets only the shop and staff read its documents', async () => {
      await as(A1, () => q(`insert into storage.objects (bucket_id, name) values ('shop-claims', $1)`, [`${shopA}/dti.pdf`]))
      await expect(
        as(B1, () => q(`insert into storage.objects (bucket_id, name) values ('shop-claims', $1)`, [`${shopA}/fake.pdf`])),
      ).rejects.toThrow(/row-level security/)
      await expect(
        as(A1, () => q(`insert into storage.objects (bucket_id, name) values ('shop-claims', 'not-a-uuid/x.pdf')`)),
      ).rejects.toThrow(/row-level security/)
      expect(await as(B1, () => q(`select name from storage.objects`))).toEqual([])
      expect(await as(A2, () => q(`select name from storage.objects`))).toEqual([])
      expect(await as(X, () => q(`select name from storage.objects`))).toEqual([{name: `${shopA}/dti.pdf`}])
    })
  })

  describe('deleting a shop', () => {
    it('lets the owner delete it, members and all', async () => {
      const shopD = await as(B1, async () =>
        (await q<{id: string}>(`select public.create_shop('Shop D', null, '{phone}') as id`))[0].id,
      )
      expect(await as(B1, () => count(`delete from public.shop_orgs where id = $1`, [shopD]))).toBe(1)
      expect(await q(`select * from public.shop_members where org_id = $1`, [shopD])).toEqual([])
    })
  })
})
