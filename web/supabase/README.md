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
5. Refresh the web app.

`3-repair-proof.sql` and `4-more-repairs.sql` are safe to run again. They skip what already exists.

`finish-seed.sql` and a single-file `bootstrap.sql` are leftovers. Use 1, 2, 3, then 4.

## DTI office pins

Addresses come from each region's page on dti.gov.ph (checked 5 Oct 2026).
Pins come from OpenStreetMap. Only the Region 4B and Region 9 pins are on the
building; the rest are on the street or in the area, and the app says so.
After you confirm an office yourself, update its pin and set `verified = true`.

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
