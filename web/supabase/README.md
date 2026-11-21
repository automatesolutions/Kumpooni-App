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
7. Refresh the web app.

`3-repair-proof.sql`, `4-more-repairs.sql`, and `6-top-shops.sql` are safe to run again. They skip what already exists.

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
