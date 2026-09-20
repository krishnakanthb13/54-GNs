# Code Documentation - 54GNs Maintenance & Duty Tracker

This document provides a concise, structured technical overview of the codebase architecture, modules, algorithms, and data structures.

---

## 1. System Architecture

The application is engineered as a zero-build, zero-dependency Progressive Web App (PWA) using Vanilla HTML5, modern CSS3 (Custom Properties), and vanilla ES6+ JavaScript.

```
+-------------------------------------------------------------------+
|                           index.html                              |
|  +---------------------------+  +-------------------------------+ |
|  |     #rotationView         |  |          #billsView           | |
|  | - Active Duty Status Card |  | - Tab Navigation              | |
|  | - Rotation Timeline       |  |   - #expensesPane             | |
|  | - Search / Calendar / CSV |  |   - #paidPane                 | |
|  | - 8-Week Schedule Tables  |  |     - #paidContent            | |
|  +---------------------------+  |     - .bill-note-card (Notes) | |
|                                 | - Modal (#paidBreakdownModal) | |
|                                 +-------------------------------+ |
+-------------------------------------------------------------------+
                                  ^
                                  |
              +-------------------+-------------------+
              |                   |                   |
      assets/js/script.js  assets/css/styles.css    sw.js
       (State & Logic)     (6 Themes & Layout)  (PWA Cache v11)
              ^
              | Fetch with cache-busting (?t=Date.now())
        maintenance.txt
```

---

## 2. Core Modules & Functions (`assets/js/script.js`)

### 2.1 Water Motor Duty Engine
- **`START_DATE`**: Anchor Monday (`"2026-06-01"`) establishing the cycle origin.
- **`FLATS`**: Array of 8 flat objects with assigned tenant names.
- **`getCycleInfo(targetDate)`**:
  - Calculates the difference in weeks between `targetDate` and `START_DATE`.
  - Determines active flat index via modulo arithmetic: `cycleIndex = ((weeksDiff % totalFlats) + totalFlats) % totalFlats`.
  - Computes exact Monday-to-Sunday boundaries for the duty period.
  - Generates countdown metrics (days remaining, percentage elapsed).
- **`renderUpcomingCycles(count)` & `renderPreviousCycles(count)`**:
  - Generates transparent schedule tables for past and future rotations.

### 2.2 Maintenance Bills Parser & Processor
`maintenance.txt` acts as the decoupled flat-file database.

- **`splitMaintenanceSections(rawText)`**:
  - Splits file on `= Paid =` and `= Expenses =` section delimiters.
  - Backward compatibility: if no delimiters exist, the entire document defaults to Expenses.
- **`parseMaintenance(text)`**:
  - Parses `- Month Year` (Monthly) and `- DD Month Year` (Additional Expense) headers.
  - Extracts key-value lines (`Utility: Amount`) into structured group arrays.
- **`parsePaid(text)`**:
  - Parses `- DATE: TYPE: AMOUNT` and `+ DATE: TYPE: AMOUNT` lines.
  - Prefix `+` flags the entry as `additional: true` (rendered with amber theme and ⚡ badge).
- **`loadAndRenderBills()`**:
  - Fetches `./maintenance.txt?t=${Date.now()}` with `cache: 'no-store'`.
  - Dispatches parsed datasets to stats collectors and DOM renderers.

### 2.3 Tab & View Routing
- **`showView(viewName, updateHistory)`**:
  - Toggles visibility between `#rotationView` and `#billsView`.
  - Synchronizes browser history state and URL hash (`#bills`).
- **`switchBillsTab(tab)`**:
  - Toggles active tab between `'expenses'` and `'paid'`.
  - Selectively toggles `.hidden` on `#expensesPane`, `#paidPane`, `#expensesSummaryCard`, and `#paidSummaryCard`.
  - Updates `#billCopyBtn` label (`📋 Copy Summary` vs `📋 Copy Paid Summary`).

