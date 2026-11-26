// Static checks on the business SQL files. They run without a database.
import {readFileSync} from 'node:fs'
import {fileURLToPath} from 'node:url'
import {describe, expect, it} from 'vitest'
import {ITEM_KINDS} from '../../src/lib/kinds'

const FILES = ['7-business.sql', '8-business-crm.sql']
const read = (name: string) => readFileSync(fileURLToPath(new URL(`../${name}`, import.meta.url)), 'utf8')

describe.each(FILES)('%s', file => {
  const sql = read(file)
  const tables = [...sql.matchAll(/create table if not exists public\.(\w+)/g)].map(m => m[1])

  it('defines tables', () => {
    expect(tables.length).toBeGreaterThan(0)
  })

  it.each(tables)('turns on RLS for %s', table => {
    expect(sql).toContain(`alter table public.${table} enable row level security`)
  })

  it.each(tables)('gives %s a policy, or locks it to the service role', table => {
    const hasPolicy = new RegExp(`create policy \\w+ on public\\.${table}\\b`).test(sql)
    const locked = new RegExp(`revoke all on public\\.${table} from anon, authenticated`).test(sql)
    expect(hasPolicy || locked).toBe(true)
  })

  it('keeps no Google Places content but place_id', () => {
    expect(sql).not.toMatch(/\b(rating|reviews?|photo_url|photos|opening_hours|formatted_address|phone_number)\s+(text|numeric|integer|jsonb)/)
  })

  it('makes every security definer function pin its search_path', () => {
    const fns = sql.split(/create (?:or replace )?function /).slice(1)
    for (const fn of fns.filter(f => /security definer/.test(f.split('$$')[0]))) {
      expect(fn.split('$$')[0], fn.slice(0, 40)).toMatch(/set search_path = public/)
    }
  })

  it('uses the same item kinds as the app', () => {
    for (const kind of ITEM_KINDS) expect(sql).toContain(`'${kind}'`)
  })
})
