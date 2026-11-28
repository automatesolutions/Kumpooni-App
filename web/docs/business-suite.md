# Kumpooni Business Suite: plan (Checkpoint 0)

Status: Checkpoints 1 and 2 are built and live. Written 2026-11-26 from main at 46bfa8a.

> **Update 2026-11-27: no Cloqui.** Jonel decided to build the workspace inside Kumpooni instead of
> handing off to Cloqui. Sections 7 and the Cloqui parts of 6 and 8 no longer apply. The new order:
>
> - **Checkpoint 3: team chat** (`9-business-chat.sql`, `/business/chat`): channels, private channels,
>   direct messages, and a chat on every lead, live through Supabase Realtime.
> - **Checkpoint 4: tasks**: a board with To do, Doing, and Done, assignees, due dates, and links to leads.
> - **Checkpoint 5: huddles**: voice and camera calls for up to 4 people, browser to browser (WebRTC),
>   with Supabase Realtime for setup. A relay (TURN) server only after a cost estimate.
> - **Checkpoint 6: video recording**: clips of up to 2 minutes in a private bucket, with a storage cap per shop.
> - **Checkpoint 7: live**: plan and cost estimate only (needs a paid media server such as LiveKit).
>
> **Update 2026-11-28:** Checkpoints 4 to 6 are built: tasks (`10-business-tasks.sql`, `/business/tasks`),
> huddles (`11-business-huddles.sql`, WebRTC mesh with STUN only, no TURN), and video clips
> (`12-business-clips.sql`, 300 MB per shop). Every shop page now has one menu bar, and the shop home
> shows unread messages, your tasks, follow-ups due, and live huddles.

Kumpooni today is a consumer repair-proof tool. This plan adds business accounts for repair shops and
mechanics without weakening one rule: **a shop never sees a consumer's repair file unless that person
shares it, and only the parts they chose.**

## 0. What I read, and what it means for this plan

| Source | What matters here |
| --- | --- |
| `src/App.tsx` | Signed-in routes sit under `<RequireAuth />`. `/business/*` goes there too. |
| `src/lib/supabase.ts`, `src/types/repair-proof.ts` | One typed client. New tables get hand-written row types in a new `src/types/business.ts`, added to `AppDatabase` the same way as `repair_files`. |
| `src/lib/kinds.ts` | `ITEM_KINDS` (10 kinds). Shop categories are a subset, checked in SQL with the same list as `vehicle_kind_check`. |
| `src/lib/nearby.ts`, `functions/_shared/nearby-key.ts` | Shared plain-TS module used by Deno and Vite. The handoff signer follows this pattern so Vitest can test it. Sample shop ids start with `sample-` and can't be claimed. |
| `src/routes/Nearby.tsx` | Each card links to `startFileUrl()`, which already carries `placeId`. A "Is this your shop?" link can carry the same `placeId` and nothing else. |
| `src/routes/Slip.tsx`, `FileDetail.tsx` | The job slip is already public to anyone with its `/s/<code>` link, through `get_job_slip()`. "Send to this shop" is a separate, revocable, signed-in share. It doesn't change the slip link. |
| `src/routes/Account.tsx` | Menu cards. "For shops" becomes one more card. |
| `supabase/1-schema.sql` | The old marketplace `store` table is public-read and seeded. I won't reuse it: shop orgs are a new table with members-only RLS. |
| `supabase/3-repair-proof.sql` | Owner-only RLS on every consumer table, `owns_repair_file()`, private `repair-proof` bucket under `<user id>/<file id>/`. None of these policies change. |
| `supabase/6-top-shops.sql` | `repair_files.shop_place_id` exists. `nearby_cache` stores place ids and coordinates only. Service-role-only tables use RLS on with no policies plus `revoke all`. I reuse that pattern. |
| `functions/draft-complaint`, `ask-pooni` | Pattern for "run as the caller": client created with the caller's `Authorization` header. |
| `functions/nearby-shops` | Pattern for service-role work, CORS, short error codes, never logging bodies or keys. |

