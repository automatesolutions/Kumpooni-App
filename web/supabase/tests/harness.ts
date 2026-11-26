// Shared setup for the RLS tests: PGlite (Postgres in WebAssembly), the Supabase stub,
// and a way to run queries as one person. Nothing here touches a Supabase project.
import {readFileSync} from 'node:fs'
import {fileURLToPath} from 'node:url'

export type Row = Record<string, unknown>
export type Db = {
  exec(sql: string): Promise<unknown>
  query<T = Row>(sql: string, params?: unknown[]): Promise<{rows: T[]; affectedRows?: number}>
  close(): Promise<void>
}

export type Person = {id: string; email: string; admin?: boolean}

export function person(n: number, email: string, admin = false): Person {
  return {id: `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`, email, admin}
}

async function loadPglite(): Promise<(() => Promise<Db>) | null> {
  // Variable names, so a missing package skips the tests instead of failing the import.
  const core = '@electric-sql/pglite'
  const crypto = '@electric-sql/pglite/contrib/pgcrypto'
  try {
    const {PGlite} = await import(/* @vite-ignore */ core)
    const {pgcrypto} = await import(/* @vite-ignore */ crypto)
    return async () => (await PGlite.create({extensions: {pgcrypto}})) as Db
  } catch {
    return null
  }
}

export const openPglite = await loadPglite()
if (!openPglite) console.warn('RLS tests skipped: run `npm install -D @electric-sql/pglite` to turn them on.')

/** A numbered SQL file from supabase/, without the byte order mark some editors add. */
export const sqlFile = (name: string) =>
  readFileSync(fileURLToPath(new URL(`../${name}`, import.meta.url)), 'utf8').replace(/^﻿/, '')

/** Opens a database with the stub, the given files, and these people in auth.users. */
export async function openDb(files: string[], people: Person[]) {
  const db = await openPglite!()
  await db.exec(sqlFile('tests/supabase-stub.sql'))
  for (const f of files) await db.exec(sqlFile(f))
  for (const p of people) {
    await db.query(`insert into auth.users (id, email, email_confirmed_at) values ($1, $2, now())`, [p.id, p.email])
  }

  /** Runs fn as this person (or as anon), then goes back to the superuser. */
  async function as<T>(who: Person | null, fn: () => Promise<T>): Promise<T> {
    const claims = who
      ? {sub: who.id, role: 'authenticated', email: who.email, app_metadata: who.admin ? {role: 'admin'} : {}}
      : {role: 'anon'}
    await db.query(`select set_config('request.jwt.claims', $1, false)`, [JSON.stringify(claims)])
    await db.exec(`set role ${who ? 'authenticated' : 'anon'}`)
    try {
      return await fn()
    } finally {
      await db.exec('reset role')
    }
  }
  const q = <T = Row>(text: string, params?: unknown[]) => db.query<T>(text, params).then(r => r.rows)
  const count = async (text: string, params?: unknown[]) => (await db.query(text, params)).affectedRows ?? 0
  return {db, as, q, count}
}
