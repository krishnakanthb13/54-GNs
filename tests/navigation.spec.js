'use strict';

const { test, expect, openApp, stubPrint, printCalls } = require('./helpers');

test.describe('Navigation between views', () => {
  test('starts on the rotation view with the default chrome', async ({ page }) => {
    await openApp(page);

    await expect(page.locator('#rotationView')).toBeVisible();
    await expect(page.locator('#billsView')).toBeHidden();
    await expect(page.locator('#issuesView')).toBeHidden();
    await expect(page.locator('#backBtn')).toBeHidden();
    await expect(page.locator('#pageTitle')).toHaveText('54GNs Apartments Water Motor Rotation');
    await expect(page.locator('#billBtn')).toHaveAttribute('aria-label', 'Maintenance bills');
    await expect(page.locator('#issuesBtn')).toHaveAttribute('aria-label', 'Maintenance issues');
  });

  test('opens bills and returns with the back button', async ({ page }) => {
    await openApp(page);

    await page.click('#billBtn');
    await expect(page).toHaveURL(/#bills$/);
    await expect(page.locator('#billsView')).toBeVisible();
    await expect(page.locator('#rotationView')).toBeHidden();
    await expect(page.locator('#pageTitle')).toHaveText('Maintenance Bills');
    await expect(page.locator('#backBtn')).toBeVisible();

    await page.click('#backBtn');
    await expect(page).not.toHaveURL(/#(bills|issues)/);
    await expect(page.locator('#rotationView')).toBeVisible();
    await expect(page.locator('#billsView')).toBeHidden();
    await expect(page.locator('#pageTitle')).toHaveText('54GNs Apartments Water Motor Rotation');
    await expect(page.locator('#backBtn')).toBeHidden();
  });

  test('opens issues and returns with the back button', async ({ page }) => {
    await openApp(page);

    await page.click('#issuesBtn');
    await expect(page).toHaveURL(/#issues$/);
    await expect(page.locator('#issuesView')).toBeVisible();
    await expect(page.locator('#rotationView')).toBeHidden();
    await expect(page.locator('#pageTitle')).toHaveText('Maintenance Issues');
    await expect(page.locator('#backBtn')).toBeVisible();

    await page.click('#backBtn');
    await expect(page.locator('#rotationView')).toBeVisible();
  });

  test('supports deep links and reloads', async ({ page }) => {
    await openApp(page, { hash: 'bills' });
    await expect(page.locator('#billsView')).toBeVisible();
    await expect(page.locator('#backBtn')).toBeVisible();

    await page.reload();
    await expect(page.locator('#loadingOverlay')).toHaveCount(0);
    await expect(page.locator('#billsView')).toBeVisible();
    await expect(page.locator('#billContent .bill-period-card')).toHaveCount(5);

    await openApp(page, { hash: 'issues' });
    await expect(page.locator('#issuesView')).toBeVisible();
    await expect(page.locator('#issuesContent .issue-card')).toHaveCount(3);
  });

  test('browser back and forward follow the pushed view history', async ({ page }) => {
    await openApp(page);

    await page.click('#billBtn');
    await page.click('#issuesBtn');
    await expect(page).toHaveURL(/#issues$/);

    await page.goBack();
    await expect(page).toHaveURL(/#bills$/);
    await expect(page.locator('#billsView')).toBeVisible();

    await page.goBack();
    await expect(page.locator('#rotationView')).toBeVisible();
    await expect(page.locator('#backBtn')).toBeHidden();

    await page.goForward();
    await expect(page.locator('#billsView')).toBeVisible();
  });
});

test.describe('Themes', () => {
  const themes = [
    ['dark-violet', 'Obsidian Violet', 'Dark', '#0d0a1a', '🔮'],
    ['dark-emerald', 'Forest Emerald', 'Dark', '#061712', '🌲'],
    ['light-clean', 'Pure Sky', 'Light', '#f8fafc', '☀️'],
    ['light-warm', 'Warm Sand', 'Light', '#faf6f0', '☕'],
    ['light-mint', 'Fresh Mint', 'Light', '#f0fdf4', '🍃'],
    ['dark-slate', 'Dark Slate', 'Dark', '#0b1329', '🌙'],
  ];

  test('defaults to Dark Slate', async ({ page }) => {
    await openApp(page);

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark-slate');
    await expect(page.locator('#themeToggle')).toHaveText('🌙');
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#0b1329');
    await expect(page.locator('#themeToggle')).toHaveAttribute(
      'aria-label',
      'Current theme: Dark Slate. Click to switch.'
    );
  });

  test('cycles through all six themes and wraps around', async ({ page }) => {
    await openApp(page);

    for (const [id, name, kind, colour, icon] of themes) {
      await page.click('#themeToggle');

      await expect(page.locator('html')).toHaveAttribute('data-theme', id);
      await expect(page.locator('#themeToggle')).toHaveText(icon);
      await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', colour);
      await expect(page.locator('#themeToggle')).toHaveAttribute(
        'aria-label',
        `Current theme: ${name}. Click to switch.`
      );
      await expect(page.locator('.toast').filter({ hasText: `Theme: ${name} (${kind})` })).toBeVisible();
      expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe(id);
    }
  });

  test('persists the chosen theme across reloads', async ({ page }) => {
    await openApp(page);

    await page.click('#themeToggle'); // dark-violet
    await page.click('#themeToggle'); // dark-emerald
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark-emerald');

    await page.reload();
    await expect(page.locator('#loadingOverlay')).toHaveCount(0);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark-emerald');
    await expect(page.locator('#themeToggle')).toHaveText('🌲');
  });

  test('maps legacy "light" and "dark" preference values', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('theme', 'light'));
    await openApp(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light-clean');
    await expect(page.locator('#themeToggle')).toHaveText('☀️');
  });

  test('falls back to Dark Slate for an unknown stored theme', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('theme', 'not-a-theme'));
    await openApp(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark-slate');
    await expect(page.locator('#themeToggle')).toHaveText('🌙');
  });
});

test.describe('Header actions', () => {
  test('header print works from every view', async ({ page }) => {
    await openApp(page);
    await stubPrint(page);

    await page.click('#printBtn');
    await expect.poll(() => printCalls(page)).toBe(1);

    await page.click('#billBtn');
    await page.click('#printBtn');
    await expect.poll(() => printCalls(page)).toBe(2);

    await page.click('#issuesBtn');
    await page.click('#printBtn');
    await expect.poll(() => printCalls(page)).toBe(3);
  });
});
