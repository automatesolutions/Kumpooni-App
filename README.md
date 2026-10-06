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
| DTI offices | Finds the nearest Department of Trade and Industry (DTI) office on a satellite map. DTI handles complaints about repair shops, service centers, and dealers, and filing is free. |
| Complaint letter | Drafts a letter from your file only, addressed to the nearest DTI office or to the shop. You read it, fix what's wrong, and file it yourself. It's a draft, not legal advice. |
| Timeline PDF | The whole file, in order, saved as a PDF. |

### How the DTI map picks an office

- If the app doesn't know where you are, it shows the Manila office (DTI NCR).
- If you allow your location, type your city, or tap the map, it switches to
  the office nearest you.

## How to use it

1. **Save.** Start a repair file. Pick the kind of repair and take a photo of
   the quote. One line about the problem is enough.
2. **Agree.** Before work starts, send the shop the job slip with what they may
   do and your price limit.
3. **Log.** After every visit, add the dates, what was said, and what you paid.
   Add the receipt with a short note.
4. **Use.** Ask your files when you need to remember. Close the file when it's
   fixed. If it fails again, save the PDF and draft your complaint.

## What's in this repo

| Folder | What it is |
| --- | --- |
| `web/` | The Kumpooni web app: React, Vite, and Supabase. This is the current product. |
| `src/`, `android/`, `ios/` | The original React Native mobile app, a car-service booking marketplace. The web app replaced it. |

## Run the web app

You need Node.js 18 or later and a Supabase project.

```bash
cd web
cp .env.example .env   # then add your Supabase URL and key
npm install
npm run dev            # http://localhost:5173
```

The full setup, including the database scripts, the Google Maps key, and
deployment, is in [web/README.md](web/README.md).

## Earlier version

These videos show the original booking app.

### Presentation
[![Watch the video](https://img.youtube.com/vi/FsuZuMubFpk/0.jpg)](https://www.youtube.com/watch?v=FsuZuMubFpk)

### Pitch deck
[![Watch the video](https://img.youtube.com/vi/ZCs8tcghA64/0.jpg)](https://www.youtube.com/watch?v=ZCs8tcghA64)

## Contributing

Contributions are welcome. To fix a bug or add a feature, fork the repository,
make your change, and open a pull request.

If this project helped you, you can support it with a coffee.

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-Support-blue?style=for-the-badge&logo=coffee&logoColor=white)](https://buymeacoffee.com/jonelpericon)

© Auto-Mate Solutions Inc.
