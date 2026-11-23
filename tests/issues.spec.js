'use strict';

const {
  test,
  expect,
  openApp,
  stubPrint,
  printCalls,
  readClipboard,
  issueTitles,
  statValues,
  statLabels,
} = require('./helpers');

// Midnight keeps ongoing-duration rounding stable (10 Nov → 23 Nov = 13 days).
const MONDAY = '2026-11-23T00:00:00';

test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

test.describe('Issues — overview', () => {
  test('opens the issues view from the hash with summary stats', async ({ page }) => {
    await openApp(page, { hash: 'issues', clock: MONDAY });

    await expect(page).toHaveURL(/#issues$/);
    await expect(page.locator('#pageTitle')).toHaveText('Maintenance Issues');
    await expect(page.locator('#issuesView')).toBeVisible();
    await expect(page.locator('#billsView')).toBeHidden();
    await expect(page.locator('#backBtn')).toBeVisible();

    expect(await statLabels(page, '#issueStatsGrid')).toEqual([
      'Total Issues Logged',
      'Resolved',
      'Pending',
    ]);
    expect(await statValues(page, '#issueStatsGrid')).toEqual(['3', '✅ 2', '⏳ 1']);
  });

  test('renders each issue with status, duration, dates and context', async ({ page }) => {
    await openApp(page, { hash: 'issues', clock: MONDAY });

    const cards = page.locator('#issuesContent .issue-card');
    await expect(cards).toHaveCount(3);
    await expect(page.locator('#issuesContent .issue-card-pending')).toHaveCount(1);
    await expect(page.locator('#issuesContent .issue-card-completed')).toHaveCount(2);
    await expect(page.locator('#issuesContent .issue-badge-pending')).toHaveCount(1);
    await expect(page.locator('#issuesContent .issue-badge-completed')).toHaveCount(2);

    expect(await issueTitles(page)).toEqual(['Terrace Noise', 'Drainage Blockage', 'Broken Tiles']);

    await expect(page.locator('#issuesContent .issue-duration-pill')).toHaveText([
      '⏱️ 13 days (Ongoing)',
      '⏱️ 4 days',
      '⏱️ 21 days',
    ]);
    await expect(page.locator('#issuesContent .issue-duration-pill').first()).toHaveClass(/ongoing/);

    const firstDates = page.locator('#issuesContent .issue-card').first().locator('.issue-date-item');
    await expect(firstDates.nth(0)).toContainText('Start: 10 November 2026');
    await expect(firstDates.nth(1)).toContainText('End: None');

    await expect(page.locator('#issuesContent .issue-card').nth(0).locator('.issue-context-item')).toHaveCount(2);
    await expect(page.locator('#issuesContent .issue-card').nth(1).locator('.issue-context-item')).toHaveCount(2);
    await expect(page.locator('#issuesContent .issue-card').nth(2).locator('.issue-context-item')).toHaveCount(1);
    await expect(page.locator('#issuesContent .issue-context-title').first()).toHaveText('Context & Log Details');
  });
});

test.describe('Issues — search', () => {
  test('filters by title, status and context text', async ({ page }) => {
    await openApp(page, { hash: 'issues', clock: MONDAY });

    await page.fill('#issueSearchInput', 'drainage');
    await expect(page.locator('#issuesContent .issue-card')).toHaveCount(1);
    expect(await issueTitles(page)).toEqual(['Drainage Blockage']);

    await page.fill('#issueSearchInput', 'pending');
    await expect(page.locator('#issuesContent .issue-card-title')).toHaveCount(1);
    await expect(page.locator('#issuesContent .issue-card-title').first()).toContainText('Terrace Noise');
    expect(await issueTitles(page)).toEqual(['Terrace Noise']);

    await page.fill('#issueSearchInput', 'completed');
    await expect(page.locator('#issuesContent .issue-card')).toHaveCount(2);

    // "plumber" only appears inside a context bullet.
    await page.fill('#issueSearchInput', 'plumber');
    await expect(page.locator('#issuesContent .issue-card')).toHaveCount(1);
    expect(await issueTitles(page)).toEqual(['Drainage Blockage']);
  });

  test('shows an empty state and toast for an unknown query', async ({ page }) => {
    await openApp(page, { hash: 'issues', clock: MONDAY });

    await page.fill('#issueSearchInput', 'zzzz');
    await expect(page.locator('#issuesContent .bill-empty-state')).toContainText('No issues matching "zzzz"');
    await expect(page.locator('.toast').filter({ hasText: 'No issues matching "zzzz"' })).toBeVisible();

    await page.fill('#issueSearchInput', '');
    await expect(page.locator('#issuesContent .issue-card')).toHaveCount(3);
  });
});

test.describe('Issues — sorting', () => {
  const expectedOrders = {
    default: ['Terrace Noise', 'Drainage Blockage', 'Broken Tiles'],
    'title-asc': ['Broken Tiles', 'Drainage Blockage', 'Terrace Noise'],
    'title-desc': ['Terrace Noise', 'Drainage Blockage', 'Broken Tiles'],
    'start-newest': ['Terrace Noise', 'Drainage Blockage', 'Broken Tiles'],
    'start-oldest': ['Broken Tiles', 'Drainage Blockage', 'Terrace Noise'],
    'end-newest': ['Terrace Noise', 'Drainage Blockage', 'Broken Tiles'],
    'end-oldest': ['Broken Tiles', 'Drainage Blockage', 'Terrace Noise'],
    status: ['Terrace Noise', 'Drainage Blockage', 'Broken Tiles'],
    'status-desc': ['Drainage Blockage', 'Broken Tiles', 'Terrace Noise'],
  };

  test('offers every sort mode', async ({ page }) => {
    await openApp(page, { hash: 'issues', clock: MONDAY });

    const options = page.locator('#issueSortSelect option');
    await expect(options).toHaveCount(9);
    expect(await options.allTextContents()).toEqual([
      '🔀 Default (File)',
      '🔀 Title (A–Z)',
      '🔀 Title (Z–A)',
      '🔀 Start Date (Newest)',
      '🔀 Start Date (Oldest)',
      '🔀 End Date (Newest)',
      '🔀 End Date (Oldest)',
      '🔀 Status (Pending First)',
      '🔀 Status (Completed First)',
    ]);
  });

  test('sorts by every mode and keeps the order while filtering', async ({ page }) => {
    await openApp(page, { hash: 'issues', clock: MONDAY });

    for (const [mode, titles] of Object.entries(expectedOrders)) {
      await page.selectOption('#issueSortSelect', mode);
      await expect(page.locator('#issuesContent .issue-card')).toHaveCount(3);
      expect(await issueTitles(page), `sort mode ${mode}`).toEqual(titles);
    }

    await page.selectOption('#issueSortSelect', 'title-desc');
    await page.fill('#issueSearchInput', 'completed');
    await expect(page.locator('#issuesContent .issue-card')).toHaveCount(2);
    expect(await issueTitles(page)).toEqual(['Drainage Blockage', 'Broken Tiles']);
  });

  test('confirms a sort change with a toast', async ({ page }) => {
    await openApp(page, { hash: 'issues', clock: MONDAY });

    await page.selectOption('#issueSortSelect', 'title-asc');
    await expect(page.locator('.toast').filter({ hasText: 'Sorted by Title (A–Z)' })).toBeVisible();
  });
});

test.describe('Issues — actions', () => {
  test('copies the issues summary', async ({ page }) => {
    await openApp(page, { hash: 'issues', clock: MONDAY });
    await page.click('#issueCopyBtn');

    await expect(page.locator('.toast').filter({ hasText: 'Copied issues summary!' })).toBeVisible();
    const clipboard = await readClipboard(page);

    expect(clipboard).toContain('54GNs Apartments - Flat 7 Issues Log');
    expect(clipboard).toContain('• Terrace Noise [Pending] (13 days (Ongoing))');
    expect(clipboard).toContain('Start: 10 November 2026 → End: None');
    expect(clipboard).toContain('Context:');
    expect(clipboard).toContain('- Noise from the terrace directly above Flat 7.');
    expect(clipboard).toContain('These are the issues and maintenance concerns faced and reported by Flat 7');
  });

  test('print action calls window.print', async ({ page }) => {
    await openApp(page, { hash: 'issues', clock: MONDAY });
    await stubPrint(page);

    await page.click('#issuePrintBtn');
    await expect(page.locator('.toast').filter({ hasText: 'Preparing printable document...' })).toBeVisible();
    await expect.poll(() => printCalls(page)).toBe(1);
  });
});
