# Regression Tests

The app has a [Playwright](https://playwright.dev/) suite that covers every user-facing feature. Run it before publishing changes to `index.html`, `assets/css/styles.css`, `assets/js/script.js`, or `sw.js`.

## Setup (once)

```bash
npm install
npm run test:install   # downloads the Chromium build Playwright needs
```

## Run

```bash
npm test             # headless, all tests
npm run test:headed  # watch the browser
npm run test:ui      # interactive Playwright UI
npm run test:debug   # step through a failing test
npm run test:report  # open the last HTML report
```

`npm test` starts its own zero-dependency static server on `http://127.0.0.1:4321` (`tests/server.js`). If a server is already running on that port it is reused. To preview manually, use `npm run serve`.

## What is covered

| File | Coverage |
| --- | --- |
| `tests/rotation.spec.js` | Status card, days-remaining countdown for every weekday, flat rollover, progress bar, calendar, timeline, 8+8 week schedules, instructions, flat/tenant search, copy, share fallback, CSV export, print |
| `tests/bills.spec.js` | Expenses summary and totals, period cards, empty/additional periods, search and filtered totals, Expenses/Paid tabs, paid stats and entries, paid search, breakdown modal (button/Escape/backdrop), copy summaries, print |
| `tests/issues.spec.js` | Issue stats, pending/completed cards, duration pills, dates, context, search across title/status/context, all 9 sort modes, copy, print |
| `tests/navigation.spec.js` | Header buttons, deep links, browser back/forward, all 6 themes and persistence, legacy theme values, header print from every view |
| `tests/responsive.spec.js` | No horizontal overflow from 320–1440px on every view, sticky bill tabs under the 55px header, header/card grid alignment, mobile tab usability |
| `tests/accessibility.spec.js` | Accessible names, single `h1`/`main`, unique IDs, tab `aria-pressed`/`aria-controls`, visible keyboard focus rings, `prefers-reduced-motion` |
| `tests/resilience.spec.js` | Offline fetch failure, empty sections, malformed rows, HTML escaping (XSS), real-data smoke test |

Any uncaught page exception fails the test that triggered it.

## Deterministic data

Bills, paid and issue tests do **not** read the live `maintenance.txt`. They intercept `maintenance.txt` and serve fixtures from `tests/fixtures/`:

- `maintenance.fixture.txt` — the main dataset (all expected totals in the specs derive from it).
- `empty-sections.txt` — headers with no rows.
- `malformed.txt` — invalid amounts/dates mixed with valid rows.
- `xss.txt` — markup that must render as text.

This keeps the suite stable when real bills are added. The one test that uses the real file (`resilience.spec.js`) only asserts that each view renders something, never exact amounts.

Date-dependent assertions (countdown, calendar, timeline, schedules, ongoing duration) install a fixed clock, so the suite passes on any day and in any timezone.

Service workers are blocked in tests so the fixture route is always authoritative.

## Safety / deployment

The suite cannot affect the live Vercel site:

- Tests only talk to a local static server at `http://127.0.0.1:4321` (started by `tests/server.js`). The production URL is never opened.
- `maintenance.txt` is **read** by one smoke test; all other data comes from local fixtures, and nothing is written back to the repository data file.
- Service workers are blocked in the test browser, so no cache is polluted.
- Vercel has no build command for this static site, so adding `package.json` does not trigger tests or a new deploy. Playwright downloads browsers only when you explicitly run `npm run test:install`.
- `node_modules/`, `playwright-report/`, `test-results/` and `blob-report/` are gitignored. Commit `package.json`, `package-lock.json`, `playwright.config.js`, `tests/`, `TESTING.md` and the `.gitignore` change to share the suite.

Pushing a commit will deploy the *app* as before; the test files are just static assets at that point and are not executed in the browser.

## When adding a feature

1. Add the DOM/state assertions to the closest existing spec, or create `<feature>.spec.js`.
2. If the feature adds data parsing, add a fixture and a case for the happy path plus one malformed/empty input.
3. If the feature is visual, add a viewport to `responsive.spec.js` and a focus/name check to `accessibility.spec.js` when interactive.
4. Run `npm test` and commit any updated fixture expectations together with the change.

## CI

On GitHub Actions, run:

```yaml
- run: npm ci
- run: npx playwright install --with-deps chromium
- run: npm test
```

The config already retries twice on CI and uploads traces/screenshots for failures via the HTML report.
