import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USERSCRIPT_PATH = path.join(__dirname, '../src/hide-sponsored-listings.user.js');

const USERSCRIPT = fs.readFileSync(USERSCRIPT_PATH, 'utf8');

const AMAZON_SEARCH_URL = 'https://www.amazon.co.uk/s?k=cordless+drill';

const SEARCH_RESULTS_CONTAINER = '.s-main-slot.s-result-list.s-search-results';

test('userscript removes an initially present sponsored listitem', async ({ page }) => {
  await page.goto(AMAZON_SEARCH_URL, {
    waitUntil: 'domcontentloaded',
  });

  await page.waitForSelector(SEARCH_RESULTS_CONTAINER, {
    timeout: 15000,
  });

  await page.evaluate((resultsSelector) => {
    const results = document.querySelector(resultsSelector);

    if (!results) {
      throw new Error('Could not find Amazon search results');
    }

    const sponsored = document.createElement('div');

    sponsored.className = 'test-sponsored-listitem';
    sponsored.setAttribute('role', 'listitem');

    const marker = document.createElement('span');

    marker.className = 'puis-sponsored-label-text';
    marker.textContent = 'Sponsored';

    sponsored.appendChild(marker);
    results.prepend(sponsored);
  }, SEARCH_RESULTS_CONTAINER);

  await expect(page.locator('.test-sponsored-listitem')).toHaveCount(1);

  await expect(page.locator('.test-sponsored-listitem .puis-sponsored-label-text')).toHaveCount(1);

  await page.addScriptTag({
    content: USERSCRIPT,
  });

  await expect(page.locator('.test-sponsored-listitem')).toHaveCount(0);
});

test('userscript removes an initially present sponsored card container', async ({ page }) => {
  await page.goto(AMAZON_SEARCH_URL, {
    waitUntil: 'domcontentloaded',
  });

  await page.waitForSelector(SEARCH_RESULTS_CONTAINER, {
    timeout: 15000,
  });

  await page.evaluate((resultsSelector) => {
    const results = document.querySelector(resultsSelector);

    if (!results) {
      throw new Error('Could not find Amazon search results');
    }

    const sponsored = document.createElement('div');

    sponsored.className = 'puis-card-container test-sponsored-card';

    const marker = document.createElement('span');

    marker.className = 'puis-sponsored-label-text';
    marker.textContent = 'Sponsored';

    sponsored.appendChild(marker);
    results.prepend(sponsored);
  }, SEARCH_RESULTS_CONTAINER);

  await expect(page.locator('.test-sponsored-card')).toHaveCount(1);

  await page.addScriptTag({
    content: USERSCRIPT,
  });

  await expect(page.locator('.test-sponsored-card')).toHaveCount(0);
});

test('userscript removes a dynamically inserted sponsored result', async ({ page }) => {
  await page.goto(AMAZON_SEARCH_URL, {
    waitUntil: 'domcontentloaded',
  });

  await page.waitForSelector(SEARCH_RESULTS_CONTAINER, {
    timeout: 15000,
  });

  /*
   * Load the userscript first so its MutationObserver is active.
   */
  await page.addScriptTag({
    content: USERSCRIPT,
  });

  await page.evaluate((resultsSelector) => {
    const results = document.querySelector(resultsSelector);

    if (!results) {
      throw new Error('Could not find Amazon search results');
    }

    /*
     * Model the newer Amazon sponsored card structure.
     */
    const sponsored = document.createElement('div');

    sponsored.className = 'puis-card-container test-dynamic-sponsored-result';

    const marker = document.createElement('span');

    marker.className = 'puis-sponsored-label-text';
    marker.textContent = 'Sponsored';

    sponsored.appendChild(marker);

    /*
     * Insert after the userscript and MutationObserver
     * are active.
     */
    results.prepend(sponsored);
  }, SEARCH_RESULTS_CONTAINER);

  /*
   * The MutationObserver should detect the insertion and
   * remove the sponsored card.
   */
  await expect(page.locator('.test-dynamic-sponsored-result')).toHaveCount(0, {
    timeout: 5000,
  });
});