`docs/business-suite-plan.md` isn't in the repo. I used the prompt you pasted as the source plan. If
there's a separate document, send it and I'll reconcile this file with it.

## 1. Order of work (needs your choice)

Your prompt has two orders:

- **A. Full order:** Checkpoint 1 (shop accounts with claims and team), 2 (CRM), then 3 (Cloqui link).
- **B. Cloqui first (the Nov 25 update):** a minimal shop org (3.3 Checkpoint A), the handoff (B), and
  tasks and summary (C). The claim flow, team invites, and CRM follow after.

**Decided 2026-11-26: order A.** Checkpoint 1 ships `7-business.sql` with orgs, members, invites,
claims, and the helpers. Checkpoint 2 adds the CRM and sharing tables in `8-business-crm.sql`, so each
file can be run and tested on its own. Checkpoint 3 (Cloqui) builds on the verified shops from 1.

## 2. Branch (you run these)

```powershell
cd C:\Users\jonel\OneDrive\Desktop\Jonel_Projects\Kumpooni-App
git switch main
git pull --ff-only origin main
git switch -c feat/business-suite
```

`web/supabase/.temp/cli-latest` shows as modified. It's Supabase CLI state, not code. Leave it out of
commits, or restore it with `git restore web/supabase/.temp/cli-latest`. This plan file is untracked
and moves to the new branch with you.

## 3. Data: `supabase/7-business.sql`

Safe to run again, like 3, 4, and 6. Every table has RLS on before any policy, and every policy is in
the same file as its table. No column stores Google Places names, photos, ratings, reviews, phone
numbers, or hours. `place_id` is the only Places value kept.

### 3.1 Tables

| Table | Columns (main ones) | Notes |
| --- | --- | --- |
| `shop_orgs` | `id`, `created_at`, `created_by`, `name`, `place_id text unique null`, `city`, `categories text[]`, `verification_status` (`unverified`, `pending`, `verified`, `rejected`), `verified_at`, `verified_method` | `name` and `city` are typed by the owner, never copied from Places. `categories <@ ITEM_KINDS`. Sample ids (`sample-%`) are refused. |
| `shop_members` | `org_id`, `user_id`, `role` (`owner`, `admin`, `member`, `guest`), `created_at`, PK `(org_id, user_id)` | A trigger makes the creator the owner and keeps at least one owner. |
| `shop_invites` | `id`, `org_id`, `email` (lowercased), `role` (not `owner`), `token_hash`, `invited_by`, `expires_at` (7 days), `accepted_at`, `revoked_at` | The raw token is shown once. Only its SHA-256 is stored. |
| `shop_claims` | `id`, `org_id`, `place_id`, `method` (`phone_code`, `email_code`, `dti_bn`, `manual`), `status` (`pending`, `approved`, `rejected`, `expired`), `dti_bn_number`, `code_hash`, `attempts`, `expires_at`, `reviewed_by`, `reviewed_at`, `review_note` | Partial unique index: one `pending` or `approved` claim per `place_id`. |
| `pipeline_stages` | `id`, `org_id`, `name`, `position`, `kind` (`open`, `won`, `lost`) | Seeded on org insert: New, Quoted, Scheduled, In the shop, Ready for pickup, Done (won), Lost (lost). |
| `customers` | `id`, `org_id`, `user_id null` (set when the customer came from a Kumpooni share), `name`, `mobile`, `email`, `notes`, `source` (`share`, `shop_page`, `manual`), `consent_at`, `consent_version`, `created_by` | `consent_at` is required. For manual entries the shop attests consent. |
| `file_shares` | `id`, `file_id`, `user_id` (the consumer), `org_id`, `fields text[]`, `consent_version`, `consented_at`, `revoked_at` | Owned by the consumer. This is the only door from a shop to a repair file. |
| `leads` | `id`, `org_id`, `customer_id`, `stage_id`, `source`, `kind` (item kind), `title`, `quote_amount`, `assignee_id`, `share_id null`, `created_by`, `created_at`, `updated_at`, `closed_at` | Later: `utm_source`, `utm_campaign` for Checkpoint 7. |
| `lead_activities` | `id`, `org_id`, `lead_id`, `actor_id`, `type` (`created`, `stage`, `note`, `quote`, `assign`, `follow_up`, `share_revoked`), `body`, `from_stage`, `to_stage`, `created_at` | Insert-only for members. Stage changes are written by a trigger, not the browser. |
| `follow_ups` | `id`, `org_id`, `lead_id`, `due_on date`, `reason` (`manual`, `warranty_end`), `note`, `assignee_id`, `done_at` | "Remind me after the warranty ends" sets `due_on` from the slip's drop-off date plus the warranty days the shop enters. |
| `shop_requests` | `id`, `org_id`, `user_id`, `kind`, `message`, `contact_mobile`, `consent_version`, `created_at` | Signed-in consumers only, from a verified shop's page. A trigger turns each row into a customer and a lead. |

