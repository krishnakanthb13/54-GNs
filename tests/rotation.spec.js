'use strict';

const fs = require('fs');
const { test, expect, openApp, stubPrint, printCalls, readClipboard } = require('./helpers');

// Fixed Monday so every date-derived assertion is deterministic.
const MONDAY = '2026-11-23T12:00:00';

test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

test.describe('Rotation view — status & duty', () => {
  test('renders status, responsible flat and progress for a known Monday', async ({ page }) => {
    await openApp(page, { clock: MONDAY });

    await expect(page.locator('#todayDate')).toHaveText('Monday, November 23, 2026');
    await expect(page.locator('#weekNumber')).toHaveText('W48');
    await expect(page.locator('#weekPeriod')).toHaveText('23 Nov – 29 Nov');
    await expect(page.locator('#currentFlat')).toHaveText('Flat 2 (Bala Subramaniam)');

    await expect(page.locator('#responsibleFlat')).toHaveText('Flat 2 (Bala Subramaniam)');
    await expect(page.locator('#cycleProgress')).toHaveText('2 of 8');
    await expect(page.locator('#dutyStart')).toHaveText('23 Nov 2026');
    await expect(page.locator('#dutyEnd')).toHaveText('29 Nov 2026');
    expect(await page.locator('#progressFill').evaluate((el) => el.style.width)).toBe('25%');

    await expect(page.locator('#lastUpdated')).toContainText('Last Updated: Monday, November 23, 2026');
  });

  const countdownCases = [
    ['Monday', '2026-11-23T12:00:00', '7 Days Remaining', 'green'],
    ['Tuesday', '2026-11-24T12:00:00', '6 Days Remaining', 'green'],
    ['Friday', '2026-11-27T12:00:00', '3 Days Remaining', 'orange'],
    ['Sunday', '2026-11-29T12:00:00', '1 Day Remaining', 'red'],
    ['next Monday (new cycle)', '2026-11-30T12:00:00', '7 Days Remaining', 'green'],
  ];

  for (const [label, iso, text, colour] of countdownCases) {
    test(`days remaining on ${label}`, async ({ page }) => {
      await openApp(page, { clock: iso });

      const countdown = page.locator('#countdown');
      await expect(countdown).toHaveText(text);
      await expect(countdown).toHaveClass(new RegExp(`\\b${colour}\\b`));
      // A full week must never be reported as "Today".
      await expect(countdown).not.toHaveText(/today/i);
    });
  }

  test('rolls over to the next flat after a full cycle', async ({ page }) => {
    await openApp(page, { clock: '2026-11-30T12:00:00' });

    await expect(page.locator('#currentFlat')).toHaveText('Flat 3 (Balaji)');
    await expect(page.locator('#weekNumber')).toHaveText('W49');
    await expect(page.locator('#weekPeriod')).toHaveText('30 Nov – 6 Dec');
    await expect(page.locator('#cycleProgress')).toHaveText('3 of 8');
  });
});

test.describe('Rotation view — timeline, calendar & schedules', () => {
  test('renders the three-week timeline', async ({ page }) => {
    await openApp(page, { clock: MONDAY });

    const items = page.locator('#timeline .timeline-item');
    await expect(items).toHaveCount(3);
    await expect(page.locator('#timeline .timeline-label')).toHaveText(['Previous', 'Current', 'Next']);
    await expect(page.locator('#timeline .timeline-flat')).toHaveText([
      'Flat 1 (Sathyanarayana G)',
      'Flat 2 (Bala Subramaniam)',
      'Flat 3 (Balaji)',
    ]);
    await expect(page.locator('#timeline .timeline-item.current')).toHaveCount(1);
    await expect(page.locator('#timeline .timeline-week')).toHaveText(['W47', 'W48', 'W49']);
  });

  test('renders the monthly calendar with today and duty week marked', async ({ page }) => {
    await openApp(page, { clock: MONDAY });

    await expect(page.locator('#calMonth')).toHaveText('November 2026');
    // 6 leading blanks (1 Nov 2026 is a Sunday) + 30 days.
    await expect(page.locator('#calDays .cal-day')).toHaveCount(36);
    await expect(page.locator('#calDays .cal-day.today')).toHaveText('23');
    // Today is excluded from .duty-week, leaving Mon 23 → Sun 29 minus today.
    await expect(page.locator('#calDays .cal-day.duty-week')).toHaveCount(6);
  });

  test('renders 8 upcoming and 8 previous weeks starting at the right cycle', async ({ page }) => {
    await openApp(page, { clock: MONDAY });

    await expect(page.locator('#upcomingBody .schedule-tr')).toHaveCount(8);
    await expect(page.locator('#previousBody .schedule-tr')).toHaveCount(8);

    const next = page.locator('#upcomingBody .schedule-tr').first();
    await expect(next.locator('.week')).toHaveText('W49');
    await expect(next.locator('.flat')).toHaveText('Flat 3');
    await expect(next.locator('.tenant')).toHaveText('Balaji');
    await expect(next.locator('.from')).toHaveText('30 Nov 2026');
    await expect(next.locator('.to')).toHaveText('6 Dec 2026');

    const previous = page.locator('#previousBody .schedule-tr').first();
    await expect(previous.locator('.week')).toHaveText('W47');
    await expect(previous.locator('.flat')).toHaveText('Flat 1');
    await expect(previous.locator('.tenant')).toHaveText('Sathyanarayana G');
    await expect(previous.locator('.from')).toHaveText('16 Nov 2026');
    await expect(previous.locator('.to')).toHaveText('22 Nov 2026');
  });

  test('renders all instruction groups', async ({ page }) => {
    await openApp(page, { clock: MONDAY });

    await expect(page.locator('#instructionsList .instruction-group')).toHaveCount(4);
    await expect(page.locator('#instructionsList h3')).toHaveText([
      'Morning',
      'Evening',
      'If Unavailable',
      'Emergency',
    ]);
    await expect(page.locator('#instructionsList li')).toHaveCount(7);
  });
});

