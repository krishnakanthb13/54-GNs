# 54GNs Apartments Water Motor Rotation & Maintenance Tracker

[![GitHub Repository](https://img.shields.io/badge/GitHub-krishnakanthb13%2F54--GNs-blue?logo=github)](https://github.com/krishnakanthb13/54-GNs)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A minimal, self-contained, high-performance Progressive Web App (PWA) for managing weekly water motor rotation duties and tracking building maintenance bills for apartment residents.

- **Repository**: [https://github.com/krishnakanthb13/54-GNs](https://github.com/krishnakanthb13/54-GNs)

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
- **Auto-Synced with `maintenance.txt`**: Simply edit or update `maintenance.txt` to add new months or expenses; the app dynamically pulls and parses updates without rebuilds.
- **Dedicated Page View with Back Navigation**: Seamless full-page view matching the rotation dashboard cards, with a header `← Back` button and direct URL deep-linking (`#bills`).
- **Dynamic Expense Calculations**:
  - Automatically totals expenses for each active billing period (`- Month Year`).
  - Calculates the **Per-Tenant Share (÷ 8)** with Indian Rupee formatting (`₹`).
  - For months with no expenses recorded (e.g. `- July 2026`), totals are cleanly omitted.
- **KPI Summary Grid**: Top overview card displaying **Total Recorded Expenses**, **Overall Per-Tenant Share**, and **Active Billing Cycles**.
- **Live Search & Filter**: Instant search box to filter by month or specific utility (e.g., `Electric`, `Drainage`, `July`).
- **One-Click Actions**:
  - 📋 **Copy Summary**: Formats all billing periods into a clean clipboard message for WhatsApp.
  - 🖨️ **Print Bills**: Clean, paper-optimized layout for printing or saving to PDF.

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

You can edit [`maintenance.txt`](maintenance.txt) anytime using this format:

```text
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
1. **Monthly Cycles**: Headers starting with a month name (e.g. `- April 2026`, `- March 2026`) are displayed with a `📅 Monthly` tag.
2. **Special / Ad-hoc Expenses**: Headers starting with a specific date (e.g. `- 12 April 2026`, `- 29 July 2026`, `- 26 March 2026`) are automatically highlighted as **`⚡ Special Expense`** with a distinct amber accent border, custom work particulars, and dedicated totals.
3. **Line Items**: Use `Utility Name: Amount` (e.g. `House Keeping: 3000`, `Sump & Tank Cleaning: 3500`).
4. Leave empty lines between billing periods for readability.
5. If a month has no expenses yet, leave it empty under the header (e.g. `- September 2026`), and it will display cleanly without empty total bars.

---

## 📂 Project Structure

```
/
├── index.html        # Semantic HTML5 layout & view containers
├── styles.css        # CSS variables, 6 theme palettes, card layouts, responsive grid, print styles
├── script.js         # Rotation math, maintenance parser, theme cycler, view router
├── maintenance.txt   # Maintenance bill entries & utility expenses
├── manifest.json     # Progressive Web App (PWA) configuration (relative paths)
├── sw.js             # Service Worker for offline caching with relative paths
├── README.md         # Documentation & guide
└── LICENSE           # MIT License
```

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
