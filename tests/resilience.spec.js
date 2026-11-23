'use strict';

const { test, expect, openApp, statValues } = require('./helpers');

test.describe('Data resilience', () => {
  test('shows an offline fallback when maintenance.txt cannot be fetched', async ({ page }) => {
    await page.route('**/maintenance.txt*', (route) => route.abort('failed'));
    await page.goto('/#bills');
    await expect(page.locator('#loadingOverlay')).toHaveCount(0);

    await expect(
      page.locator('.toast').filter({ hasText: 'Offline: no cached records available yet' })
    ).toBeVisible();
    await expect(page.locator('#billContent')).toContainText('No billing data available.');
    await expect(page.locator('#paidContent')).toContainText('No paid collections recorded yet.');
    await expect(page.locator('#issuesContent')).toContainText('No issues logged in maintenance.txt');
  });

  test('handles a file with empty sections', async ({ page }) => {
    await openApp(page, { hash: 'bills', fixtureName: 'empty-sections.txt' });

    await expect(page.locator('#billContent')).toContainText('No billing data found in maintenance.txt');
    const values = await statValues(page);
    expect(values[0]).toBe('₹0');
    expect(values[1]).toBe('₹0');
    await expect(page.locator('#billStatsGrid .status-split span')).toHaveText(['0 Monthly', '0 Additional']);

    await page.click('#paidTabBtn');
    await expect(page.locator('#paidContent')).toContainText('No paid collections recorded yet.');

    await page.click('#issuesBtn');
    await expect(page.locator('#issuesContent')).toContainText('No issues logged in maintenance.txt');
    expect(await statValues(page, '#issueStatsGrid')).toEqual(['0', '✅ 0', '⏳ 0']);
  });

  test('ignores malformed rows while keeping valid ones', async ({ page }) => {
    await openApp(page, { hash: 'bills', fixtureName: 'malformed.txt' });

    await expect(page.locator('#billContent .bill-period-card')).toHaveCount(2);
    await expect(page.locator('#billContent .bill-table-row')).toHaveCount(3);
    await expect(page.locator('#billContent .bill-item-name').filter({ hasText: 'Name' })).toHaveCount(0);

    const values = await statValues(page);
    expect(values[0]).toBe('₹2,481.46');
    expect(values[1]).toBe('₹310.18');
    await expect(page.locator('#billStatsGrid .status-split span')).toHaveText(['1 Monthly', '1 Additional']);

    await page.click('#paidTabBtn');
    await expect(page.locator('#paidContent')).toContainText('No paid collections recorded yet.');

    await page.click('#issuesBtn');
    await expect(page.locator('#issuesContent')).toContainText('No issues logged in maintenance.txt');
  });

  test('escapes untrusted text instead of injecting markup', async ({ page }) => {
    await openApp(page, { hash: 'bills', fixtureName: 'xss.txt' });

    await expect(page.locator('#billContent .bill-item-name')).toContainText('<b>Bold</b> & "quotes"');
    await expect(page.locator('#billContent img')).toHaveCount(0);
    await expect(page.locator('#billContent b')).toHaveCount(0);
    await expect(page.locator('#billContent script')).toHaveCount(0);
    expect(await page.evaluate(() => window.__xss)).toBeUndefined();

    await page.click('#issuesBtn');
    await expect(page.locator('#issuesContent .issue-card-title')).toContainText('<img src=x');
    await expect(page.locator('#issuesContent img')).toHaveCount(0);
    await expect(page.locator('#issuesContent script')).toHaveCount(0);
    await expect(page.locator('#issuesContent .issue-context-list')).toContainText(
      '<script>window.__xss=3</script>'
    );
    expect(await page.evaluate(() => window.__xss)).toBeUndefined();
  });

  test('the real maintenance.txt still renders every view', async ({ page }) => {
    await openApp(page, { hash: 'bills', fixtureName: false });

    expect(await page.locator('#billContent .bill-period-card').count()).toBeGreaterThan(0);
    await expect(page.locator('#billContent .bill-table-row').first()).toBeVisible();
    expect((await statValues(page))[0]).toMatch(/^₹/);

    await page.click('#paidTabBtn');
    await expect(
      page.locator('#paidContent .paid-entry-card, #paidContent .bill-empty-state').first()
    ).toBeVisible();

    await page.click('#issuesBtn');
    await expect(
      page.locator('#issuesContent .issue-card, #issuesContent .bill-empty-state').first()
    ).toBeVisible();
  });
});