### 3.2 Helper functions (all `security definer`, `set search_path = public`, `stable`)

- `public.shop_role(org uuid) returns text`: the caller's role in that org, or null. Every policy uses it.
- `public.shop_can(org uuid, min_role text) returns boolean`: role at or above `min_role`
  (owner > admin > member > guest).
- `public.is_kumpooni_admin() returns boolean`: true when `auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'`.
  Only the service role can set `app_metadata`, so a person can't make themselves an admin.
- `public.shared_file(share uuid) returns jsonb`: for a member (not guest) of the share's org, while the
  share isn't revoked, returns only the fields the consumer ticked. Otherwise null.
- `public.can_read_shared_object(path text) returns boolean`: for the storage policy, true only for a
  photo or document in an active share's chosen fields.
- RPCs: `accept_shop_invite(token text)`, `verify_claim_code(claim uuid, code text)`,
  `review_claim(claim uuid, approve boolean, note text)` (admins only), `move_lead(lead uuid, stage uuid)`.

### 3.3 Policies

| Table | Select | Insert | Update | Delete |
| --- | --- | --- | --- | --- |
| `shop_orgs` | member+guest of that org | any signed-in person, as `created_by`, status `unverified` | owner, admin. A trigger blocks changes to `verification_status`, `verified_*`, and to `place_id` once verified | owner |
| `shop_members` | anyone in the org | owner, admin. Nobody grants `owner` here | owner, admin. Admins can't change an owner | owner, admin, or yourself (leave). Never the last owner |
| `shop_invites` | owner, admin | owner, admin | owner, admin (revoke only) | owner, admin |
| `shop_claims` | owner, admin; Kumpooni admins | owner, admin, status `pending` only | through RPCs only | none |
| `pipeline_stages` | member+ | owner, admin | owner, admin | owner, admin (not if leads use it) |
| `customers`, `leads`, `follow_ups` | member+; guests only for leads assigned to them | member+ | member+ | owner, admin |
| `lead_activities` | member+; guests only on leads assigned to them | member+, type `note` only | none | none |
| `file_shares` | the consumer; members of the org see the row (not the file) | the consumer, for a file they own, to a **verified** org only | the consumer, `revoked_at` only | none (revoke keeps the consent record) |
| `shop_requests` | the consumer; member+ of the org | signed-in consumer, verified org only | none | the consumer |

**Decided 2026-11-26: guests see only leads assigned to them.** For a guest, `leads`, `follow_ups`,
and `lead_activities` are readable only where `assignee_id = auth.uid()` (activities and follow-ups
through their lead), and `customers` only through those leads. Guests can't insert, update, or delete
anything, can't list other customers, and can't call `shared_file()`, so they never see a consumer's
shared repair file. If you want guests to see the shared file on their own assigned leads, say so.

`anon` gets nothing on any new table. No existing policy changes. Shop members still can't select
`repair_files`, `visits`, `attachments`, `job_slips`, or `letters` directly, shared or not.

## 4. Claim flow

