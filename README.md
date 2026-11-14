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
| `screenshot-flat.png`, `screenshot-helix.png` | iPhone previews of the Now face, flat and helix |
| `screenshot-quiet-flat.png`, `screenshot-quiet-helix.png` | iPhone previews in Quiet mode (the default) |

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

## Rings (outermost → innermost)
Galaxy (Sun around Sagittarius A*) → **Sun** (Earth's year, counted from 1 Jan, labelled "SUN · DAY 318/365") → Moon (synodic month) → Day (the sun dial: sunrise/sunset, Day Shape zones, chores). Read time from the biggest cycle down to the smallest. Every palette, Custom included, has a `sunRing` colour; it's golden in Nebula Aurora.

## Chores on the sun
Small icons sit on the day dial at their time. Tap one to tick it. Done chores dim and get a green tick, overdue ones (more than 30 min late, same day) glow softly, and the toast shows the streak and when it's next due. Edit them in Today → Chores on the sun → Edit chores: icon, name, time, and repeat (daily, chosen weekdays, every N days from a start date, or weekly). The seeds are 💧 refill water bottle, 🏋️ gym (Mon–Sat), 🧺 laundry every 3 days and 🧹 tidy room, plus the built-in 🦷 teeth at bedtime. Ticks are stored per day (`days[date].chores`), and chores are kept in `chores`.

## Quiet mode (on by default)
Orrery stays visual and doesn't talk unless you ask. With Quiet mode on:
- The Now face has no words: no ring names, no hour numbers, no NOW label, no helix day labels or hints, no chore names or times, and no names or values under the habit rings. The header is just a small "Good morning, Lav.", with no witty line, block subtitle or "Next" pill.
- The helix/flat switch is an icon (a coil for helix, a circle for flat). The tab bar shows icons only, and on Mac the side panel shrinks to a narrow icon rail.
- **Long-press anything** (about half a second) to see what it is: a ring, a chore, the tooth, a habit ring, a quick button or a tab. A small tooltip fades after about 2 seconds, and the long-press doesn't tick or open anything. A normal tap still logs, ticks or opens, and tapping the centre still shows the time briefly.
- There are no drift, "bread and circus", fasted or "Today so far" text lines, and no confirmation toasts. Toasts still appear for problems, backups, location and reset. Reminders you turned on still arrive.
- The quick buttons use icons: ☀︎ awake, +25m, 💧 250 ml, 💧💧 500 ml, 🍽 food.
- The dream prompt after "I'm awake" is just ✦ and a text box. ✦ saves it, ⋯ opens the full form (title, vividness, mood, lucid, date), and ✕ skips.

Turn it off in **Settings → Quiet mode** to bring back the labels, Orrery's voice, nudges and toasts. Cosmos, Today, Cycles, Life, Journal and Settings keep their words, since those screens are for reading. The setting is saved (`quiet`) and included in Export/Import. Older backups open with Quiet mode on.

## No clock in the middle: it's all visuals
The Now face shows no digital time, no SPIN % and no "Sunset in…" in the centre. The current moment is shown with pictures only: a glowing sun marker travels around the day ring (in the helix it's the glowing NOW point at the front), and the centre holds a soft sun glyph by day or the current Moon phase by night. If you do want the numbers, tap the centre glyph: a small tooltip shows the time and how long until sunset for about 3 seconds, then fades. The greeting, the "what to do now" line and "Next" above the face are the same as before. The Cosmos orrery still shows its clock.

## Helix view
The helix button (coil icon, top-left of the Now face) tips the day dial back into a 3D time helix. Today's loop sits at the bottom with NOW glowing at the front. Each turn up is one day (24 h), and you can see the next 3 days. Repeating chores sit on every turn they fall on, so a daily chore makes a vertical column. Nearer icons are bigger and brighter, and further ones fade. Day labels mark each turn, and a faint second strand with rungs gives it the DNA look. Drag sideways to rotate it, and it eases back when you let go. Icons stay tappable. If your device asks for reduced motion, the switch is instant and there's no drift. The choice is remembered (`orbit`). Tap the circle icon to go back to flat.

## Dream journal
Under Today → Light & sleep. Tapping "I'm awake" opens "Catch the dream before it fades ✦" if last night has no dream yet. Each entry has an optional title, the dream text, vividness 1–5, mood tags (calm, weird, scary, lucid, joyful, flying, chase, falling, water, people), a lucid toggle, and the night's date (auto-filled with last night). Past dreams are listed newest first, with search across text, tags and dates, plus stats: count, lucid count, average vividness and the most common tags. Stored in `dreams`, included in Export/Import.
