'use strict';

const {
  test,
  expect,
  openApp,
  stubPrint,
  printCalls,
  readClipboard,
  statValues,
  statLabels,
} = require('./helpers');

// All monetary expectations below come from tests/fixtures/maintenance.fixture.txt.
test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

test.describe('Bills — expenses overview', () => {
  test('opens the bills view with the expenses tab selected', async ({ page }) => {
    await openApp(page, { hash: 'bills' });

    await expect(page).toHaveURL(/#bills$/);
    await expect(page.locator('#pageTitle')).toHaveText('Maintenance Bills');
    await expect(page.locator('#billsView')).toBeVisible();
    await expect(page.locator('#rotationView')).toBeHidden();
    await expect(page.locator('#backBtn')).toBeVisible();

    await expect(page.locator('#expensesTabBtn')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#paidTabBtn')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('#expensesPane')).toBeVisible();
    await expect(page.locator('#paidPane')).toBeHidden();
    await expect(page.locator('#expensesSummaryCard')).toBeVisible();
    await expect(page.locator('#paidSummaryCard')).toBeHidden();
    await expect(page.locator('#billCopyBtn')).toHaveText('📋 Copy Summary');
  });

  test('renders the summary stats from the data file', async ({ page }) => {
    await openApp(page, { hash: 'bills' });

    expect(await statLabels(page)).toEqual(['Total Expenses', 'Per Flat (÷8)', 'Recorded Cycles']);

    const values = await statValues(page);
    expect(values[0]).toBe('₹17,356');
    expect(values[1]).toBe('₹2,169.50');
    // "N Monthly" and "N Additional" render on separate lines.
    await expect(page.locator('#billStatsGrid .status-split span')).toHaveText([
      '2 Monthly',
      '2 Additional',
    ]);
  });

  test('renders every expense period in file order with correct totals', async ({ page }) => {
    await openApp(page, { hash: 'bills' });

    const cards = page.locator('#billContent .bill-period-card');
    await expect(cards).toHaveCount(5);

    await expect(cards.nth(0).locator('.bill-period-title')).toContainText('November 2026');
    await expect(cards.nth(1).locator('.bill-period-title')).toContainText('17 November 2026');
    await expect(cards.nth(2).locator('.bill-period-title')).toContainText('October 2026');
    await expect(cards.nth(3).locator('.bill-period-title')).toContainText('July 2026');
    await expect(cards.nth(4).locator('.bill-period-title')).toContainText('29 July 2026');

    await expect(page.locator('#billContent .bill-table-row')).toHaveCount(9);

    await expect(page.locator('#billContent .bill-subtotal-val')).toHaveText([
      '₹5,040',
      '₹6,816',
      '₹3,000',
      '₹2,500',
    ]);
    await expect(page.locator('#billContent .bill-tenant-val')).toHaveText([
      '₹630',
      '₹852',
      '₹375',
      '₹312.50',
    ]);
  });

  test('marks empty and additional-expense periods clearly', async ({ page }) => {
    await openApp(page, { hash: 'bills' });

    const emptyCard = page.locator('#billContent .bill-period-card').first();
    await expect(emptyCard.locator('.bill-period-empty-badge')).toHaveText('No entries');
    await expect(emptyCard.locator('.bill-empty-row')).toContainText('No expenses recorded for this period');

    await expect(page.locator('#billContent .bill-special-card')).toHaveCount(2);
    await expect(page.locator('#billContent .bill-special-badge')).toHaveCount(2);
    await expect(page.locator('#billContent .bill-monthly-badge')).toHaveCount(3);
    await expect(page.locator('#billContent .bill-special-badge').first()).toHaveText('⚡ Additional Expense');
  });

  test('filters by item name and recomputes the visible period totals', async ({ page }) => {
    await openApp(page, { hash: 'bills' });

    await page.fill('#billSearchInput', 'electric');

    const cards = page.locator('#billContent .bill-period-card');
    await expect(cards).toHaveCount(1);
    await expect(cards.first().locator('.bill-period-title')).toContainText('October 2026');
    await expect(cards.first().locator('.bill-table-row')).toHaveCount(1);
    await expect(cards.first().locator('.bill-table-row')).toContainText('Electricity Bill');
    await expect(cards.first().locator('.bill-item-amount')).toHaveText('₹2,116');
    await expect(cards.first().locator('.bill-period-badge')).toHaveText('1 item');
    await expect(cards.first().locator('.bill-subtotal-val')).toHaveText('₹2,116');
    await expect(cards.first().locator('.bill-tenant-val')).toHaveText('₹264.50');
  });

  test('filters by period header and keeps all rows of the match', async ({ page }) => {
    await openApp(page, { hash: 'bills' });

    await page.fill('#billSearchInput', 'october');
    await expect(page.locator('#billContent .bill-period-card')).toHaveCount(1);
    await expect(page.locator('#billContent .bill-table-row')).toHaveCount(4);

    await page.fill('#billSearchInput', 'july');
    await expect(page.locator('#billContent .bill-period-card')).toHaveCount(2);
  });

  test('shows an empty state and toast for an unknown expense', async ({ page }) => {
    await openApp(page, { hash: 'bills' });

    await page.fill('#billSearchInput', 'zzzz');
    await expect(page.locator('#billContent .bill-empty-state')).toContainText('No entries matching "zzzz"');
    await expect(page.locator('.toast').filter({ hasText: 'No bills matching "zzzz"' })).toBeVisible();

    await page.fill('#billSearchInput', '');
    await expect(page.locator('#billContent .bill-period-card')).toHaveCount(5);
  });
});

test.describe('Bills — paid collections', () => {
  test('switching tabs swaps panes, summary and copy label', async ({ page }) => {
    await openApp(page, { hash: 'bills' });

    await page.click('#paidTabBtn');

    await expect(page.locator('#paidTabBtn')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#expensesTabBtn')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('#paidTabBtn')).toHaveClass(/active/);
    await expect(page.locator('#expensesTabBtn')).not.toHaveClass(/active/);
    await expect(page.locator('#paidPane')).toBeVisible();
    await expect(page.locator('#expensesPane')).toBeHidden();
    await expect(page.locator('#paidSummaryCard')).toBeVisible();
    await expect(page.locator('#expensesSummaryCard')).toBeHidden();
    await expect(page.locator('#billCopyBtn')).toHaveText('📋 Copy Paid Summary');

    await page.click('#expensesTabBtn');
    await expect(page.locator('#expensesPane')).toBeVisible();
    await expect(page.locator('#paidPane')).toBeHidden();
    await expect(page.locator('#billCopyBtn')).toHaveText('📋 Copy Summary');
  });

  test('renders paid stats and entries, splitting monthly from additional', async ({ page }) => {
    await openApp(page, { hash: 'bills' });
    await page.click('#paidTabBtn');

    expect(await statLabels(page, '#paidStatsGrid')).toEqual(['Total Collected', 'Entries', 'Records ⓘ']);
    const values = await statValues(page, '#paidStatsGrid');
    expect(values[0]).toBe('₹2,172');
    expect(values[1]).toBe('4');
    await expect(page.locator('#paidStatsGrid .status-split span')).toHaveText([
      '2 Monthly',
      '2 Additional',
    ]);

    const entries = page.locator('#paidContent .paid-entry-card');
    await expect(entries).toHaveCount(4);
    await expect(page.locator('#paidContent .paid-entry-card-add')).toHaveCount(2);
    await expect(page.locator('#paidContent .paid-entry-amount')).toHaveText([
      '₹630',
      '₹727',
      '₹500',
      '₹315',
    ]);
    await expect(entries.first()).toContainText('17 November 2026');
    await expect(entries.first().locator('.bill-special-badge')).toContainText('Paid');
    await expect(entries.nth(1).locator('.bill-monthly-badge')).toContainText('Monthly');
    await expect(page.locator('#paidInfoBtn')).toBeVisible();
  });

  test('filters paid entries by date and type', async ({ page }) => {
    await openApp(page, { hash: 'bills' });
    await page.click('#paidTabBtn');

    await page.fill('#paidSearchInput', 'drainage');
    await expect(page.locator('#paidContent .paid-entry-card')).toHaveCount(1);
    await expect(page.locator('#paidContent .paid-entry-amount')).toHaveText('₹315');

    await page.fill('#paidSearchInput', 'monthly');
    await expect(page.locator('#paidContent .paid-entry-card')).toHaveCount(2);

    await page.fill('#paidSearchInput', '17 november');
    await expect(page.locator('#paidContent .paid-entry-card')).toHaveCount(1);

    await page.fill('#paidSearchInput', 'nothing-here');
    await expect(page.locator('#paidContent .bill-empty-state')).toContainText(
      'No paid entries matching "nothing-here"'
    );
    await expect(page.locator('.toast').filter({ hasText: 'No collections matching' })).toBeVisible();

    await page.fill('#paidSearchInput', '');
    await expect(page.locator('#paidContent .paid-entry-card')).toHaveCount(4);
  });

  test('opens and closes the paid breakdown modal in all supported ways', async ({ page }) => {
    await openApp(page, { hash: 'bills' });
    await page.click('#paidTabBtn');

    const modal = page.locator('#paidBreakdownModal');
    await expect(modal).toHaveAttribute('role', 'dialog');
    await expect(modal).toHaveAttribute('aria-modal', 'true');

    // Open with the info button.
    await page.click('#paidInfoBtn');
    await expect(modal).toBeVisible();
    const rows = page.locator('#paidBreakdownBody .breakdown-row');
    await expect(rows).toHaveCount(4);
    await expect(rows.nth(0)).toContainText('Monthly');
    await expect(rows.nth(0)).toContainText('₹1,227');
    await expect(rows.nth(1)).toContainText('Paid');
    await expect(rows.nth(1)).toContainText('₹630');
    await expect(rows.nth(2)).toContainText('Drainage');
    await expect(rows.nth(2)).toContainText('₹315');
    await expect(rows.nth(3)).toContainText('Total Collected');
    await expect(rows.nth(3)).toContainText('₹2,172');

    // Close button.
    await page.click('#paidBreakdownClose');
    await expect(modal).toBeHidden();

    // Escape key.
    await page.click('#paidInfoBtn');
    await expect(modal).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();

    // Overlay backdrop.
    await page.click('#paidInfoBtn');
    await expect(modal).toBeVisible();
    await modal.click({ position: { x: 5, y: 10 } });
    await expect(modal).toBeHidden();
  });

  test('copies the paid summary with monthly and additional totals', async ({ page }) => {
    await openApp(page, { hash: 'bills' });
    await page.click('#paidTabBtn');
    await page.click('#billCopyBtn');

    await expect(page.locator('.toast').filter({ hasText: 'Copied paid summary to clipboard!' })).toBeVisible();
    const clipboard = await readClipboard(page);

    expect(clipboard).toContain('54GNs Apartments - Paid Collections Summary');
    expect(clipboard).toContain('✅ 29 July 2026 - Drainage: ₹315 (Additional)');
    expect(clipboard).toContain('Total Collected: ₹2,172');
    expect(clipboard).toContain('Monthly: ₹1,227');
    expect(clipboard).toContain('Additional: ₹945');
    expect(clipboard).toContain('Payment dates mentioned are for Flat 7');
  });
});

test.describe('Bills — copy & print actions', () => {
  test('copies the expense summary with grand totals', async ({ page }) => {
    await openApp(page, { hash: 'bills' });
    await page.click('#billCopyBtn');

    await expect(page.locator('.toast').filter({ hasText: 'Copied bill summary to clipboard!' })).toBeVisible();
    const clipboard = await readClipboard(page);

    expect(clipboard).toContain('54GNs Apartments - Maintenance Bills Summary');
    expect(clipboard).toContain('[ADDITIONAL EXPENSE] 17 November 2026');
    expect(clipboard).toContain('Total: ₹5,040 | Per Flat (÷8): ₹630');
    expect(clipboard).toContain('Grand Total: ₹17,356 | Overall Per Flat: ₹2,169.50');
  });

  test('print action calls window.print', async ({ page }) => {
    await openApp(page, { hash: 'bills' });
    await stubPrint(page);

    await page.click('#billPrintBtn');
    await expect(page.locator('.toast').filter({ hasText: 'Preparing printable document...' })).toBeVisible();
    await expect.poll(() => printCalls(page)).toBe(1);
  });
});
