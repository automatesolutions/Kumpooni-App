# Bootstrap a new Supabase project

Run these as **separate queries**, in order. Do not paste them into one editor.

1. New query → paste `1-schema.sql` → **Run**. Wait for success.
2. New query → paste `2-seed.sql` → **Run**. Wait for success.
3. New query → paste `3-repair-proof.sql` → **Run**. This adds repair files,
   visits, proof uploads, job slips, letters, the private `repair-proof`
   storage bucket, and the 16 DTI regional offices.
4. New query → paste `4-more-repairs.sql` → **Run**. This lets repair files
   cover homes, construction, electrical, aircon, appliances, computers and
   phones, not only cars and motorcycles.
5. `5-vehicle-log.sql` is reserved for the vehicle log. If it isn't in the
   folder yet, skip it. Step 6 doesn't need it.
6. New query → paste `6-top-shops.sql` → **Run**. This adds the search cache
   for the top shops page (`/nearby`), an optional `shop_place_id` on repair
   files, and `my_shop_proof()`, which returns only your own repair facts for
   the Proof Score.
7. New query → paste `7-business.sql` → **Run**. This adds business accounts
   for shops (`/business`): shops, team members and roles, invite links, shop
   claims, and a private `shop-claims` storage bucket for DTI certificates.
   It doesn't change any repair file table, and shops can't read repair files.
8. New query → paste `8-business-crm.sql` → **Run**. This adds the shop CRM:
   pipeline stages (seven defaults for every shop), customers, leads, the lead
   timeline, follow-ups, and sharing a repair file with a verified shop.
9. New query → paste `9-business-chat.sql` → **Run**. This adds team chat for
   shops (`/business/chat`): #general for every shop, more channels, private
   channels, direct messages, a chat on every lead, and a private `shop-chat`
   storage bucket for photos. It turns on Realtime for `chat_messages`.
10. New query → paste `10-business-tasks.sql` → **Run**. This adds the task
    board (`/business/tasks`) with To do, Doing, and Done, and turns on
    Realtime for `shop_tasks`.
11. New query → paste `11-business-huddles.sql` → **Run**. This adds huddles:
    voice and camera calls for up to 4 people in any chat channel. It turns on
    Realtime for `huddle_signals` and `huddle_people`.
12. New query → paste `12-business-clips.sql` → **Run**. This adds video clips
    in chat, the private `shop-clips` bucket (25 MB per clip), and a storage
    cap of 300 MB per shop.
13. Refresh the web app.

`3-repair-proof.sql`, `4-more-repairs.sql`, `6-top-shops.sql`, `7-business.sql`, `8-business-crm.sql`, `9-business-chat.sql`, `10-business-tasks.sql`, `11-business-huddles.sql`, and `12-business-clips.sql` are safe to run again. They skip what already exists.

`finish-seed.sql` and a single-file `bootstrap.sql` are leftovers. Use 1, 2, 3, then 4.

## DTI office pins

Addresses come from each region's page on dti.gov.ph (checked 5 Oct 2026).
Pins come from OpenStreetMap. Only the Region 4B and Region 9 pins are on the
building; the rest are on the street or in the area, and the app says so.
After you confirm an office yourself, update its pin and set `verified = true`.

## Pooni (Ask about your repairs)

Pooni works without any setup: the app answers in the browser from the saved
files. With `functions/ask-pooni` deployed, an AI model writes friendlier
answers from the same data, and only from that data. It uses the same secrets
as the letter function.

```bash
npx supabase functions deploy ask-pooni --project-ref <your-project-ref>
```

With no repairs saved, Pooni says there is no data and asks you to add a
repair. The AI is not called. An answer that mentions a peso amount that is not
in the files is rejected, and the app answers instead.

## Top shops function

`functions/nearby-shops` returns up to 12 shops for one category near a point.
The `/nearby` page filters them to your radius and ranks the top 10.

Today it returns **sample shops** with made-up names. It does not call Google
and needs no secrets. Deploying it is free on the Supabase free plan.

```bash
npx supabase functions deploy nearby-shops --project-ref <your-project-ref>
```

How it works:

1. It rounds your point to a 0.02° grid (about 2.2 km) and your radius up to
   5, 10, 15, or 25 km. That gives a cache key like `car:730:6049:10`.
2. If `nearby_cache` has a fresh row for that key (under 24 hours old), it
   returns that row.
3. If not, it makes sample shops, saves them to `nearby_cache`, and returns them.
4. It deletes cache rows older than 30 days.

The browser can't read or write `nearby_cache`. Only the function can.

Live Google results come later, with a separate server-only key saved as the
Supabase secret `GOOGLE_PLACES_KEY`. Never put that key in a `VITE_` variable.
Google lets us keep place ids and coordinates, not names, ratings, or hours,
so the cache keeps only ids and coordinates for live results.

## AI letter function

`functions/draft-complaint` writes the letter body from one repair file. Without
it, the app offers the plain template, which needs nothing.

```bash
cd web
npx supabase login
npx supabase functions deploy draft-complaint --project-ref <your-project-ref>
npx supabase secrets set AI_API_KEY=<key> --project-ref <your-project-ref>
# Optional: any OpenAI-compatible API and model
npx supabase secrets set AI_BASE_URL=https://api.openai.com/v1 AI_MODEL=gpt-4o-mini --project-ref <your-project-ref>
```