test.describe('Rotation view — search', () => {
  test('finds a flat by name and shows the next four cycles', async ({ page }) => {
    await openApp(page, { clock: MONDAY });

    await page.fill('#searchInput', 'bala');
    const result = page.locator('#searchResult');
    await expect(result).toBeVisible();
    await expect(result).toContainText('Flat 2 (Bala Subramaniam)');
    await expect(result).toContainText('Next duty:');
    await expect(result).toContainText('18 Jan 2027 – 24 Jan 2027');
    await expect(result).toContainText('8 weeks away');
    await expect(result).toContainText('Previous:');
    const bullets = await result.evaluate((el) => (el.textContent.match(/•/g) || []).length);
    expect(bullets).toBe(4);
  });

  test('finds a flat by tenant name', async ({ page }) => {
    await openApp(page, { clock: MONDAY });

    await page.fill('#searchInput', 'krishna');
    const result = page.locator('#searchResult');
    await expect(result).toContainText('Flat 7 (Krishna Kanth B)');
    await expect(result).toContainText('5 weeks away');
  });

  test('shows a no-match message and toast for an unknown flat', async ({ page }) => {
    await openApp(page, { clock: MONDAY });

    await page.fill('#searchInput', 'zzz');
    await expect(page.locator('#searchResult')).toHaveText('No flat found.');
    await expect(page.locator('.toast').filter({ hasText: 'No flat matching "zzz"' })).toBeVisible();
  });

  test('does not toast for a single-character query and hides on clear', async ({ page }) => {
    await openApp(page, { clock: MONDAY });

    await page.fill('#searchInput', 'z');
    await expect(page.locator('#searchResult')).toHaveText('No flat found.');
    await expect(page.locator('.toast')).toHaveCount(0);

    await page.fill('#searchInput', '');
    await expect(page.locator('#searchResult')).toBeHidden();
  });
});

test.describe('Rotation view — actions', () => {
  test('copy button copies the week details and confirms', async ({ page }) => {
    await openApp(page, { clock: MONDAY });

    await page.click('#copyBtn');
    await expect(page.locator('.toast').filter({ hasText: 'Copied rotation details!' })).toBeVisible();
    await expect(page.locator('#copyBtn')).toHaveText('✅ Copied!');

    const clipboard = await readClipboard(page);
    expect(clipboard).toContain('This week\'s Water Motor Rotation');
    expect(clipboard).toContain('Week 48');
    expect(clipboard).toContain('23 Nov 2026 – 29 Nov 2026');
    expect(clipboard).toContain('Responsible: Flat 2 (Bala Subramaniam)');

    // The button resets after its confirmation delay.
    await expect(page.locator('#copyBtn')).toHaveText('📋 Copy', { timeout: 4_000 });
  });

  test('share falls back to the clipboard when Web Share is unavailable', async ({ page }) => {
    await openApp(page, { clock: MONDAY });

    await page.evaluate(() => {
      try {
        Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
      } catch {
        /* ignore */
      }
      document.querySelector('#shareBtn').click();
    });

    await expect(page.locator('.toast').filter({ hasText: 'Copied to clipboard!' })).toBeVisible();
    const clipboard = await readClipboard(page);
    expect(clipboard).toContain('Week 48');
    expect(clipboard).toContain('Responsible: Flat 2 (Bala Subramaniam)');
  });

  test('exports the full rotation as CSV', async ({ page }) => {
    await openApp(page, { clock: MONDAY });

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('#exportCsvBtn'),
    ]);

    expect(download.suggestedFilename()).toBe('motor-rotation-schedule.csv');
    const file = await download.path();
    const csv = fs.readFileSync(file, 'utf8');
    const lines = csv.split('\n');

    expect(lines[0]).toBe('Week,Start,End,Flat');
    // 8 previous weeks + current week + 8 upcoming weeks, in chronological order.
    expect(lines).toHaveLength(18);
    expect(lines[1]).toBe('40,28 Sept 2026,4 Oct 2026,Flat 2 (Bala Subramaniam)');
    expect(lines[8]).toBe('47,16 Nov 2026,22 Nov 2026,Flat 1 (Sathyanarayana G)');
    expect(lines[9]).toBe('48,23 Nov 2026,29 Nov 2026,Flat 2 (Bala Subramaniam)');
    expect(lines[10]).toBe('49,30 Nov 2026,6 Dec 2026,Flat 3 (Balaji)');
    expect(lines[17]).toBe('3,18 Jan 2027,24 Jan 2027,Flat 2 (Bala Subramaniam)');
    await expect(page.locator('.toast').filter({ hasText: 'Exported motor rotation schedule (CSV)!' })).toBeVisible();
  });

  test('print actions call window.print after preparing the document', async ({ page }) => {
    await openApp(page, { clock: MONDAY });
    await stubPrint(page);

    await page.click('#printBtn');
    await expect(page.locator('.toast').filter({ hasText: 'Preparing printable document...' })).toBeVisible();
    await expect.poll(() => printCalls(page)).toBe(1);

    await page.click('#exportPdfBtn');
    await expect.poll(() => printCalls(page)).toBe(2);
  });
});
