# 54GNs Apartments Water Motor Rotation & Maintenance Tracker

[![GitHub Repository](https://img.shields.io/badge/GitHub-krishnakanthb13%2F54--GNs-blue?logo=github)](https://github.com/krishnakanthb13/54-GNs)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A minimal, self-contained, high-performance Progressive Web App (PWA) for managing weekly water motor rotation duties and tracking building maintenance bills, collections, and repair issues for apartment residents.

- **Repository**: [https://github.com/krishnakanthb13/54-GNs](https://github.com/krishnakanthb13/54-GNs)
- **Live**: `https://54-gn-s.vercel.app/#bills` opens Bills directly · `https://54-gn-s.vercel.app/#issues` opens Issues directly

---

## 🚀 Key Features

### 💧 Water Motor Duty Rotation
- **Auto-Calculated Schedule**: Computes weekly rotation automatically from a base date. No hardcoded or manual schedules required.
- **Real-Time Status Card**: Displays today's date, ISO week number, week date range, active flat, and a dynamic color-coded countdown to the next rotation.
- **Responsible Flat Highlight**: Large, high-visibility duty card showing active flat and tenant name, cycle progress (e.g. `Flat 5 of 8`), and duty date duration.
- **Rotation Timeline**: Visual quick-glance at Previous, Current, and Next flats with week numbers.
- **Search Flat**: Instant lookup for any flat to see upcoming duty dates and past rotation history.
- **Instructions**: Categorized guidelines for Morning, Evening, Unavailable (WhatsApp delegation), and Emergency handling.
- **Monthly Calendar**: Visual calendar highlighting the current day and active duty week.
- **8-Week Schedule Tables**: Full transparent view of upcoming and previous 8-week duty schedules with flat and tenant details.
- **Export & Share**: Quick actions to Copy week summary, Native Share (WhatsApp/mobile), CSV Export, and PDF/Print.

### 🧾 Maintenance Bills (`maintenance.txt`)
- **Auto-Synced with `maintenance.txt`**: Simply edit `maintenance.txt` to add expenses or collections; the app fetches it with cache-busting (`?t=Date.now()`) and the Service Worker never caches it, so updates appear immediately without rebuilds.
- **Dedicated Bills Page (`#bills`)**: Full-page view with header `← Back` button and URL deep-linking (`#bills`). Opened from the header 🧾 button.
- **Expenses / Paid Tabs (inside Bills page only)**:
  - `📅 Expenses` (default) — existing expense behavior, unchanged.
  - `✅ Paid` — separate collections view with its own summary, search, and list.
  - Switching tabs swaps the summary card, search box, and list; the Copy button label follows the active tab (`📋 Copy Summary` / `📋 Copy Paid Summary`).
- **Expenses View**:
  - Automatically totals each billing period (`- Month Year`) and calculates **Per Flat Share (÷ 8)** with Indian Rupee formatting (`₹`).
  - Monthly headers (e.g. `- August 2026`) show a `📅 Monthly` tag; date headers (e.g. `- 29 July 2026`) show a `⚡ Additional Expense` amber card.
  - Empty months (e.g. `- October 2026` with no items) render as `No entries` with no totals.
  - Summary card: **Total Expenses**, **Per Flat (÷8)**, **Recorded Cycles** (`X Monthly · Y Additional`).
  - Live search filters by month or utility (e.g. `Electric`, `May`).
- **Paid View**:
  - Parses collection lines under `= Paid =` (format `- DATE: TYPE: AMOUNT`, e.g. `- 4 September 2026: Monthly: 513`).
  - Lines starting with `+` are treated as **Additional** collections (amber styling, ⚡ badge) — e.g. `+ 29 July 2026: Drainage: 315`.
  - Each entry renders as a card: monthly entries get a green-accent card with a 💰 type badge; additional entries get an **orange-accent card** (full amber tint) with a ⚡ type badge.
  - Summary card: **Total Collected**, **Entries**, **Records ⓘ** — Records shows counts like `7 Monthly · 3 Additional`; the ⓘ button opens a **Paid Breakdown modal** with each collection type on its own line (💰 for monthly, ⚡ for additional) plus a Total row.
  - Live search filters by date or type (e.g. `Monthly`, `Drainage`, `July`).
  - **Paid Notes & Disclaimers**: Contextual notes card seamlessly integrated into the Paid page:
    - **Payment Dates Note**: Explains that payment dates are recorded for **Flat 7**, and payment dates for other flats should fall around approximately the same dates.
    - **Reconciliation Ledger**: Explains that paid amounts represent a single tenant's share (total building expenses ÷ 8) with historical discrepancy audit notes.
  - Empty state: `No paid collections recorded yet.`
- **One-Click Actions**:
  - 📋 **Copy Summary**: active-tab aware — Expenses formats every period with totals for WhatsApp; Paid lists each `✅ date - type: amount` (adding `(Additional)` to `+` lines) plus a total, separate `📅 Monthly:` / `⚡ Additional:` subtotals, and the Flat 7 payment date note.
  - 🖨️ **PDF / Print**: print-optimized layout; header, footer, actions, search, tabs, and modal are hidden in print.

### ⚠️ Maintenance Issues Tracker (`#issues`)
- **Flat-File Database via `= Issues =`**: Seamlessly tracks apartment and building repair/maintenance issues directly in [`maintenance.txt`](maintenance.txt).
- **Dedicated Issues Page**: Accessible via the header `⚠️` button or `#issues` URL deep-linking with header `← Back` navigation.
- **Automatic Duration Pill (`⏱️`)**: Automatically calculates elapsed duration between `StartDate` and `EndDate` (e.g. `⏱️ 4 days`), or from `StartDate` to today if pending/ongoing (`⏱️ 197 days (Ongoing)`).
- **Template Skipping**: Automatically filters out empty issue templates (such as blank templates left at the top of the section for formatting), only displaying issues with actual logged data.
- **8-Mode Cycling Sort Button (`🔀 Sort`)**:
  - `Default (File)`: Original order as listed in the maintenance text file.
  - `Title (A–Z)`: Alphabetical ascending by issue name.
  - `Title (Z–A)`: Alphabetical descending by issue name.
  - `Start Date (Newest)`: Most recently started issues first.
  - `Start Date (Oldest)`: Earliest started issues first.
  - `End Date (Newest)`: Most recently completed issues first (ongoing issues listed first).
  - `End Date (Oldest)`: Earliest completed issues first (pending issues listed last).
  - `Status (Pending First)`: Prioritizes unresolved/pending issues over completed ones.
- **Summary Metrics Card**:
  - **Total Issues Logged**
  - **Resolved (`✅`)**
  - **Pending (`⏳`)**
- **Live Search**: Instant keyword filtering across title, status, start/end dates, and multi-line context bullet points.
- **Context & Timeline**: Detailed problem descriptions, steps taken, resolution timelines, and owner communication logs.
- **Flat 7 Transparency Note**: Contextual footer note explaining that the log documents issues faced by Flat 7 for accountability and landlord reference.
- **Export & Print**:
  - 📋 **Copy Issues**: Copies formatted WhatsApp-ready text summary of all issues with start/end dates, duration, and context details.
  - 📄 **PDF / Print**: Print-optimized styling with avoidance of awkward page breaks.

### 🎨 Multi-Theme System
Cycles through **6 curated themes** across dark and light modes with persistent `localStorage` preference and mobile `<meta name="theme-color">` syncing:

| Icon | Theme Name | Mode | Description |
|:---:|---|---|---|
| 🌙 | **Dark Slate** | Dark | Deep Navy / Sky Blue accent *(Default)* |
| 🔮 | **Obsidian Violet** | Dark | Midnight Violet / Purple Neon accent |
| 🌲 | **Forest Emerald** | Dark | Deep Midnight Pine / Mint Emerald accent |
| ☀️ | **Pure Sky** | Light | Crisp Cool Slate / Ocean Blue accent |
| ☕ | **Warm Sand** | Light | Cozy Parchment / Amber Terracotta accent |
| 🍃 | **Fresh Mint** | Light | Soft Mint Pastel / Forest Sage accent |

### 🔔 Toast Notification & Resident Feedback System
A lightweight, glassmorphic toast notification system (`#toastContainer`) providing immediate, non-intrusive feedback across the app:
- **Clipboard & Sharing Actions**: Instant confirmations for copying duty week info, maintenance bills summary, paid collection logs, and issues summaries (`📋 Copied...`). Empty data guards notify when there is nothing to copy.
- **Cycling Sort Feedback**: Displays active sort criteria when cycling through issue sort orders (`🔀 Sorted by ...`).
- **File Downloads & Print**: Confirms CSV export generation (`📊 Exported motor rotation schedule (CSV)!`) and print dialog preparation (`🖨️ Preparing printable document...`).
- **Theme Cycling Feedback**: Confirms every theme switch (e.g. `🌙 Theme: Obsidian Violet (Dark)`).
- **Live Search Guard**: Alerts residents when search filters yield zero matches across flats, bills, collections, or issues (`🔍 No flat/bills/collections/issues matching "..."`).
- **Network & Offline Awareness**: Informs residents when connection is lost (`📶 You are currently offline`), when cached records are used (`📶 Offline mode: using cached records`), and when syncing back online (`🌐 Back online! Syncing records...`).
- **PWA Lifecycle Updates**: Detects when a new Service Worker update is downloaded and ready (`🚀 New version available! Reload to apply.`).

---

## 🛠️ Configuration

All configuration is located at the top of [`assets/js/script.js`](assets/js/script.js):

```javascript
// Starting anchor date (must be a Monday)
const START_DATE = "2026-06-01";

// 8 Flats and corresponding tenant names
const FLATS = [
  { name: "Flat 1", tenant: "Sathyanarayana G" },
  { name: "Flat 2", tenant: "Bala Subramaniam" },
  { name: "Flat 3", tenant: "Balaji" },
  { name: "Flat 4", tenant: "Gopal" },
  { name: "Flat 5", tenant: "Kishore" },
  { name: "Flat 6", tenant: "Venkatesan" },
  { name: "Flat 7", tenant: "Krishna Kanth B" },
  { name: "Flat 8", tenant: "Sathyanarayana" }
];

// Duty instructions
const INSTRUCTIONS = [
  { title: "Morning", items: ["Turn ON and OFF motor", "Check overhead tank for overflowing"] },
  { title: "Evening", items: ["Turn ON and OFF motor", "Check overhead tank for overflowing"] },
  { title: "If Unavailable", items: ["Inform WhatsApp group", "Request another resident to help"] },
  { title: "Emergency", items: ["Report pump issues immediately"] }
];

const UPCOMING_WEEKS = 8;
const PREVIOUS_WEEKS = 8;
```

---

## 📝 Updating Maintenance Bills (`maintenance.txt`)

Edit [`maintenance.txt`](maintenance.txt) anytime using this format:

```text
= Paid =

- 29 September 2026: Monthly: 500
- 4 September 2026: Monthly: 513
- 31 July 2026: Monthly: 500
+ 29 July 2026: Drainage: 315
- 1 July 2026: Monthly: 65
- 30 April 2026: Monthly: 628
+ 11 April 2026: Sump & Tank Cleaning: 500
- 9 April 2026: Motor Repair (Compensated): 890
- 31 March 2026: Monthly: 430
+ 26 March 2026: Main Gate Keys: 194

= Expenses =

- October 2026

- September 2026
House Keeping: 3000

- August 2026
House Keeping: 3000
Electricity Bill: 906
Broom Stick: 200

- July 2026
House Keeping: 3000

- 29 July 2026
Drainage Cleaning: 2500

- June 2026
House Keeping: 3000
Electricity Bill: 823

- May 2026
House Keeping: 2000
Drainage Cleaning: 1200

- April 2026
House Keeping: 3000
Electricity Bill: 1729
Flowers: 250

- 12 April 2026
Sump & Tank Cleaning: 3500

- March 2026
House Keeping: 3000
Flowers: 110
EB Expenses: 100
Broom Stick: 200

- 26 March 2026
Main Gate Keys: 1550

= Issues =

Issue:
StartDate:
EndDate:
Status:
Context:

Issue: Drainage Issue in Restroom
StartDate: 05 October 2026
EndDate: 09 October 2026
Status: Completed
Context:
- Water was not going in the bathroom Drainage.
- There was too much reflux and water blockage.
- Corporation was contacted first, and Plumber said it was fine. This was not true.
- Informed Owner and a Plumber who fixes issues at this place came.
- Plumber came and cleaned it with hose pipe.
- The blockage was full of small broken bricks and tiny plastic covers.

Issue: Tiles Broken in Bedroom
StartDate: 12 September 2026
EndDate: 03 October 2026
Status: Completed
Context:
- When we locked the house and went to TTD for 5 day.
- Upon returning found 6+ tiles broken in the bedroom.
- This was the same place where the walking on it caused a hollow noise earlier.
- Upon patiently waiting for ~3 weeks after informing, and following up twice.
- Mason came and fixed the tiles. He removed all the broken tiles and laid new ones.

Issue: Bathroom Taps & Rusted Shower
StartDate: 06 August 2026
EndDate: 05 October 2026
Status: Pending
Context:
- Within 6 months the bathroom taps and shower became loose and rusted.
- Raised with the owner on 06 August; estimate shared on 12 August (material + labour ≈ 1,800-1,900).
- Plumber came on 14 August but said he only handles plumbing, not cement work.
- On 05 October the plumber fixed the washing machine tap, wash basin tap and shower head.
- Actual cost: Shower head 295, Wash basin tap 644, PVC hose 80, Washing machine tap 100, Pipe connector 20, Labour 450 - total 1,589.
- Owner payment has not been completed.

Issue: Pending Masonry Work (Roof, Gadapa, Bathroom Step, Tile Gaps)
StartDate: 09 May 2026
EndDate: Nill
Status: Pending
Context:
- Rainwater drips from an electricity pipe, and with no gadapa at the front gate water enters the hall.
- Roof needs sealing of holes and gaps (rain leakage), which also causes sparks in electric plugs.
- Gadapa needs installation with a tile to stop water seeping into the hall.
- Bathroom step needs fixing; parts of it are sharp and cut the skin.
- Rooms need sealing of gaps around the slab and tiles; ants and insects come out of the gaps.
- Informed repeatedly (09 May, 25 May, 11 June, 13 July, 30 July, 05 October); mason has still not come.

Issue: Moist Electric Box
StartDate: 24 March 2026
EndDate: Nill
Status: Pending
Context:
- The Electric Box which is inside the hall is having Moist/Water logging inside it.
- First noticed around 24 March 2026, when the electrician found the EB pipe wet, which had caused a short circuit.
- Informed the owner, he initially ignored it. Later he came to check it by himself.
- Then informed him multiple times, and he said he would send someone.
- Additionally he also asked for some kind of proof of the water leak condition.
- Related: the Gadapa, Bathroom Step and Tile Gaps are tracked under the "Pending Masonry Work" issue.

Issue: Painter Payment
StartDate: 18 February 2026
EndDate: 25 May 2026
Status: Completed
Context:
- After paying for the Painting Job from my end.
- Initially Owner informed that it would be compensated in the rent payment.
- Later he wanted the Painter to come in and sign the Voucher and only then he would pay the Painter Directly.
- This was odd, because the Painter was hospitalised and unreachable.
- Informed the Owner about the condition and asked him to do the needful.
- I requested rent deduction instead of voucher.
- He came, compensated the amount, after reaching out twice.
- Quotation: ₹25,000 (5 days + 1 electric day), ₹13k advance.
```

### Syntax Rules:
1. **Section Headers**: `= Paid =`, `= Expenses =`, and `= Issues =` (case-insensitive, `=` on both sides). Everything under `= Paid =` is parsed as collections; everything under `= Expenses =` is parsed as expenses; everything under `= Issues =` is parsed as maintenance issues.
2. **Paid Lines**: `- DATE: TYPE: AMOUNT` (e.g. `- 4 September 2026: Monthly: 513`). Date is everything before the second-last colon, type is the second-last segment, amount is the last number. Two-segment lines (`- 31 July 2026: 500`) fall back to type `Paid`. A `+` prefix marks the entry as **Additional** (e.g. `+ 29 July 2026: Drainage: 315`) — shown with ⚡ amber styling instead of the standard 💰 green badge.
3. **Expense Groups**: `- Month Year` headers (e.g. `- April 2026`) display a `📅 Monthly` tag; `- DD Month Year` headers (e.g. `- 12 April 2026`) are auto-detected as **`⚡ Additional Expense`** with amber styling.
4. **Expense Line Items**: `Utility Name: Amount` (e.g. `House Keeping: 3000`).
5. **Issue Blocks**:
   ```text
   Issue: Problem Name
   StartDate: DD Month Year
   EndDate: DD Month Year (or Nill / Pending)
   Status: Completed | Pending
   Context:
   - Bullet point note 1
   - Bullet point note 2
   ```
   - The template block with empty fields is automatically skipped.
   - Day differences between `StartDate` and `EndDate` are calculated automatically and rendered as duration pills (e.g. `⏱️ 4 days`, or `⏱️ 197 days (Ongoing)` when ongoing).
6. Leave blank lines between entries for readability.

---

## 📂 Project Structure

```
/
├── assets/
│   ├── css/
│   │   └── styles.css        # CSS variables, 6 theme palettes, card layouts, tabs, responsive grid, print styles
│   ├── js/
│   │   └── script.js         # Rotation math, section splitter, expense/paid/issue parsers, stats, modal, theme cycler
│   └── icons/
│       ├── favicon.ico       # Multi-resolution ICO (16x16, 32x32, 48x48)
│       ├── favicon.svg       # Scalable vector droplet icon
│       ├── apple-touch-icon.png # iOS touch icon (180x180)
│       ├── icon-192.png      # PWA icon (192x192)
│       └── icon-512.png      # PWA splash icon (512x512)
├── docs/
│   ├── CODE_DOCUMENTATION.md # Architecture & technical documentation
│   ├── DESIGN_PHILOSOPHY.md  # Core principles & design rationale
│   ├── info.txt              # Project specifications & user requirements
│   └── seed-prompt.txt       # Foundation prompt & domain rules
├── favicon.ico               # Root favicon for Vercel & search engine detection
├── index.html                # Semantic HTML5: rotation view, tabbed Bills view, Issues view, modal, toast container
├── maintenance.txt           # `= Paid =` collections + `= Expenses =` billing groups + `= Issues =` log (never cached by SW)
├── manifest.json             # Progressive Web App (PWA) configuration (relative paths)
├── sw.js                     # Service Worker for offline caching (bypasses maintenance.txt)
├── vercel.json               # Vercel deployment configuration (headers, caching, cleanUrls)
├── README.md                 # Documentation & user guide
└── LICENSE                   # MIT License
```

Key DOM/JS hooks:
- Bills tabs: `#expensesTabBtn`, `#paidTabBtn`, `#expensesPane`, `#paidPane`, `#expensesSummaryCard`, `#paidSummaryCard`
- Expenses: `#billStatsGrid`, `#billSearchInput`, `#billContent`
- Paid: `#paidStatsGrid`, `#paidSearchInput`, `#paidContent`, `#paidInfoBtn`, `.bill-note-card`, `#paidBreakdownModal`, `#paidBreakdownBody`, `#paidBreakdownClose`
- Issues: `#issuesView`, `#issuesSummaryCard`, `#issueStatsGrid`, `#issueSortBtn`, `#issueSearchInput`, `#issuesContent`, `.issue-note-card`, `#issueCopyBtn`, `#issuePrintBtn`
- Views & Nav: `#rotationView`, `#billsView`, `#issuesView`, `#backBtn`, `#billBtn`, `#issuesBtn`, deep-links `#bills` and `#issues`

---

## 🌐 Deployment & Local Usage

The project uses **100% relative paths** (`./`) with zero build dependencies, so it runs seamlessly across any static host:

### 1. Vercel (Recommended)
Configured out-of-the-box via [`vercel.json`](vercel.json):
- **Zero-Build Static Hosting**: Connect your GitHub repository to Vercel for instant automatic deployments.
- **Service Worker Cache Busted**: Header `Cache-Control: public, max-age=0, must-revalidate` on `/sw.js` ensures resident browsers instantly detect new application updates.
- **Dynamic Database Bypass**: Header `Cache-Control: no-cache, no-store, must-revalidate` on `/maintenance.txt` allows immediate billing changes without rebuilds.
- **Favicon & Crawler Detection**: Root [`favicon.ico`](favicon.ico) and vector [`assets/icons/favicon.svg`](assets/icons/favicon.svg) are automatically picked up by Vercel's project dashboard, social link scrapers, and mobile browsers.
- **Security Headers Included**: Injects `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection`, and `Referrer-Policy`.

### 2. GitHub Pages / Subdirectories
Works directly in any subdirectory path without routing configuration (e.g. `https://krishnakanthb13.github.io/54-GNs/`).

### 3. Local Preview
Serve locally using Python or Node.js:
```bash
# Python
python -m http.server 8080

# Or Node.js
npx serve .
```
Then open `http://localhost:8080` in your browser.

---

## 📚 Technical Documentation

For in-depth architectural specifications and design ideology, consult the documents in [`docs/`](docs/):
- **[Code Documentation](docs/CODE_DOCUMENTATION.md)**: Deep dive into the rotation arithmetic, regex billing parser, DOM selector architecture, and PWA caching lifecycle.
- **[Design Philosophy](docs/DESIGN_PHILOSOPHY.md)**: Core mission, rationale behind the flat-file database, Flat 7 contextual notice, and reconciliation audit principles.

---

## 📄 License

Distributed under the [MIT License](LICENSE).
