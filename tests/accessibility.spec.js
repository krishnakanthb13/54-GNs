'use strict';

const { test, expect, openApp } = require('./helpers');

function durationToSeconds(value) {
  const parsed = parseFloat(value);
  return value.trim().endsWith('ms') ? parsed / 1000 : parsed;
}

test.describe('Accessibility basics', () => {
  test('every interactive control has an accessible name', async ({ page }) => {
    await openApp(page, { hash: 'bills' });

    const unnamed = async () =>
      page.evaluate(() => {
        const nodes = document.querySelectorAll('button, input, select, textarea, a[href]');
        return [...nodes]
          .filter((el) => {
            const style = getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden') return false;
            if (el.closest('.hidden')) return false;
            return true;
          })
          .filter((el) => {
            const name =
              (el.getAttribute('aria-label') || '').trim() ||
              (el.textContent || '').trim() ||
              (el.getAttribute('title') || '').trim() ||
              (el.getAttribute('placeholder') || '').trim();
            return !name;
          })
          .map((el) => el.outerHTML.slice(0, 100));
      });

    expect(await unnamed(), 'bills view').toEqual([]);

    await page.click('#issuesBtn');
    expect(await unnamed(), 'issues view').toEqual([]);

    await page.click('#backBtn');
    expect(await unnamed(), 'rotation view').toEqual([]);
  });

  test('document landmark, language and unique ids are sane', async ({ page }) => {
    await openApp(page);

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('#toastContainer')).toHaveAttribute('aria-live', 'polite');

    const duplicateIds = await page.evaluate(() => {
      const seen = new Set();
      const dupes = [];
      for (const el of document.querySelectorAll('[id]')) {
        if (seen.has(el.id)) dupes.push(el.id);
        seen.add(el.id);
      }
      return dupes;
    });
    expect(duplicateIds).toEqual([]);
  });

  test('bill tabs expose their pressed state and controlled pane', async ({ page }) => {
    await openApp(page, { hash: 'bills' });

    for (const [tab, pane] of [
      ['#expensesTabBtn', 'expensesPane'],
      ['#paidTabBtn', 'paidPane'],
    ]) {
      await expect(page.locator(tab)).toHaveAttribute('aria-controls', pane);
      await expect(page.locator(`#${pane}`)).toHaveCount(1);
    }

    await expect(page.locator('#expensesTabBtn')).toHaveAttribute('aria-pressed', 'true');
    await page.click('#paidTabBtn');
    await expect(page.locator('#paidTabBtn')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#expensesTabBtn')).toHaveAttribute('aria-pressed', 'false');
  });

  test('keyboard focus shows a visible ring on header and action controls', async ({ page }) => {
    await openApp(page);

    const focused = [];
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab');
      focused.push(
        await page.evaluate(() => {
          const el = document.activeElement;
          const style = getComputedStyle(el);
          return {
            id: el.id || el.className || el.tagName,
            outlineStyle: style.outlineStyle,
            outlineWidth: parseFloat(style.outlineWidth),
          };
        })
      );
    }

    expect(focused.slice(0, 4).map((f) => f.id)).toEqual([
      'billBtn',
      'issuesBtn',
      'themeToggle',
      'printBtn',
    ]);
    // Share only appears in the tab order when the browser supports Web Share.
    expect(['copyBtn', 'shareBtn']).toContain(focused[4].id);
    expect(['shareBtn', 'exportCsvBtn']).toContain(focused[5].id);
    for (const item of focused) {
      expect(item.outlineStyle, `${item.id} outline style`).toBe('solid');
      expect(item.outlineWidth, `${item.id} outline width`).toBeGreaterThanOrEqual(2);
    }
  });
});

test.describe('Reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('honours prefers-reduced-motion', async ({ page }) => {
    await openApp(page);

    const motion = await page.evaluate(() => ({
      scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
      countdownAnimation: getComputedStyle(document.querySelector('#countdown')).animationDuration,
    }));

    expect(motion.scrollBehavior).toBe('auto');
    expect(durationToSeconds(motion.countdownAnimation)).toBeLessThan(0.05);

    await page.click('#billBtn');
    const tabTransition = await page
      .locator('#expensesTabBtn')
      .evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(durationToSeconds(tabTransition)).toBeLessThan(0.05);
  });
});
