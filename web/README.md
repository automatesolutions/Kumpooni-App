# Kumpooni Repair Proof (web)

Kumpooni keeps proof of a repair: the quote, the photos, and every visit back
to the shop. It covers cars and motorcycles, home repairs and construction,
electrical work, aircon, appliances and electronics, computers, and phones. When the repair fails, it finds the nearest DTI
office and drafts a complaint letter from what you saved. The letter is a draft,
not legal advice. The owner edits it and files it.

The full spec is in `docs/repair-proof-spec.html`.

## Run it

```bash
cd web
cp .env.example .env   # then fill in the keys
npm install
npm run dev            # http://localhost:5173
```

| Variable | Needed for |
| --- | --- |
| `VITE_SUPABASE_URL` | Everything |
| `VITE_SUPABASE_ANON_KEY` | Everything |
| `VITE_GOOGLE_MAPS_KEY` | The satellite map of DTI offices (optional) |

Without the Google key, the offices screen still picks the nearest office from
your location and links to Google Earth, Google Maps, and directions.

For the Google key, turn on **Maps JavaScript API**, **Directions API**,
**Geocoding API**, and **Street View Static API** if you want "Look around".
Restrict the key to your web domain.

For phone sign-in, turn on the Phone provider in Supabase (Authentication,
Providers) and add your web domain under Authentication, URL configuration.

## Set up Supabase

Follow `supabase/README.md`. In short: run `1-schema.sql`, `2-seed.sql`, then
`3-repair-proof.sql`, then `4-more-repairs.sql` in the SQL Editor, one at a time. Deploying the
`draft-complaint` function is optional. Without it, letters use the plain
template.

## Screens

| URL | What it is | Sign-in needed |
| --- | --- | --- |
| `/` | Home | No |
| `/offices` | DTI offices: the nearest one on a map, found from your location | No |
| `/s/:code` | Job slip the shop sees, read-only | No |
| `/files` | Your repair files | Yes |
| `/files/new`, `/files/:id/edit` | Start or edit a file | Yes |
| `/files/:id` | The file: clocks, hints, visits, proof, slip, where to complain | Yes |
| `/files/:id/slip` | Job slip editor, before photos, extra work answers | Yes |
| `/files/:id/letter` | Complaint letter: options, office, AI or plain draft, edit, PDF | Yes |
| `/files/:id/pack` | Timeline of the whole file, to save as PDF | Yes |
| `/account`, `/account/vehicles…` | Account, and what you repair (cars, homes, gadgets…) | Yes |
| `/login`, `/login/verify`, `/welcome` | Phone sign-in | No |
| `/terms`, `/about` | Terms, About | No |

Old booking links (`/shops`, `/cart`, `/orders`, and the rest) go to Home.
Their route files are still in `src/routes` but are no longer used.

## Structure

```
src/
  styles/        tokens.css (design tokens), base.css, components.css, repair.css
  lib/           env, supabase client, geo and maps, repair clocks and hints, letter
  state/         session provider and React Query hooks (repair.ts holds the Repair Proof data)
  stores/        zustand stores persisted to localStorage (location, ui)
  components/    layout, office map, shared UI
  routes/        one file per area
supabase/
  3-repair-proof.sql          tables, RLS, storage, DTI offices
  functions/draft-complaint   AI letter body, facts from the file only
```

Read `DESIGN.md` before changing the look. It holds the colours, type,
spacing, components and copy rules.

## Deploy

`npm run build` writes static files to `dist/`. Any static host works
(Vercel, Netlify, Cloudflare Pages, Firebase Hosting). Point every unknown
path to `index.html` so links like `/files/123` and `/s/abc` load.