1. A shop owner starts from **/business/claim**, or from "Is this your shop?" on a live (non-sample)
   card on /nearby, which opens `/business/claim?placeId=...`.
2. They type the shop name and city, and tick categories. We don't prefill from Google.
3. We create `shop_orgs` (unverified) and a `pending` claim. If the `place_id` already has a verified
   org or a pending claim, the new claim goes to manual review as a dispute.
4. They prove it one of three ways:
   - **Code to the business phone or email.** The Edge Function `shop-claim` fetches the phone from
     Places Details at that moment (not stored) and sends a 6-digit code. Codes are hashed, expire in
     15 minutes, and allow 5 tries. **Sample mode until you approve costs:** no Places call, no SMS or
     email, and the code is shown on screen with a "Sample code" label.
   - **DTI business name number.** They enter the BN number and upload the certificate to a private
     path. A Kumpooni admin checks it against the DTI BNRS search by hand. There's no DTI API.
   - **Manual review.** Kumpooni admins see a queue at `/business/admin/claims`.
5. On approval, `verification_status = 'verified'`. Only verified shops get a public badge, receive
   shares and shop page requests, and appear as "Kumpooni verified" anywhere public.

## 5. How leads arrive

**(a) Shared from a repair file or slip.** "Send to this shop" shows on a file only when its
`shop_place_id` matches a verified org. The consumer picks what to share:

- Problem and item kind (always on, it's what a quote needs)
- Item details (brand, model, year; plate and serial off by default)
- Before photos
- Estimates and job orders
- Visit history
- Their name and mobile

Then they tick the consent box. Inserting the `file_shares` row creates (by trigger) a customer with
only the shared contact fields and a lead in New. The shop reads the file only through
`shared_file()`, live, so **stopping the share removes access at once** and logs `share_revoked`.

**(b) A request from the shop's page.** A verified shop gets a public page later (`/shop/:orgId`). A
signed-in consumer sends a short request with consent. Signed-in only, to stop spam.

**(c) Manual entry by the shop.** The shop ticks that the customer agreed. That sets `consent_at`.

### Consent text (draft; have a lawyer check it before launch)

Consumer, before sharing:

> **Share this repair with {shop name}**
> They'll see only what you tick. You can stop sharing from this repair file at any time, and they
> lose access right away. We keep a record of what you shared and when.
>
> ☐ I agree to share these details with {shop name} so they can quote and do this repair. We process
> your data under the Data Privacy Act of 2012 (Republic Act No. 10173). Read our [privacy policy](/privacy).

Shop, on manual entry:

> ☐ This customer agreed that we can keep their name and contact details to follow up on this job.

Shop, when creating a business account:

> You're responsible for the customer details your team adds. Use them only for the customer's repair,
> and delete them when the customer asks. Kumpooni won't sell or share them.

`consent_version` stores which text was shown (`2026-11-dpa-1`), so a later edit doesn't rewrite history.

## 6. Screens

All under `RequireAuth`. Built with the kumpooni-design skill and existing `ui.tsx` parts.

| Route | What it shows |
| --- | --- |
| Account, "For shops" card | No org: "Add your shop". Member: each shop with role and badge, linking to /business. |
| `/business` | Shop switcher, badge or "Not verified yet", follow-ups due today and overdue, Cloqui panel (Checkpoint 3), "Open workspace". |
| `/business/claim` | Name, city, categories, then the proof step. |
| `/business/team` | Members and roles, invite by email, change role, remove. Controls only for owner and admin. |
| `/business/leads` | Board (drag and drop) and list. Every card also has a "Move to" menu for keyboard and touch. |
| `/business/leads/:id` | Customer, item kind, shared file (read-only, only what was shared), quote, notes, timeline, follow-up date, assignee. |
| `/business/customers` | Search and list, with each customer's leads. |
| `/business/invite/:token` | Accept an invite (your sign-in email must match). |
| `/business/admin/claims` | Kumpooni admins only. |

Drag and drop: native HTML5 drag events plus the "Move to" menu, so no new dependency.

## 7. Cloqui handoff contract

Kumpooni's side signs. The browser never sees the secret.

**Edge Function `workspace-handoff`** (POST, CORS like the others):

1. Reads the caller's `Authorization` header and calls `auth.getUser()`. No user: 401.
2. Requires an email with `email_confirmed_at` set. Google sign-in has this. Phone-only accounts get
   "Add a Google sign-in to open Cloqui." (Cloqui matches people by verified email.)
3. Loads the membership with the service role. Not a member: 403.
4. Signs an HS256 JWT with `CLOQUI_HANDOFF_SECRET_KUMPOONI`:

```json
{
  "iss": "kumpooni", "aud": "cloqui", "app": "kumpooni",
  "org_id": "<shop_orgs.id>", "org_name": "<shop_orgs.name>",
  "user_id": "<auth uid>", "email": "<email>", "email_verified": true,
  "role": "owner | admin | member | guest",
  "iat": 1764150000, "exp": 1764150060, "jti": "<uuid v4>"
}
```

5. Returns `{token, url: CLOQUI_URL + "/api/handoff"}`. Never logs the token.
6. Rate limit: 10 handoffs per person per 10 minutes, in a service-role-only table like `nearby_usage`.

**Browser:** "Open workspace" opens a blank named tab first (inside the click, so it isn't blocked as a
popup), then posts a hidden form with `token` to that tab. If the function fails, the tab closes and
the page shows the error.

**Verified only?** In Cloqui-first order, unverified orgs can open a workspace so you can test locally.
Once claims exist, the function refuses unverified orgs unless `CLOQUI_ALLOW_UNVERIFIED=true`.

**Server to server (3.3 Checkpoint C):** Edge Function `cloqui-api` checks membership the same way,
signs a 60-second service token (`aud: "cloqui-api"`), and calls Cloqui's `POST /api/apps/tasks` and
`GET /api/apps/summary`. The summary call has a 3-second timeout. If Cloqui is offline, the panel
says "Cloqui isn't reachable right now" and the rest of /business works.

**Env names** (values never in git or chat):

| Where | Name |
| --- | --- |
| Supabase secret, and `supabase/functions/.env` for local serve (git-ignored by the `.env` rule) | `CLOQUI_HANDOFF_SECRET_KUMPOONI`, `CLOQUI_URL` |
| `web/.env` | `VITE_CLOQUI_URL` |

The signer lives in `supabase/functions/_shared/handoff.ts`: plain TypeScript with WebCrypto, used by
both functions and tested in Vitest, like `nearby-key.ts`.

## 8. File-by-file changes

**New**

- `supabase/7-business.sql` (Checkpoint 1) and `supabase/8-business-crm.sql` (Checkpoint 2)
- `supabase/tests/business_rls.test.sql`, `supabase/tests/sharing_rls.test.sql` (pgTAP)
- `supabase/functions/_shared/handoff.ts`, `supabase/functions/workspace-handoff/index.ts`,
  `supabase/functions/cloqui-api/index.ts`, `supabase/functions/shop-claim/index.ts`
- `src/types/business.ts`
- `src/lib/business.ts` (roles, stage order, warranty date, share fields, consent versions) and `business.test.ts`
- `src/lib/handoff.test.ts`, `src/lib/business-sql.test.ts`
- `src/state/queries/business.ts`, `src/state/queries/leads.ts`, `src/state/queries/cloqui.ts`
- `src/routes/business/Business.tsx`, `Claim.tsx`, `Team.tsx`, `Leads.tsx`, `LeadDetail.tsx`,
  `Customers.tsx`, `Invite.tsx`, `AdminClaims.tsx`
- `src/components/ShareWithShop.tsx` (the share dialog)
- `scripts/test-rls.ps1` (starts local Supabase, loads 1 to 7, runs pgTAP)

**Changed**

- `src/App.tsx`: `/business/*` routes under `RequireAuth`
- `src/routes/Account.tsx`: "For shops" card
- `src/routes/Nearby.tsx`: "Is this your shop?" link on live cards
- `src/routes/FileDetail.tsx` and `Slip.tsx`: "Send to this shop" and a "Shared with" list with "Stop sharing"
- `src/types/repair-proof.ts`: add the new tables to `AppDatabase`
- `src/lib/env.ts`: `VITE_CLOQUI_URL` (optional; the button hides without it)
- `src/routes/Info.tsx`: privacy policy section on sharing with shops
- `supabase/README.md`, `web/README.md`: step 7, functions, secrets by name
- `package.json`: `test:rls` script

## 9. Tests

`npm test` stays fast and offline. RLS needs a real Postgres, so it's a separate `npm run test:rls`:
local Supabase in Docker (`npx supabase start`, free, nothing leaves your PC), loads the numbered SQL
files, then `npx supabase test db`. I'll report both at every checkpoint. If Docker isn't running, I'll
say so instead of skipping quietly.

**Vitest (`npm test`)**

- Handoff: claims are complete, `exp - iat = 60`, `jti` is a UUID, `app = 'kumpooni'`, signature verifies
  with the right secret and fails with another, unknown roles refused.
- Function decision logic: no user 401, no verified email refused, non-member 403.
- Roles: who can invite, change roles, and remove; nobody grants owner; last owner can't leave.
- Pipeline: default stages and order; "Move to" lists every stage except the current one.
- Warranty follow-up date from slip date plus days, in Asia/Manila.
- Share field picker: problem always included, plate and contact off by default.
- SQL guard on `7-business.sql`: every `create table` has `enable row level security` and at least one
  policy or a `revoke all`; no column named like `rating`, `review`, `photo_url`, `phone_from_places`.

**pgTAP (`npm run test:rls`)**, with users A1 (owner of shop A), A2 (member of A), AG (guest of A), B1
(owner of shop B), C (consumer), X (Kumpooni admin), and anon:

- A1 and A2 can't select, insert, update, or delete any shop B row in any new table.
- A2 can't invite, change roles, or remove members. Admins can't touch the owner. Nobody inserts `role = 'owner'`.
- The last owner can't leave or be removed.
- AG sees only leads assigned to AG, with their activities, follow-ups, and customer. AG writes nothing and gets null from `shared_file()`.
- Nobody but the service role or `review_claim()` sets `verification_status`.
- A second claim for the same `place_id` while one is pending or approved goes to review, never to a second org.
- A1 can't select C's `repair_files`, `visits`, `attachments`, `job_slips`, or `letters`, shared or not.
- `shared_file()` returns only the ticked fields for A members, null for B, null after revoke.
- Storage: A1 can read C's before photo only while it's in an active share.
- C can't share a file they don't own, or share to an unverified org.
- Sharing creates exactly one lead in New for the right org. Stopping the share logs `share_revoked`.
- Stage changes write one `lead_activities` row. Activities can't be updated or deleted.
- anon reads nothing.

## 10. Costs

| Item | Cost | When |
| --- | --- | --- |
| New tables, RLS, Edge Functions on the free plan | ₱0 within free limits | Checkpoint 1 on |
| Local Supabase in Docker for RLS tests | ₱0 | Every checkpoint |
| Claim codes by SMS, Places Details for the phone, email codes | Metered. I'll send a written estimate first | Off until you say yes |
| Cloqui hosting (Supabase Pro about $25 a month plus a host) | Your estimate in 3.4 | Before deploy |

## 11. Checkpoints 4 to 7

Plan only until you say go, as in your prompt: videos in circles (R2 estimate first), huddles and live
(LiveKit estimate and per-shop minutes first), "Make a Short" with AutoShorts Studio (template mode by
default, no Google content, Approvals first), and `/business/videos` performance with UTM links. Each
will list its platform reviews and costs before any code.

## 12. Questions for you

1. Order: **A** (answered 2026-11-26).
2. Guests: **see leads assigned to them** (answered 2026-11-26).
3. `docs/business-suite-plan.md` exists: waiting for a copy in `web/docs/` to reconcile this plan with it.
