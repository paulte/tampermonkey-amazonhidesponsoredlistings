import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('userscript removes a sponsored Amazon listing', async ({ page }) => {
  await page.goto('https://www.amazon.co.uk/s?k=cordless+drill', { waitUntil: 'domcontentloaded' });

  // Find a real search result from Amazon's LIVE DOM.
  const resultSelector = 'div[role="listitem"][data-asin]';

  await page.waitForSelector(resultSelector, {
    timeout: 15000,
  });

  const resultCount = await page.locator(resultSelector).count();

  console.log(`Amazon result items: ${resultCount}`);

  expect(resultCount).toBeGreaterThan(0);

  // Use an actual Amazon result as the basis of our controlled test.
  await page.evaluate((selector) => {
    const original = document.querySelector(selector);

    if (!original) {
      throw new Error('Could not find an Amazon search result');
    }

    const sponsored = original.cloneNode(true);

    sponsored.setAttribute('data-asin', 'TEST-SPONSORED-ASIN');

    // Remove any existing sponsored markers from the clone.
    sponsored.querySelectorAll('.puis-sponsored-label-text').forEach((element) => element.remove());

    // Add the sponsored marker that the userscript is designed
    // to detect.
    const marker = document.createElement('span');

    marker.className = 'puis-sponsored-label-text';
    marker.textContent = 'Sponsored';

    sponsored.prepend(marker);

    original.parentElement.insertBefore(sponsored, original);
  }, resultSelector);

  // Confirm our controlled sponsored result exists.
  await expect(page.locator('div[role="listitem"][data-asin="TEST-SPONSORED-ASIN"]')).toHaveCount(
    1,
  );

  // Confirm the sponsored marker exists inside it.
  await expect(
    page.locator(
      'div[role="listitem"][data-asin="TEST-SPONSORED-ASIN"] .puis-sponsored-label-text',
    ),
  ).toHaveCount(1);

  // Load the userscript being tested.
  const userscriptPath = path.join(__dirname, '../src/hide-sponsored-listings.user.js');

  const userscript = fs.readFileSync(userscriptPath, 'utf8');

  await page.addScriptTag({
    content: userscript,
  });

  // The userscript uses a 300ms debounce.
  await page.waitForTimeout(500);

  // The sponsored listing should have been removed.
  await expect(page.locator('div[role="listitem"][data-asin="TEST-SPONSORED-ASIN"]')).toHaveCount(
    0,
  );
});