### 2.4 Contextual Notes & Disclaimers (`.bill-note-card`)
- Nesting: Positioned directly inside `#paidPane` beneath `#paidContent`.
- Behavior: Displays only when the Paid tab is active, ensuring expenses view remains uncluttered.
- Contents:
  - **Flat 7 Payment Date Notice**: Informs residents that documented payment dates reflect Flat 7 records, while other flats pay around approximate dates.
  - **Reconciliation Audit**: Discloses single tenant share (`Total Expenses ÷ 8`) against recorded collections and details historical variance reconciliation.

### 2.5 Export & Clipboard Utility
- **`copyBillsSummary()`**:
  - **Expenses Mode**: Formats each period, utility line item, period subtotal, and per-flat share (`÷ 8`).
  - **Paid Mode**: Formats chronological collections with `(Additional)` tags, totals, monthly/additional subtotals, and appends the Flat 7 payment dates disclaimer for WhatsApp sharing.

---

## 3. Styling & Theme Engine (`assets/css/styles.css`)

- **Design System**: Built on CSS Custom Properties (`--bg`, `--surface`, `--border`, `--text`, `--text-dim`, `--accent`, `--primary`).
- **Theme Cycling**: Supports 6 distinct themes (Dark Slate, Obsidian Violet, Forest Emerald, Pure Sky, Warm Sand, Fresh Mint).
- **Note Card Styling (`.bill-note-body`)**:
  - Employs flexible vertical column layout (`gap: 12px`).
  - Separates multiple notes via dashed dividers (`.bill-note-body p + p { border-top: 1px dashed var(--border); padding-top: 10px; }`).
- **Print Optimization (`@media print`)**:
  - Enforces pure black/white palette, strips UI controls, buttons, and navigation elements.

---

## 4. Offline & Cache Strategy (`sw.js`)

- **Cache Identifier**: `motor-duty-v11`.
- **Pre-cached Assets**:
  - Root: `./`, `./index.html`, `./manifest.json`, `./favicon.ico`
  - Core Bundles: `./assets/css/styles.css`, `./assets/js/script.js`
  - Graphics & Icons: `./assets/icons/favicon.ico`, `./assets/icons/favicon.svg`, `./assets/icons/apple-touch-icon.png`, `./assets/icons/icon-192.png`, `./assets/icons/icon-512.png`
- **Dynamic Bypass**: Explicitly intercepts and bypasses caching for any request to `maintenance.txt`, ensuring instant data updates across all clients without PWA cache invalidation friction.

---

## 5. Vercel Cloud Integration (`vercel.json`)

Provides zero-build configuration tailored for PWA lifecycle and immediate flat-file synchronization:
- **Clean URLs (`cleanUrls: true`)**: Strips `.html` extensions and handles normalized route resolution.
- **Service Worker Lifetime**: Forces `Cache-Control: public, max-age=0, must-revalidate` along with `Service-Worker-Allowed: /` on `/sw.js` so clients check for new PWA releases on every session.
- **Flat-File Synchronization**: Enforces `Cache-Control: no-cache, no-store, must-revalidate` on `/maintenance.txt`, guaranteeing live Git edits propagate immediately without caching lag.
- **Static Asset Immutability**: Applies `Cache-Control: public, max-age=31536000, immutable` on `/assets/:path*` and `/favicon.ico` for maximum CDN edge caching performance.
- **Security Hardening**: Globally serves `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, and `Referrer-Policy: strict-origin-when-cross-origin`.

---

## 6. Favicon & App Icon Pipeline (`assets/icons/`)

- **Root Favicon (`/favicon.ico`)**: Multi-resolution Windows ICO container embedding 16×16, 32×32, and 48×48 frames with transparent background for direct resolution by Vercel project dashboard, browser bookmarks, and web scrapers.
- **Vector Favicon (`assets/icons/favicon.svg`)**: Scalable water droplet vector with gradient (`#38bdf8` → `#0284c7` → `#0369a1`) and cubic Bézier specular gloss reflection.
- **Android Maskable PWA Icons (`icon-192.png`, `icon-512.png`)**: Designed with deep navy `#0b1329` brand background and centered within the 80% safe zone to prevent letterboxing on adaptive Android launchers.
- **iOS Home Screen Icon (`apple-touch-icon.png`)**: 180×180 PNG styled with solid `#0b1329` background for Apple Web Clip displays.
