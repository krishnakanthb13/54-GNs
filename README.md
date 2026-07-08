# 54GNs Apartments Water Motor Rotation

A minimal, self-contained PWA for tracking weekly water motor rotation schedule in apartment buildings.

## Features

- **Auto-calculated rotation** — No manual editing needed. Just set the start date and flat list.
- **Status card** — Today's date, ISO week number, week period, current flat, and color-coded countdown.
- **Responsible flat** — Shows current flat with cycle progress (e.g., Flat 5 of 8).
- **Actions** — Copy, Share, CSV export, PDF/Print.
- **Rotation timeline** — Previous, current, and next flat with week numbers.
- **Search** — Look up any flat's next/previous rotation and upcoming cycles.
- **Instructions** — Morning, evening, unavailable, and emergency instructions.
- **Monthly calendar** — Current month with today and duty week highlighted.
- **Upcoming weeks** — 8-week table with week number, flat, and dates (always visible).
- **Previous weeks** — 8-week table with week number, flat, and dates (always visible).
- **Dark/Light mode** — Default dark, remembers user preference.
- **Offline support** — Works after first load via Service Worker.
- **Responsive** — Mobile-first, works on all screen sizes.
- **PWA** — Installable as a standalone app.
- **Loading animation** — Lightweight spinner on initial load.

## Configuration

Edit the top of `script.js`:

```javascript
const START_DATE = "2026-06-08";
const FLATS = ["Flat 1", "Flat 2", "Flat 3", "Flat 4", "Flat 5", "Flat 6", "Flat 7", "Flat 8"];
const INSTRUCTIONS = [
  { title: "Morning", items: ["Turn ON and OFF motor", "Check overhead tank for overflowing"] },
  { title: "Evening", items: ["Turn ON and OFF motor", "Check overhead tank for overflowing"] },
  { title: "If Unavailable", items: ["Inform WhatsApp group", "Request another resident to help"] },
  { title: "Emergency", items: ["Report pump issues immediately"] }
];
const UPCOMING_WEEKS = 8;
const PREVIOUS_WEEKS = 8;
```

Changing only these values updates the entire app.

### How rotation works

The responsible flat is calculated as:
```
weeks elapsed since start date % number of flats
```

- Week 0 → Flat 1
- Week 1 → Flat 2
- ...
- Week 7 → Flat 8
- Week 8 → Flat 1 (repeats forever)

No hardcoded schedule. The rotation continues indefinitely.

### How to change flats

Edit the `FLATS` array in `script.js`:

```javascript
const FLATS = ["Flat A", "Flat B", "Flat C"];
```

### How to change start date

Edit `START_DATE` in `script.js`. The date must be a Monday:

```javascript
const START_DATE = "2027-01-04";
```

## Deployment

1. Push to GitHub
2. Import repo in Vercel
3. Deploy — no build step needed

Works directly by dragging into Vercel.

## File Structure

```
/
├── index.html      # Main HTML
├── styles.css      # All styles (dark/light, responsive, print, animations)
├── script.js       # All logic and configuration
├── manifest.json   # PWA manifest
├── sw.js           # Service worker for offline
├── README.md       # This file
└── LICENSE         # MIT license
```

## Tech Stack

- HTML5
- CSS3 (CSS Variables, Grid, Flexbox, Animations)
- Vanilla JavaScript (ES6+, Strict Mode)
- No frameworks, no dependencies
- PWA with Service Worker

## License

MIT
