import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USERSCRIPT_PATH = path.join(__dirname, '../src/hide-sponsored-listings.user.js');

const USERSCRIPT = fs.readFileSync(USERSCRIPT_PATH, 'utf8');

const AMAZON_SEARCH_URL = 'https://www.amazon.co.uk/s?k=cordless+drill';

const SPONSORED_MARKER = 'span[aria-label="Leave feedback on Sponsored ad"]';

const SEARCH_RESULTS_CONTAINER = '.s-main-slot.s-result-list.s-search-results';

test('userscript removes an initially present sponsored Amazon result', async ({ page }) => {
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

    /*
     * Create a synthetic sponsored result.
     *
     * Deliberately do NOT use:
     * - search_result_XX
     * - data-asin
     * - product names
     * - seller names
     * - Amazon generated CSS classes
     */
    const sponsored = document.createElement('div');

    sponsored.className = 'test-sponsored-result';

    const content = document.createElement('div');
    content.textContent = 'Synthetic sponsored listing';

    const marker = document.createElement('span');

    marker.setAttribute('aria-label', 'Leave feedback on Sponsored ad');

    marker.setAttribute('role', 'button');
    marker.textContent = 'Sponsored';

    content.prepend(marker);
    sponsored.appendChild(content);

    results.prepend(sponsored);
  }, SEARCH_RESULTS_CONTAINER);

  await expect(page.locator('.test-sponsored-result')).toHaveCount(1);

  await expect(page.locator(`.test-sponsored-result ${SPONSORED_MARKER}`)).toHaveCount(1);

  await page.addScriptTag({
    content: USERSCRIPT,
  });

  await expect(page.locator('.test-sponsored-result')).toHaveCount(0);
});

test('userscript removes a dynamically inserted sponsored Amazon result', async ({ page }) => {
  await page.goto(AMAZON_SEARCH_URL, {
    waitUntil: 'domcontentloaded',
  });

  await page.waitForSelector(SEARCH_RESULTS_CONTAINER, {
    timeout: 15000,
  });

  /*
   * Load the userscript BEFORE adding the sponsored result.
   *
   * The MutationObserver must therefore detect the new content.
   */
  await page.addScriptTag({
    content: USERSCRIPT,
  });

  await page.evaluate((resultsSelector) => {
    const results = document.querySelector(resultsSelector);

    if (!results) {
      throw new Error('Could not find Amazon search results');
    }

    const sponsored = document.createElement('div');

    sponsored.className = 'test-dynamic-sponsored-result';

    const content = document.createElement('div');

    content.textContent = 'Synthetic dynamically loaded sponsored listing';

    const marker = document.createElement('span');

    marker.setAttribute('aria-label', 'Leave feedback on Sponsored ad');

    marker.setAttribute('role', 'button');
    marker.textContent = 'Sponsored';

    content.appendChild(marker);
    sponsored.appendChild(content);

    /*
     * Insert AFTER the userscript and MutationObserver
     * are active.
     */
    results.prepend(sponsored);
  }, SEARCH_RESULTS_CONTAINER);

  /*
   * The MutationObserver should detect and remove it.
   *
   * We deliberately expect ZERO here because the observer
   * may remove the element before Playwright can observe it.
   */
  await expect(page.locator('.test-dynamic-sponsored-result')).toHaveCount(0, {
    timeout: 5000,
  });
});
