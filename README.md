# Orrery: time.druidchem.com

A private, offline calendar of orbits that feels like home: a warm greeting, one "what to do now" line, a small "next up", and the ring face (sun dial in the centre, Moon and Galaxy rings, and a row of five habit rings under the dial: Satisfying work, Gym, 中文, Protein, Water). Plain static files: no build step, no server code, no tracking, no outside requests.

## Files
| File | What it is |
|---|---|
| `index.html` | App shell and PWA meta tags (home-screen name "Orrery") |
| `styles.css` | Dark theme in an Apple-like style. Black sky with faint stars, soft motion, responsive: 5 bottom tabs on iPhone, side panel from 900 px wide |
| `app.js` | All the logic: orbits, NOAA sun times, Moon, Day Shape, voice, store, views, reminders |
| `words.js` | 80 HSK 1–3 words for the word of the day (rotates by date) |
| `sw.js` | Service worker for offline use. **Bump `VERSION` on every deploy** so phones pick up the update |
| `manifest.webmanifest`, `icons/` | Install to the home screen |

## Layout
- **Now:** greeting, now-line, next-up, the face, then at most two cards: one that fits the moment (after-waking checklist in the morning, a calm drift line after midday if nothing's logged, birthdays, tonight's checklist plus the after-waking preview at night) and a quick-log row. Quick buttons: I'm awake, +25m satisfying work, 💧 +250 ml, +500 ml, Food & sugar. Tap a habit ring to log it. Tap the Galaxy ring to open Cosmos. The tooth on the night side of the dial ticks "brushed".
- **Today:** Day Shape (a gentle rhythm anchored to wake time, sunset and bedtime, adjustable under "Adjust the shape"), Satisfying work with a timer, Gym, 中文 with the word of the day, Water (+250 ml glass, +500 ml bottle; 2.5 L goal, editable in Settings), Food & protein with an optional sugar low/med/high, journal, checks, light & sleep.
- **Cycles:** Moon sprint and review, Turn progress, goals (empty until you plot one, with a 3-question guide), Yearly Mirror.
- **Life:** Life ring, galaxy perspective, Firsts log, People orbit (Mom, Dad, Girlfriend, Friend pre-added: rename, set how often, add a birthday).
- **Journal:** one line a day.
- **Cosmos (✦, top right)** and **Settings (⚙, top right)**.

## Deploy
Upload the folder as-is to any static host (Cloudflare Pages, Netlify, Vercel, GitHub Pages, or S3 + CloudFront). Then add a `CNAME` record for `time` on druidchem.com pointing at the host. HTTPS is required for offline use, install, notifications and "Use my location".
Install: on iPhone, Safari → Share → Add to Home Screen. On Mac, use Safari → File → Add to Dock, or Chrome's install icon.

## Your data
Everything stays in this browser's localStorage under `druid-time-v1`. Nothing leaves the device. A different browser or device won't see it, and clearing site data wipes it. Use Settings → Export backup now and then, and Import to restore or to move to another device.

## Reminders (all off by default, silent)
Sunrise light, habits still open (2 h before sunset), sunset review, brush teeth before bed, and birthdays (3 days before and on the day, from 09:00). They're scheduled inside the app, so they only fire while Orrery is open, or running in a background tab on a Mac. There is no push server. On iPhone, web notifications need iOS 16.4+ and Orrery added to the Home Screen, and even then they won't fire while the app is closed. If notifications aren't allowed, reminders show as in-app messages instead.

## Customise
At the top of `app.js`: `RING_ORDER` (big rings, outside → in), `HABIT_RINGS` (the habit row, up to 5), `DEFAULT_SHAPE` (the starting rhythm), `DEFAULT_MORNING`, `DEFAULT_PEOPLE`, `DEFAULT_PLACE`, `MOTTO`. Name, goals, place, birth date, the after-waking list and reminders are all in Settings.

## Colour palettes
Settings → Colour palette. **Nebula Aurora** (default) gives deep-space violet-black with a violet → electric blue → aurora teal glowing galaxy ring. The other presets are Cosmic Blue, Druid Green, Sunset Ember, Nebula Violet, Monochrome and Ocean Teal. **Custom** has native colour pickers for the accent, galaxy, moon, sun dial and the 5 habit rings. A palette applies instantly through CSS variables and the SVG ring drawing. It's saved in localStorage (`palette`, `custom`) and included in Export/Import. To add a preset, add an entry to `PALETTES` in `app.js`. All palettes are dark; there's no light variant.
