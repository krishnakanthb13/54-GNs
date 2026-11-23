'use strict';

const path = require('path');
const fs = require('fs');
const base = require('@playwright/test');

const { expect } = base;

const FIXTURE_DIR = path.join(__dirname, 'fixtures');
const DEFAULT_FIXTURE = 'maintenance.fixture.txt';

function readFixture(name) {
  return fs.readFileSync(path.join(FIXTURE_DIR, name), 'utf8');
}

/**
 * Replace the network copy of maintenance.txt with a deterministic fixture.
 * `source` can be a fixture file name or raw file contents.
 */
async function routeMaintenance(page, source = DEFAULT_FIXTURE) {
  const body = source.includes('\n') ? source : readFixture(source);
  await page.route('**/maintenance.txt*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/plain; charset=utf-8',
      body,
    })
  );
  return body;
}

/**
 * Load the app with a deterministic data source.
 *
 * @param {import('@playwright/test').Page} page
 * @param {object} [options]
 * @param {string} [options.hash] e.g. "bills" or "#issues"
 * @param {string|false} [options.fixtureName] fixture file, raw text, or false for real data
 * @param {string|null} [options.clock] ISO timestamp installed before navigation
 */
async function openApp(page, { hash = '', fixtureName = DEFAULT_FIXTURE, clock = null } = {}) {
  if (clock) {
    // Fix Date only; keep real timers so rendering, polling and teardown stay normal.
    await page.clock.setFixedTime(new Date(clock));
  }
  if (fixtureName !== false) {
    await routeMaintenance(page, fixtureName);
  }
  const suffix = hash && !hash.startsWith('#') ? `#${hash}` : hash;
  await page.goto(`/${suffix}`);
  // The app removes its loading overlay once the first render settles.
  await expect(page.locator('#loadingOverlay')).toHaveCount(0);
}

async function stubPrint(page) {
  await page.evaluate(() => {
    window.__printCalls = 0;
    window.print = () => {
      window.__printCalls += 1;
    };
  });
}

function printCalls(page) {
  return page.evaluate(() => window.__printCalls ?? 0);
}

async function readClipboard(page) {
  return page.evaluate(() => navigator.clipboard.readText());
}

/** Issue titles without the leading status emoji, in DOM order. */
async function issueTitles(page) {
  const texts = await page.locator('#issuesContent .issue-card-title').allTextContents();
  return texts.map((t) => t.replace(/^[^\p{L}\p{N}]+/u, '').trim());
}

/** Stat values rendered inside a summary card. */
function statValues(page, container = '#billStatsGrid') {
  return page.locator(`${container} .status-value`).allTextContents();
}

function statLabels(page, container = '#billStatsGrid') {
  return page.locator(`${container} .status-label`).allTextContents();
}

async function scrollTo(page, y) {
  await page.evaluate((target) => {
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, target);
  }, y);
}

async function overflowState(page) {
  return page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }));
}

// Every test fails if an uncaught exception escapes the app.
const test = base.test.extend({
  pageErrors: async ({ page }, use) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await use(errors);
    expect(errors, 'uncaught page errors').toEqual([]);
  },
});

module.exports = {
  test,
  expect,
  DEFAULT_FIXTURE,
  readFixture,
  routeMaintenance,
  openApp,
  stubPrint,
  printCalls,
  readClipboard,
  issueTitles,
  statValues,
  statLabels,
  scrollTo,
  overflowState,
};
