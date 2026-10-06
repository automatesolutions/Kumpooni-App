# Kumpooni web design system

This file is the rulebook for how the Kumpooni web app looks and reads.
The tokens live in `src/styles/tokens.css`. Every screen uses them. Do not
hard-code a colour, size or radius in a component.

## Brand

Kumpooni keeps the history of every repair in the Philippines: cars and
motorcycles, homes and construction, electrical, aircon, appliances, computers,
and phones. It saves the quote, the photos, and every visit, answers questions
from what was saved, and drafts a complaint if the repair fails.
The tone is a trusted mechanic friend: direct, warm, and clear about money and
time. It never sounds like a lawyer and never promises an outcome.

- **Primary colour:** Kumpooni red `#B61616` (from the app icon and mascot cap).
- **Mascot:** use `public/images/mascot.png` for empty states and the welcome
  screen only. One mascot per screen at most.
- **Logo:** `public/images/mascot-round.png` next to the word "Kumpooni".

## Colour tokens

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--brand` | `#B61616` | `#D93A40` | Fills: primary buttons, badges, active underline (white text on it is 4.5:1+) |
| `--brand-strong` | `#951111` | `#C42D33` | Hover and pressed on brand fills |
| `--brand-text` | `#B61616` | `#EF6266` | Red text and icons: links, active tab, CTAs (4.5:1+ on every surface) |
| `--brand-soft` | `#FBEBEA` | `#3A1517` | Selected chips, badges |
| `--ink` | `#1A1714` | `#F3EFEA` | Headings and body text |
| `--ink-2` | `#4B453F` | `#C9C2B9` | Secondary text |
| `--ink-3` | `#6B645C` | `#9C958C` | Meta text, placeholders (4.5:1 on paper) |
| `--paper` | `#F7F4F0` | `#121010` | Page background |
| `--surface` | `#FFFFFF` | `#1C1A18` | Cards, dialogs, header |
| `--surface-2` | `#F1EDE7` | `#26231F` | Inputs, image wells, hover |
| `--line` | `#E6E0D8` | `#34302B` | Borders and dividers |
| `--ok` / `--warn` / `--info` | green / amber / blue | lighter tints | Order status only |

Red means "act" or "error". Do not use red for decoration.

## Type

Fonts come from Google Fonts (OFL). Fontshare’s General Sans/Switzer
were dropping the space glyph in Chrome, so words ran together.

Switzer was tested again on 2026-10-03. The font file itself has a normal
space, so the bug came from Fontshare's CDN. It is still not used, for two
reasons. It has no peso sign (₱), so every price would fall back to another
font. And its licence (ITF FFL) does not allow the font files to be made
available to others, which a public GitHub repo would do. Any replacement
font must include ₱ and allow open redistribution (OFL).

- **Display:** Plus Jakarta Sans 600/700, for page titles, card titles and prices.
- **Body:** Source Sans 3 400/500/600, for everything else.
- **Numbers:** prices and times use `font-variant-numeric: tabular-nums`.

| Token | Size / line height | Use |
| --- | --- | --- |
| `--text-xs` | 12 / 16 | Badges, legal |
| `--text-sm` | 14 / 20 | Meta, helper text |
| `--text-md` | 16 / 24 | Body, inputs (never smaller on inputs, so iOS does not zoom) |
| `--text-lg` | 18 / 26 | Card titles |
| `--text-xl` | 22 / 28 | Section titles |
| `--text-2xl` | 28 / 34 | Page titles |
| `--text-3xl` | clamp(34px, 5vw, 52px) | Home hero only |

## Space, size and shape

- Spacing is a 4px grid: `--space-1` (4) to `--space-16` (64).
- Content is at most `--content-max` (1180px) wide, with a 16px gutter on phones
  and 24px from 768px up.
- Radius: `--radius-sm` 8 (inputs, chips), `--radius-md` 14 (cards),
  `--radius-lg` 22 (dialogs, hero), `--radius-pill` for pills.
- Every control people tap is at least **44 x 44px** (Apple HIG). Use
  `--tap` for the minimum.
- Shadows are soft and rare: `--shadow-sm` on cards when hovered,
  `--shadow-lg` on dialogs and sticky bars.

## Layout

