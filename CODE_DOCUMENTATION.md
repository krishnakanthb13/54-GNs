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
        script.js             styles.css            sw.js
  (State & Logic)       (6 Themes & Layout)    (PWA Cache v8)
              ^
              | Fetch with cache-busting (?t=Date.now())
        maintenance.txt
```

---

## 2. Core Modules & Functions (`script.js`)

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

## 3. Styling & Theme Engine (`styles.css`)

- **Design System**: Built on CSS Custom Properties (`--bg`, `--surface`, `--border`, `--text`, `--text-dim`, `--accent`, `--primary`).
- **Theme Cycling**: Supports 6 distinct themes (Dark Slate, Obsidian Violet, Forest Emerald, Pure Sky, Warm Sand, Fresh Mint).
- **Note Card Styling (`.bill-note-body`)**:
  - Employs flexible vertical column layout (`gap: 12px`).
  - Separates multiple notes via dashed dividers (`.bill-note-body p + p { border-top: 1px dashed var(--border); padding-top: 10px; }`).
- **Print Optimization (`@media print`)**:
  - Enforces pure black/white palette, strips UI controls, buttons, and navigation elements.

---

## 4. Offline & Cache Strategy (`sw.js`)

- **Cache Identifier**: `motor-duty-v8`.
- **Static Assets**: Pre-caches `./`, `./index.html`, `./styles.css`, `./script.js`, `./manifest.json`.
- **Dynamic Bypass**: Explicitly intercepts and bypasses caching for any request to `maintenance.txt`, ensuring instant data updates across all clients without PWA cache invalidation friction.
