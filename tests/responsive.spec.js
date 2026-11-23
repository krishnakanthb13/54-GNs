'use strict';

const { test, expect, openApp, scrollTo, overflowState } = require('./helpers');

const WIDTHS = [320, 360, 375, 390, 414, 768, 1024, 1440];

test.describe('Responsive layout', () => {
  test('no horizontal overflow on any view at common widths', async ({ page }) => {
    await openApp(page, { hash: 'bills' });

    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      await scrollTo(page, 0);

      // Expenses
      let state = await overflowState(page);
      expect(state.scrollWidth, `bills expenses @${width}px`).toBe(state.clientWidth);

      // Paid
      await page.click('#paidTabBtn');
      state = await overflowState(page);
      expect(state.scrollWidth, `bills paid @${width}px`).toBe(state.clientWidth);

      // Issues
      await page.click('#issuesBtn');
      state = await overflowState(page);
      expect(state.scrollWidth, `issues @${width}px`).toBe(state.clientWidth);

      // Rotation
      await page.click('#backBtn');
      state = await overflowState(page);
      expect(state.scrollWidth, `rotation @${width}px`).toBe(state.clientWidth);

      // Back to bills for the next width.
      await page.click('#billBtn');
      await page.click('#expensesTabBtn');
    }
  });

  test('bills tabs stick directly under the sticky header', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openApp(page, { hash: 'bills' });

    const headerHeight = await page.locator('.header').evaluate((el) => el.getBoundingClientRect().height);
    expect(Math.round(headerHeight)).toBe(55);
    expect(await page.locator('.bill-tabs').evaluate((el) => getComputedStyle(el).position)).toBe('sticky');

    await scrollTo(page, 600);
    const box = await page.evaluate(() => ({
      scrollY: window.scrollY,
      headerHeight: document.querySelector('.header').getBoundingClientRect().height,
      tabsTop: document.querySelector('.bill-tabs').getBoundingClientRect().top,
    }));

    expect(box.scrollY).toBeGreaterThan(400);
    expect(Math.abs(box.tabsTop - box.headerHeight), 'tabs pinned under header').toBeLessThan(1.5);
  });

  test('header content and bill cards share the same grid', async ({ page }) => {
    await openApp(page, { hash: 'bills' });

    for (const width of [375, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await scrollTo(page, 0);

      const boxes = await page.evaluate(() => {
        const tabs = document.querySelector('.bill-tabs').getBoundingClientRect();
        const card = document.querySelector('#billContent .bill-period-card').getBoundingClientRect();
        return {
          tabs: { left: tabs.left, right: tabs.right },
          card: { left: card.left, right: card.right },
          clientWidth: document.documentElement.clientWidth,
        };
      });

      expect(Math.abs(boxes.tabs.left - boxes.card.left), `left edge @${width}px`).toBeLessThan(1);
      expect(Math.abs(boxes.tabs.right - boxes.card.right), `right edge @${width}px`).toBeLessThan(1);
    }
  });

  test('mobile viewport keeps the primary controls usable', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openApp(page, { hash: 'bills' });

    // Compact design: ~36px tall, which stays comfortably tappable.
    for (const id of ['#expensesTabBtn', '#paidTabBtn']) {
      const box = await page.locator(id).boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(36);
    }

    // Navigation controls fit inside the header.
    for (const id of ['#backBtn', '#billBtn', '#issuesBtn', '#themeToggle', '#printBtn']) {
      const box = await page.locator(id).boundingBox();
      expect(box.x, `${id} starts on screen`).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width, `${id} ends on screen`).toBeLessThanOrEqual(390);
    }

    // Switching tabs on a phone still works.
    await page.click('#paidTabBtn');
    await expect(page.locator('#paidPane')).toBeVisible();
    await expect(page.locator('#paidSummaryCard')).toBeVisible();
  });
});