- **Navigation is the same everywhere:** Home, Repairs, DTI offices, Account.
  From 768px up it sits in the sticky top bar. Under 768px it is a bottom tab bar.
  History lives inside Repairs (newest trip first). Ask lives on a file and on
  Repairs, and only shows once there is something to search.
- A guest session shows a "Trying it" pill in the top bar instead of a blank account.
- **768px and up:** two-column file page, with secondary tools in the right column.
- Every URL can be opened directly and shared. Screens that need an account
  send people to sign-in and bring them back afterwards (`?next=`).

## Components

- **Button:** `primary` (brand fill), `secondary` (ink outline),
  `ghost` (no border), `danger` (red outline). Sizes `md` (44px) and `lg` (52px).
  Labels are verbs that say what happens.
- **Chip:** single-select filters and date/time slots, `aria-pressed` for state.
- **Card:** surface, 1px line border, `--radius-md`. Clickable cards lift 2px
  on hover.
- **Dialog:** native `<dialog>`, so Esc and focus trapping work. Use for
  confirmations, quantity picks and location.
- **Next-step coach:** one primary button per screen for a repair, from
  `lib/next-step.ts` (Save the quote, Log this trip, Add another visit, Write the
  complaint). Under it, one short line in the mechanic-friend voice. Slip, letter,
  Ask, DTI and the PDF stay secondary until they are relevant.
- **States:** every list has a loading skeleton, an empty state that says why
  it is empty and what to do, and an error state with a retry button.

## Icons

Icons come from Iconify, Tabler set (MIT), as inline SVG components in
`src/components/icons.tsx`. That file is generated: add an icon by mapping a
name to a Tabler id in `scripts/build-icons.mjs`, then run
`node scripts/build-icons.mjs`. Browse ids at icon-sets.iconify.design/tabler.

- Stroke width 2 (1.75 at 24px+). Colour, fill and stroke come from CSS
  (`currentColor`); the paths carry no paint, so they can be recoloured and animated.
- Do not draw icons by hand, generate them, or mix in another icon set.
- Animated icons come from Lordicon (`src/assets/lordicon/`, played by
  `components/LordIcon.tsx`). The free licence is CC BY-ND 4.0: keep the credit link
  in the footer, and do not edit the animation itself.
- Brand and category images come from Supabase storage.
- Home page illustrations live in `public/images/home/` as WebP. They were made
  with Higgsfield in the brand palette (paper #F7F4F0, ink #1A1714, one small red
  #B61616 accent), flat shapes with soft paper grain, no text in the image.

## Motion

- Page motion uses GSAP. Import it from `src/lib/gsap.ts`, which registers
  ScrollTrigger, ScrollSmoother and SplitText. Wrap every animation in `useGSAP`
  plus `gsap.matchMedia()` with `MQ.motion`, so it cleans up on unmount and does
  nothing under `prefers-reduced-motion: reduce`.
- Home page: line reveal on the hero heading, a pinned hero on wide screens,
  word reveals on section headings, staggered cards. Reference bar: gsap.com/showcase.
- Smooth scrolling (ScrollSmoother, `useSmoothScroll()`) is on the home page only,
  on wide screens with a mouse. It moves content with a transform, which breaks
  `position: sticky`, so pages with sticky summaries or action bars keep native scroll.
  Touch screens always keep native scroll.
- Hover and press feedback stays in CSS: `--dur-fast` 120ms (hover), `--dur` 200ms
  (enter), `--dur-slow` 320ms (dialogs), easing `--ease`.
- The hero heading uses Canvas UI Particle Reveal (`components/canvasui/`,
  installed from the shadcn registry). It needs Chrome's experimental html-in-canvas
  API. Every other browser shows the plain heading.

## Copy rules

Follow the `/my-tone` skill. In short:

- Sentence case everywhere. "Start a repair file", not "Start A Repair File".
- Buttons say the action: "Start a repair file", "Draft my complaint",
  "Send code". Not "Submit" or "OK".
- Legal hints say "may" and end with "It is not a legal finding." Letters
  always show the not-legal-advice line.
- One idea per sentence. Lead with what the person needs.
- Errors say what happened and what to do next, without blame.
- Empty states say why it is empty and give one next step.
- Use "₱" with two decimals for money, and 12-hour time ("9:30 AM").
- Banned words: delve, seamless, game-changer, unlock, elevate, leverage,
  empower, robust, cutting-edge, revolutionize, harness, journey,
  "simply", "just", "easy", "please".
