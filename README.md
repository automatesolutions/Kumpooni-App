# Kumpooni

![Kumpooni](assets/logo.png)

**Your repairs have a memory now.**

Kumpooni keeps proof of your repairs. Save the quote, the photos, and every
trip back to the shop. Look back any time, ask what happened, and have proof
ready if the repair fails.

It's free, and it's built for the Philippines. It works for cars and
motorcycles, homes and construction, electrical work, aircon, appliances,
computers, and phones.

Live at [kumpooni.com](https://kumpooni.com).

## Why

A repair isn't over when you pay. The problem can come back, the warranty runs
out, and the details fade. The quote is in your gallery, what the shop said is
in a chat, and the receipt is lost. When you need to complain, you have nothing
to show.

Kumpooni keeps all of it in one place, with the dates.

## What's in it

| Feature | What it does |
| --- | --- |
| Repair file | One folder per problem: the quote, the job order, receipts, photos, and the old parts. |
| Same-problem counter | Counts every visit for the same problem, and how many days it took. |
| Job slip | Write what the shop may do and your price limit before they start. The shop opens it from a link, no app needed. Extra work needs your yes or no, and your answer is saved. |
| Dealer-phrase log | Tap what the dealer or service center said, like "service warranty lang", and keep it on record. |
| Ask your files | Ask in plain words, like "When did I last pay for the aircon?" Answers come only from what you saved, with a link to each source. It never makes up a date, an amount, or a law. |
| Top shops nearby | The top 10 repair shops near you for each kind of repair, on a list and a map. Set how far to look, from 2 to 25 km, compare up to three shops, and start a repair file with the one you pick. |
| DTI offices | Finds the nearest Department of Trade and Industry (DTI) office on a satellite map. DTI handles complaints about repair shops, service centers, and dealers, and filing is free. |
| Complaint letter | Drafts a letter from your file only, addressed to the nearest DTI office or to the shop. You read it, fix what's wrong, and file it yourself. It's a draft, not legal advice. |
| Timeline PDF | The whole file, in order, saved as a PDF. |

### How top shops are ranked

Shops are ranked by distance and proof, not paid placement. No shop can pay
for a higher rank, and Kumpooni has no shop accounts or ads.

- **Distance:** closer shops score higher, out to the radius you set.
- **Public ratings:** a 5.0 from 3 reviews doesn't beat a 4.6 from 400.
- **Your own proof:** if you've saved repair files with a shop, the score also
  counts whether they gave a written estimate and kept to your price limit.
  Only you see this part. It comes from your files, not anyone else's.

A shop with no files from you is scored on public ratings and distance only,
and the page says so. A rank isn't a certification. Kumpooni doesn't book the
shop or take payments.

This is still being built. For now the page shows sample shops with made-up
names, ranked by distance, and it says so on the page. The score and live shop
data come next.

### How the DTI map picks an office

- If the app doesn't know where you are, it shows the Manila office (DTI NCR).
- If you allow your location, type your city, or tap the map, it switches to
  the office nearest you.

## Your data

- Repair files are private to your account. Shops see only the job slip you
  send them.
- To look up shops, the app sends a rounded point about 2 km across, not your
  exact spot. Distances are worked out on your phone or computer.
- Ask your files searches your saved files in your browser, and chats stay
  there. If the optional AI is set up, your question and facts from your saved
  files are sent to an AI model to word the answer.

The full policy is at [kumpooni.com/privacy](https://kumpooni.com/privacy).

## How to use it

1. **Pick.** Not sure where to go? Open Top shops nearby, choose the kind of
   repair, and start a file with the shop you pick. The shop's name is filled
   in for you.
2. **Save.** Start a repair file. Pick the kind of repair and take a photo of
   the quote. One line about the problem is enough.
3. **Agree.** Before work starts, send the shop the job slip with what they may
   do and your price limit.
4. **Log.** After every visit, add the dates, what was said, and what you paid.
   Add the receipt with a short note.
5. **Use.** Ask your files when you need to remember. Close the file when it's
   fixed. If it fails again, save the PDF and draft your complaint.

## What's in this repo

| Folder | What it is |
| --- | --- |
| `web/` | The Kumpooni web app: React, TypeScript, Vite, and Supabase. This is the current product. |
| `web/supabase/` | Database scripts and Supabase Edge Functions (complaint letter, Ask, top shops). |
| `src/`, `android/`, `ios/` | The original React Native mobile app, a car-service booking marketplace. The web app replaced it. |

## Run the web app

You need Node.js 18 or later and a Supabase project.

```bash
cd web
cp .env.example .env   # then add your Supabase URL and key
npm install
npm run dev            # http://localhost:5173
```

The full setup, including the database scripts, the Google Maps key, the
Supabase functions, and deployment, is in [web/README.md](web/README.md).

## Contributing

Contributions are welcome. To fix a bug or add a feature, fork the repository,
make your change, and open a pull request.

Before you open it, run the checks from `web/`:

```bash
npm run typecheck
npm test
```

Read `web/DESIGN.md` before changing how a screen looks. It holds the colors,
type, spacing, and copy rules.

If this project helped you, you can support it with a coffee.

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-Support-blue?style=for-the-badge&logo=coffee&logoColor=white)](https://buymeacoffee.com/jonelpericon)

© Auto-Mate Solutions Inc.
