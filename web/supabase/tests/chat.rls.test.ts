// Row level security tests for 9-business-chat.sql. The main questions: can anyone read a
// channel they shouldn't, and does a guest see only what they were given?
import {afterAll, beforeAll, describe, expect, it} from 'vitest'
import {openDb, openPglite, person, type Db, type Row} from './harness'

const A1 = person(21, 'owner-a@example.com') // owner of shop A
const AM = person(22, 'member-a@example.com') // member of shop A
const AG = person(23, 'guest-a@example.com') // guest of shop A
const AX = person(24, 'leaver-a@example.com') // member of shop A who leaves
const B1 = person(25, 'owner-b@example.com') // owner of shop B
const ALL = [A1, AM, AG, AX, B1]

const FILES = [
  '1-schema.sql',
  '3-repair-proof.sql',
  '4-more-repairs.sql',
  '6-top-shops.sql',
  '7-business.sql',
  '8-business-crm.sql',
  '9-business-chat.sql',
]

describe.skipIf(!openPglite)('9-business-chat.sql row level security', () => {
  let db: Db
  let as: Awaited<ReturnType<typeof openDb>>['as']
  let q: <T = Row>(text: string, params?: unknown[]) => Promise<T[]>
  let count: (text: string, params?: unknown[]) => Promise<number>
  let shopA: string, shopB: string
  let generalA: string, generalB: string
  let leadForGuest: string, leadOther: string

  const newShop = async (who: typeof A1, name: string) =>
    as(who, async () => (await q<{id: string}>(`select public.create_shop($1, 'Bacolod', '{car}') as id`, [name]))[0].id)
  const general = async (org: string) =>
    (await q<{id: string}>(`select id from public.chat_channels where org_id = $1 and name = 'general'`, [org]))[0].id
  const send = (who: typeof A1, channel: string, body: string) =>
    as(who, async () =>
      (await q<{id: string; author_id: string}>(
        `insert into public.chat_messages (channel_id, body) values ($1, $2) returning id, author_id`,
        [channel, body],
      ))[0],
    )
  const visibleChannels = (who: typeof A1, org: string) =>
    as(who, async () => (await q<{id: string}>(`select id from public.my_chat_channels($1)`, [org])).map(r => r.id))

  beforeAll(async () => {
    ;({db, as, q, count} = await openDb(FILES, ALL))
    shopA = await newShop(A1, 'Shop A')
    shopB = await newShop(B1, 'Shop B')
    await db.query(
      `insert into public.shop_members (org_id, user_id, role) values ($1, $2, 'member'), ($1, $3, 'guest'), ($1, $4, 'member')`,
      [shopA, AM.id, AG.id, AX.id],
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
    ;[{id: leadForGuest}] = await q<{id: string}>(
      `insert into public.leads (org_id, customer_id, stage_id, title, assignee_id) values ($1, $2, $3, 'Brake job', $4) returning id`,
      [shopA, customer, stage, AG.id],
    )
    ;[{id: leadOther}] = await q<{id: string}>(
      `insert into public.leads (org_id, customer_id, stage_id, title) values ($1, $2, $3, 'Oil change') returning id`,
      [shopA, customer, stage],
    )
  }, 120_000)

  afterAll(async () => {
    await db?.close()
  })

  it('gives every shop #general, seen by members and up', async () => {
    expect(generalA).toBeTruthy()
    expect(await visibleChannels(A1, shopA)).toContain(generalA)
    expect(await visibleChannels(AM, shopA)).toContain(generalA)
  })

  it('keeps guests and other shops out of public channels', async () => {
    await send(AM, generalA, 'Parts arrive at 3')
    expect(await visibleChannels(AG, shopA)).not.toContain(generalA)
    expect(await as(AG, () => q(`select * from public.chat_messages where channel_id = $1`, [generalA]))).toHaveLength(0)
    expect(await as(B1, () => q(`select * from public.chat_messages where channel_id = $1`, [generalA]))).toHaveLength(0)
    expect(await visibleChannels(B1, shopA)).toHaveLength(0)
  })

  it("doesn't let anyone post in another shop's channel", async () => {
    await expect(send(B1, generalA, 'Hello')).rejects.toThrow(/row-level security/)
    await expect(send(AG, generalA, 'Hello')).rejects.toThrow(/row-level security/)
  })

  it('writes the author from the session, not the browser', async () => {
    const row = await as(AM, async () =>
      (await q<{author_id: string}>(
        `insert into public.chat_messages (channel_id, body, author_id) values ($1, 'Done', $2) returning author_id`,
        [generalA, A1.id],
      ))[0],
    )
    expect(row.author_id).toBe(AM.id)
  })

  it('makes channels only through the function, and only for owners and admins', async () => {
    await expect(
      as(A1, () => q(`insert into public.chat_channels (org_id, kind, name) values ($1, 'channel', 'sneaky')`, [shopA])),
    ).rejects.toThrow()
    await expect(
      as(AM, () => q(`select public.create_chat_channel($1, 'Parts', null, false, null)`, [shopA])),
    ).rejects.toThrow(/not_allowed/)
    await expect(
      as(AG, () => q(`select public.create_chat_channel($1, 'Parts', null, false, null)`, [shopA])),
    ).rejects.toThrow(/not_allowed/)
    const [{id}] = await as(A1, () => q<{id: string}>(`select public.create_chat_channel($1, 'Parts Orders', null, false, null) as id`, [shopA]))
    const [{name}] = await q<{name: string}>(`select name from public.chat_channels where id = $1`, [id])
    expect(name).toBe('parts-orders')
    await expect(
      as(A1, () => q(`select public.create_chat_channel($1, 'parts-orders', null, false, null)`, [shopA])),
    ).rejects.toThrow(/name_taken/)
  })

  it('shows a private channel only to the people in it, guests included', async () => {
    const [{id}] = await as(A1, () =>
      q<{id: string}>(`select public.create_chat_channel($1, 'brake-crew', null, true, $2) as id`, [shopA, [AG.id]]),
    )
    expect(await visibleChannels(AG, shopA)).toContain(id)
    expect(await visibleChannels(AM, shopA)).not.toContain(id)
    await send(AG, id, 'On it')
    expect(await as(AM, () => q(`select * from public.chat_messages where channel_id = $1`, [id]))).toHaveLength(0)
    // A member can't add themselves.
    await expect(
      as(AM, () => q(`insert into public.chat_members (channel_id, user_id) values ($1, $2)`, [id, AM.id])),
    ).rejects.toThrow(/row-level security/)
  })

  it("keeps direct messages between the two people, even from the owner", async () => {
    const [{id}] = await as(AM, () => q<{id: string}>(`select public.open_dm($1, $2) as id`, [shopA, AG.id]))
    const [{id: again}] = await as(AG, () => q<{id: string}>(`select public.open_dm($1, $2) as id`, [shopA, AM.id]))
    expect(again).toBe(id)
    await send(AM, id, 'Can you take the brake job?')
    expect(await as(AG, () => q(`select * from public.chat_messages where channel_id = $1`, [id]))).toHaveLength(1)
    expect(await as(A1, () => q(`select * from public.chat_messages where channel_id = $1`, [id]))).toHaveLength(0)
    expect(await visibleChannels(A1, shopA)).not.toContain(id)
    await expect(as(AM, () => q(`select public.open_dm($1, $2)`, [shopA, B1.id]))).rejects.toThrow(/not_in_shop/)
  })

  it('lets a guest into the chat of a lead assigned to them, and no other', async () => {
    const [{id}] = await as(AG, () => q<{id: string}>(`select public.lead_chat($1) as id`, [leadForGuest]))
    await send(AG, id, 'Pads are worn')
    const [{id: same}] = await as(AM, () => q<{id: string}>(`select public.lead_chat($1) as id`, [leadForGuest]))
    expect(same).toBe(id)
    await expect(as(AG, () => q(`select public.lead_chat($1)`, [leadOther]))).rejects.toThrow(/not_allowed/)
    await expect(as(B1, () => q(`select public.lead_chat($1)`, [leadForGuest]))).rejects.toThrow(/not_allowed/)
  })

  it('lets authors edit their own messages, and admins only delete', async () => {
    const msg = await send(AM, generalA, 'Shop opens at 8')
    await as(AM, () => q(`update public.chat_messages set body = 'Shop opens at 9' where id = $1`, [msg.id]))
    const [edited] = await q<{body: string; edited_at: string | null}>(`select body, edited_at from public.chat_messages where id = $1`, [msg.id])
    expect(edited.body).toBe('Shop opens at 9')
    expect(edited.edited_at).not.toBeNull()

    await expect(
      as(A1, () => q(`update public.chat_messages set body = 'Changed by the owner' where id = $1`, [msg.id])),
    ).rejects.toThrow(/not_yours/)
    await as(A1, () => q(`update public.chat_messages set deleted_at = now() where id = $1`, [msg.id]))
    const [gone] = await q<{body: string | null; deleted_at: string | null}>(`select body, deleted_at from public.chat_messages where id = $1`, [msg.id])
    expect(gone.body).toBeNull()
    expect(gone.deleted_at).not.toBeNull()

    // Another member can't touch it at all.
    const other = await send(A1, generalA, 'Team meeting at 5')
    expect(await as(AM, () => count(`update public.chat_messages set deleted_at = now() where id = $1`, [other.id]))).toBe(0)
  })

  it('keeps #general from being renamed or archived', async () => {
    await expect(
      as(A1, () => q(`update public.chat_channels set archived_at = now() where id = $1`, [generalA])),
    ).rejects.toThrow(/general_locked/)
    await expect(
      as(A1, () => q(`update public.chat_channels set name = 'main' where id = $1`, [generalA])),
    ).rejects.toThrow(/general_locked/)
  })

  it('counts unread messages from others until the channel is read', async () => {
    const unread = async (who: typeof A1) =>
      (await as(who, () => q<{id: string; unread: number}>(`select id, unread from public.my_chat_channels($1)`, [shopA]))).find(
        r => r.id === generalA,
      )?.unread
    await as(A1, () => q(`select public.mark_chat_read($1)`, [generalA]))
    expect(await unread(A1)).toBe(0)
    await send(AM, generalA, 'Customer is here')
    expect(await unread(A1)).toBe(1)
    await as(A1, () => q(`select public.mark_chat_read($1)`, [generalA]))
    expect(await unread(A1)).toBe(0)
  })

  it('stops a photo in a channel from reaching anyone outside it', async () => {
    const path = `${shopA}/${generalA}/photo.jpg`
    expect(
      await as(A1, () => count(`insert into storage.objects (bucket_id, name, owner) values ('shop-chat', $1, $2)`, [path, A1.id])),
    ).toBe(1)
    await expect(
      as(B1, () => q(`insert into storage.objects (bucket_id, name, owner) values ('shop-chat', $1, $2)`, [`${shopA}/${generalA}/x.jpg`, B1.id])),
    ).rejects.toThrow(/row-level security/)
    // The shop id in the path must match the channel's shop.
    await expect(
      as(B1, () => q(`insert into storage.objects (bucket_id, name, owner) values ('shop-chat', $1, $2)`, [`${shopB}/${generalA}/x.jpg`, B1.id])),
    ).rejects.toThrow(/row-level security/)
    expect(await as(AM, () => q(`select name from storage.objects where bucket_id = 'shop-chat' and name = $1`, [path]))).toHaveLength(1)
    expect(await as(AG, () => q(`select name from storage.objects where bucket_id = 'shop-chat' and name = $1`, [path]))).toHaveLength(0)
    expect(await as(B1, () => q(`select name from storage.objects where bucket_id = 'shop-chat' and name = $1`, [path]))).toHaveLength(0)
    // A message can only point at a photo in its own channel.
    await expect(
      as(AM, () => q(`insert into public.chat_messages (channel_id, attachment_path) values ($1, $2)`, [generalA, `${shopB}/${generalB}/x.jpg`])),
    ).rejects.toThrow(/bad_attachment/)
  })

  it('shows teammates by name to guests, without emails', async () => {
    const people = await as(AG, () => q<Row>(`select * from public.chat_people($1)`, [shopA]))
    expect(people.length).toBe(4)
    expect(Object.keys(people[0])).not.toContain('email')
    expect(await as(B1, () => q(`select * from public.chat_people($1)`, [shopA]))).toHaveLength(0)
  })

  it('takes every channel away from someone who leaves the shop', async () => {
    const [{id: dm}] = await as(AX, () => q<{id: string}>(`select public.open_dm($1, $2) as id`, [shopA, AM.id]))
    expect(await visibleChannels(AX, shopA)).toEqual(expect.arrayContaining([generalA, dm]))
    await db.query(`delete from public.shop_members where org_id = $1 and user_id = $2`, [shopA, AX.id])
    expect(await visibleChannels(AX, shopA)).toHaveLength(0)
    expect(await as(AX, () => q(`select * from public.chat_messages where channel_id = $1`, [dm]))).toHaveLength(0)
  })
})