The function runs as the signed-in person, so row level security limits it to
their own files. It rejects a draft that mentions a peso amount or law that is
not in the file, and the database allows two AI drafts per file per day.

## Shop accounts (`7-business.sql`)

A shop starts unverified. It gets the Verified badge when a claim is approved:

- **Code to the shop phone or email.** Off for now: sending codes costs money,
  so nothing is sent until the cost is approved. For a test, turn on sample
  codes. The code then shows on screen, and anyone can verify their own shop.
  Use this only in a test project, and turn it off after:

  ```sql
  update public.business_settings set claim_codes_sample = true;   -- test on
  update public.business_settings set claim_codes_sample = false;  -- test off
  -- Undo shops verified by a sample code:
  update public.shop_orgs set verification_status = 'unverified', verified_at = null, verified_method = null
  where verified_method = 'sample_code';
  ```

- **DTI business name number** and **Ask for a review.** A Kumpooni admin
  checks them at `/business/admin/claims`. To make someone an admin, run this,
  then have them sign out and back in:

  ```sql
  update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'
  where email = '<their email>';
  ```

Team invites are links to copy and send. No email is sent. A link works once,
for 7 days, and only for someone signed in with the invited email.

Google Places: a shop stores only its `place_id`. The owner types the name and
town. Nothing else from Google is saved.

### Tests

`npm test` checks the SQL files without a database (RLS on every table, no
Google content columns, pinned `search_path`). The row level security tests in
`tests/business.rls.test.ts` run `7-business.sql` in PGlite, an in-memory
Postgres, as each test person. They skip until PGlite is installed:
`npm install -D @electric-sql/pglite`.

## Shop CRM and sharing (`8-business-crm.sql`)

- **Sharing is the only door.** A shop never reads `repair_files`, `visits`,
  `attachments`, `job_slips`, or `letters`. When a person taps "Send to this
  shop" on a file whose shop is verified, they tick what to share and agree.
  That makes a lead in New. The shop reads the file only through
  `shared_file()`, which returns only the ticked parts, and nothing once the
  person taps Stop sharing.
- **Photo links** for a shop last 5 minutes, because a link keeps working until
  it expires, even after sharing stops.
- **The timeline is written by the database.** Stage, quote, assignee, and
  follow-up changes are logged by triggers. People can add notes, and nobody can
  edit or delete the timeline.
- **Guests** see only leads assigned to them, read-only, and never a shared file.

## Team chat (`9-business-chat.sql`)

- **Who reads what.** Public channels: members, admins, and owners. Private
  channels and direct messages: only the people in them, so an owner can't
  read two teammates' direct messages. Lead chats: whoever can see the lead.
  Guests see only private channels they're added to and chats on leads
  assigned to them. Leaving the shop takes every channel away at once.
- **Live messages** use Supabase Realtime on `chat_messages`. Realtime checks
  the same policies for each person, so nobody gets a message they can't read.
- **Editing.** People edit and delete their own messages. Owners and admins can
  delete anyone's, but not edit them. A deleted message keeps its place and
  loses its words.
- **Photos** go to the private `shop-chat` bucket as
  `<shop id>/<channel id>/<file>`. Links last 5 minutes.
- **Cost.** Chat stays inside the Free plan's limits for a small team: 200
  people connected at once and 2 million Realtime messages a month. Photos
  count toward the 1 GB of storage.

## Tasks (`10-business-tasks.sql`)

- **Who sees what.** Members, admins, and owners see and change every task.
  Guests see only tasks given to them, and can only move them between columns.
  Owners, admins, and the person who made a task can delete it.
- A task can link to a lead in the same shop, and the lead page lists its tasks.
- **Live board** uses Supabase Realtime on `shop_tasks`.

## Huddles (`11-business-huddles.sql`)

- **How a call works.** Each browser connects straight to the others (WebRTC),
  so sound and video never pass through Supabase or Kumpooni, and nothing is
  recorded. The database only passes short setup messages and keeps the list of
  who is in each call. Up to 4 people per call.
- **Who can join.** Anyone who can read the channel (`chat_can_read`).
- **Leaving.** Each browser checks in every 15 seconds. Someone who stops for
  45 seconds counts as gone, and the call ends when the last person leaves.
  Old setup messages are cleared after 10 minutes.
- **Networks.** Browsers find each other with Google's free STUN server. Some
  strict networks (some offices and mobile carriers) block direct calls. Those
  need a relay (TURN) server, which costs money, so it's off until you approve
  a cost estimate.
- **Cost.** Free. Setup messages are a few dozen Realtime messages per call.

## Video clips (`12-business-clips.sql`)

- **Recording** happens in the browser: camera, screen, or screen with the
  camera in a corner. Up to 2 minutes and 25 MB per clip.
- **Storage.** Clips go to the private `shop-clips` bucket as
  `<shop id>/<channel id>/<clip id>.webm` (or `.mp4` from Safari). Each shop
  gets 300 MB to start (`business_settings.clip_cap_mb`). `reserve_clip()`
  checks the cap before the upload, and deleting the message frees the space.
- **Who watches.** The same people who can read the channel.
- **Cost.** Clips count toward the Free plan's 1 GB of storage and 5 GB of
  monthly downloads. A 2-minute clip is about 15 MB, so 300 MB is about 20
  full-length clips per shop.
