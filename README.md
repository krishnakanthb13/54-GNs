# 54GNs Apartments Water Motor Rotation & Maintenance Tracker

[![GitHub Repository](https://img.shields.io/badge/GitHub-krishnakanthb13%2F54--GNs-blue?logo=github)](https://github.com/krishnakanthb13/54-GNs)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A minimal, self-contained, high-performance Progressive Web App (PWA) for managing weekly water motor rotation duties and tracking building maintenance bills and collections for apartment residents.

- **Repository**: [https://github.com/krishnakanthb13/54-GNs](https://github.com/krishnakanthb13/54-GNs)
- **Live**: `https://54-gn-s.vercel.app/#bills` opens the Bills page directly

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
  - Empty months (e.g. `- September 2026` with no items) render as `No entries` with no totals.
  - Summary card: **Total Expenses**, **Per Flat (÷8)**, **Recorded Cycles** (`X Monthly · Y Additional`).
  - Live search filters by month or utility (e.g. `Electric`, `May`).
- **Paid View**:
  - Parses collection lines under `= Paid =` (format `- DATE: TYPE: AMOUNT`, e.g. `- 4 September 2026: Monthly: 513`).
  - Lines starting with `+` are treated as **Additional** collections (amber styling, ⚡ badge) — e.g. `+ 29 July 2026: Drainage: 315`.
  - Each entry renders as a card: monthly entries get a green-accent card with a 💰 type badge; additional entries get an **orange-accent card** (full amber tint) with a ⚡ type badge.
  - Summary card: **Total Collected**, **Entries**, **Records ⓘ** — Records shows counts like `6 Monthly · 3 Additional`; the ⓘ button opens a **Paid Breakdown modal** with each collection type on its own line (💰 for monthly, ⚡ for additional) plus a Total row.
  - Live search filters by date or type (e.g. `Monthly`, `Drainage`, `July`).
  - Empty state: `No paid collections recorded yet.`
- **One-Click Actions**:
  - 📋 **Copy Summary**: active-tab aware — Expenses formats every period with totals for WhatsApp; Paid lists each `✅ date - type: amount` (adding `(Additional)` to `+` lines) plus a total and separate `📅 Monthly:` / `⚡ Additional:` subtotals.
  - 🖨️ **PDF / Print**: print-optimized layout; header, footer, actions, search, tabs, and modal are hidden in print.
- **Toast Notifications**: copy confirmations, theme changes, and Paid info feedback via bottom toasts.

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

---

## 🛠️ Configuration

All configuration is located at the top of [`script.js`](script.js):

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

- 4 September 2026: Monthly: 513
- 31 July 2026: Monthly: 500
+ 29 July 2026: Drainage: 315
- 1 July 2026: Monthly: 65
- 30 April 2026: Monthly: 628
+ 11 April 2026: Sump & Tank Cleaning: 500

= Expenses =

- September 2026

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
```

### Syntax Rules:
1. **Section Headers**: `= Paid =` and `= Expenses =` (case-insensitive, `=` on both sides). Everything under `= Paid =` is parsed as collections; everything under `= Expenses =` is parsed as expenses. If no headers exist, the whole file is treated as Expenses (backward compatible).
2. **Paid Lines**: `- DATE: TYPE: AMOUNT` (e.g. `- 4 September 2026: Monthly: 513`). Date is everything before the second-last colon, type is the second-last segment, amount is the last number. Two-segment lines (`- 31 July 2026: 500`) fall back to type `Paid`. A `+` prefix marks the entry as **Additional** (e.g. `+ 29 July 2026: Drainage: 315`) — shown with ⚡ amber styling instead of the standard 💰 green badge.
3. **Expense Groups**: `- Month Year` headers (e.g. `- April 2026`) display a `📅 Monthly` tag; `- DD Month Year` headers (e.g. `- 12 April 2026`) are auto-detected as **`⚡ Additional Expense`** with amber styling.
4. **Expense Line Items**: `Utility Name: Amount` (e.g. `House Keeping: 3000`).
5. Leave blank lines between periods for readability; empty months render as `No entries` with no totals.

---

## 📂 Project Structure

```
/
├── index.html        # Semantic HTML5: rotation view, tabbed Bills view (Expenses/Paid panes), Paid breakdown modal, toast container
├── styles.css        # CSS variables, 6 theme palettes, card layouts, bill tabs, paid cards, modal, toast, responsive grid, print styles
├── script.js         # Rotation math, section splitter + expense/paid parsers, stats + list renderers, tab router, modal, theme cycler, view router
├── maintenance.txt   # `= Paid =` collections + `= Expenses =` billing groups (never cached by SW)
├── manifest.json     # Progressive Web App (PWA) configuration (relative paths)
├── sw.js             # Service Worker for offline caching with relative paths (bypasses maintenance.txt)
├── README.md         # Documentation & guide
└── LICENSE           # MIT License
```

Key DOM/JS hooks:
- Bills tabs: `#expensesTabBtn`, `#paidTabBtn`, `#expensesPane`, `#paidPane`, `#expensesSummaryCard`, `#paidSummaryCard`
- Expenses: `#billStatsGrid`, `#billSearchInput`, `#billContent`
- Paid: `#paidStatsGrid`, `#paidSearchInput`, `#paidContent`, `#paidInfoBtn`, `#paidBreakdownModal`, `#paidBreakdownBody`, `#paidBreakdownClose`
- Views: `#rotationView`, `#billsView`, `#backBtn`, `#billBtn`, deep-link `#bills`

---

## 🌐 Deployment & Local Usage

The project uses **100% relative paths** (`./`) with zero build dependencies, so it runs seamlessly anywhere:

1. **GitHub Pages / Subdirectories**: Works directly in any path or subpath (e.g. `https://krishnakanthb13.github.io/54-GNs/`).
2. **Vercel / Netlify**: Deploy with zero build step.
3. **Local Preview**: Open `index.html` via any static file server:
   ```bash
   npx serve .
   ```

---

## 📄 License

Distributed under the [MIT License](LICENSE).
