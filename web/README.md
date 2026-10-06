# Kumpooni Repair Proof (web)

Kumpooni keeps proof of a repair: the quote, the photos, and every visit back
to the shop. It covers cars and motorcycles, homes and construction, electrical
work, aircon, appliances and electronics, computers, and phones.

When the repair fails, it finds the nearest DTI office and drafts a complaint
letter from what you saved. The letter is a draft, not legal advice. The owner
edits it and files it.

The full spec is in `docs/repair-proof-spec.html`. For what the product is and
who it's for, see the [main README](../README.md).

## Run it

```bash
cd web
cp .env.example .env   # then fill in the keys
npm install
npm run dev            # http://localhost:5173
```

Vite reads `.env` only when it starts. After you change it, stop and start
`npm run dev`. If port 5173 is busy, Vite uses the next free port, such as 5174.

| Variable | Needed for |
| --- | --- |
| `VITE_SUPABASE_URL` | Everything |
| `VITE_SUPABASE_ANON_KEY` | Everything. The anon or publishable key from Supabase, Project Settings, API. |
| `VITE_GOOGLE_MAPS_KEY` | The satellite map of DTI offices (optional) |

Without the two Supabase values, the app shows a setup screen instead of Home.

Without the Google key, the offices screen still picks the nearest office from
your location and links to Google Earth, Google Maps, and directions.

For the Google key, turn on **Maps JavaScript API**, **Directions API**, and
**Geocoding API**. Turn on **Street View Static API** too if you want "Look
around". Restrict the key to your web domain.

### Sign-in

- **Phone:** turn on the Phone provider in Supabase (Authentication, Sign In /
  Providers). Add your web domain under Authentication, URL configuration.
- **Try it without a phone:** turn on the Anonymous provider in the same place.
  Guests see a "Trying it" label in the header.

## Set up Supabase

Follow `supabase/README.md`. In short, run these in the SQL Editor, one query at
a time and in order:

1. `1-schema.sql`
2. `2-seed.sql`
3. `3-repair-proof.sql`
4. `4-more-repairs.sql`

Deploying the `draft-complaint` function is optional. Without it, letters use
the plain template.

## Screens

| URL | What it is | Sign-in needed |
| --- | --- | --- |
| `/` | Home: what Kumpooni does, and your next step on your latest open file | No |
| `/offices` | DTI offices: the nearest one on a satellite map | No |
| `/s/:code` | The job slip the shop sees, read-only | No |
| `/files` | Your repair files, newest first | Yes |
| `/files/new`, `/files/:id/edit` | Start or edit a file | Yes |
| `/files/:id` | The file: counters, hints, visits, proof, slip, and where to complain | Yes |
| `/files/:id/slip` | Job slip editor, before photos, and answers to extra work | Yes |
| `/files/:id/letter` | Complaint letter: options, office, AI or plain draft, edit, PDF | Yes |
| `/files/:id/pack` | Timeline of the whole file, to save as PDF | Yes |
| `/ask` | Ask your files. Add `?file=<id>` to ask about one file. | Yes |
| `/account`, `/account/vehicles…` | Account, and what you repair (cars, homes, gadgets…) | Yes |
| `/login`, `/login/verify`, `/welcome` | Phone sign-in | No |
| `/terms`, `/about` | Terms, About | No |

The header and the phone tab bar have the same four places: Home, Repairs,
DTI offices, and Account.

Old links still go somewhere useful:

- `/history` goes to `/files`, and `/vehicles` goes to `/account/vehicles`.
- `/guide`, and the old booking links (`/shops`, `/cart`, `/orders`, and the
  rest), go to Home. Their route files are still in `src/routes` but aren't used.

## How some parts work

### DTI office map

`src/components/OfficeMap.tsx` and `src/lib/maps.ts`.

1. It uses a location the app already has, then the last location saved to the
   account, then asks the browser.
2. Until it has a location, it shows the Manila office (DTI NCR) and lists the
   rest by distance from Manila, without showing a distance.
3. When you allow your location, type your city, or tap the map, it picks the
   nearest office again. If you choose another office yourself, it keeps your
   choice until your location changes.

The 16 regional offices are seeded by `3-repair-proof.sql`. Most pins are on
the street or in the area, not on the building, and the app says so.

### Ask your files

`src/routes/Ask.tsx` and `src/lib/rag.ts`. The search runs in the browser over
your visits, slips, and photo notes. Each answer links to where it came from.
If nothing matches, it says so instead of guessing. Chats are kept in the
browser.

### Complaint letter

The plain template needs nothing. The AI draft uses the `draft-complaint`
Supabase function, which only reads the signed-in person's files. It rejects a
draft that mentions a peso amount or a law that isn't in the file. Each file
gets at most two AI drafts a day.

## Structure

```
src/
  styles/        tokens.css (design tokens), base.css, components.css, repair.css
  lib/           env, supabase client, geo and maps, repair clocks and hints, letter, rag (Ask)
  state/         session provider and React Query hooks (repair.ts holds the Repair Proof data)
  stores/        zustand stores persisted to localStorage (location, ui)
  components/    layout, office map, next-step coach, shared UI
  routes/        one file per area
supabase/
  1-schema.sql, 2-seed.sql    base tables and sample data
  3-repair-proof.sql          repair files, visits, proof, slips, letters, storage, DTI offices
  4-more-repairs.sql          repair kinds beyond cars and motorcycles
  functions/draft-complaint   AI letter body, facts from the file only
```

Read `DESIGN.md` before changing the look. It holds the colours, type,
spacing, components, and copy rules.

## Deploy

`npm run build` writes static files to `dist/`. Any static host works
(Vercel, Netlify, Cloudflare Pages, Firebase Hosting). Point every unknown
path to `index.html` so links like `/files/123` and `/s/abc` load.

The repo also has a container setup:

- `Dockerfile` builds the app with Node, then serves `dist/` with nginx on
  port 8080 (`nginx.conf`).
- `cloudbuild.yaml` builds the image on Google Cloud Build.

Vite bakes the `VITE_` values into the build. The Docker build reads them from
`web/.env.production`, which is git-ignored, so create it before you build.
`cloudbuild.yaml` also passes them as build arguments, but the Dockerfile
doesn't declare them, so those have no effect. After you change a `VITE_`
value, build and deploy again.
