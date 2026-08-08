import { test, expect } from '@playwright/test';

test('Amazon live search structure still exposes sponsored search listings', async ({
  browser,
}) => {
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
      'AppleWebKit/537.36 (KHTML, like Gecko) ' +
      'Chrome/150.0.0.0 Safari/537.36',
    viewport: {
      width: 1440,
      height: 1000,
    },
    locale: 'en-GB',
    timezoneId: 'Europe/London',
  });

  const page = await context.newPage();

  const searchUrl = 'https://www.amazon.co.uk/s?k=cordless+drill';

  const maxAttempts = 3;

  let resultCount = 0;
  let sponsoredCount = 0;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`Amazon search attempt ${attempt}/${maxAttempts}`);

    await page.goto(searchUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    // Amazon renders search results asynchronously.
    await page.waitForTimeout(5000);

    resultCount = await page.locator('[role="listitem"]').count();

    console.log(`Amazon result items: ${resultCount}`);

    sponsoredCount = await page.locator('.puis-sponsored-label-text').count();

    console.log(`Sponsored labels: ${sponsoredCount}`);

    console.log(`Amazon URL: ${page.url()}`);

    console.log(`Amazon title: ${await page.title()}`);

    if (resultCount === 0) {
      console.log(
        `Amazon body preview:\n${(await page.locator('body').innerText()).slice(0, 2000)}`,
      );

      await page.screenshot({
        path: `test-results/amazon-attempt-${attempt}.png`,
        fullPage: true,
      });
    }

    if (resultCount > 0 && sponsoredCount > 0) {
      break;
    }

    if (attempt < maxAttempts) {
      console.log('Amazon did not return a usable sponsored search page; retrying...');

      await page.waitForTimeout(2000);
    }
  }

  expect(
    resultCount,
    'Amazon returned no usable search results after all attempts.',
  ).toBeGreaterThan(0);

  expect(sponsoredCount, 'Amazon returned no sponsored labels after all attempts.').toBeGreaterThan(
    0,
  );

  let sponsoredSearchResults = 0;
  let nonResultSponsoredLabels = 0;

  const sponsoredLabels = page.locator('.puis-sponsored-label-text');

  for (let i = 0; i < sponsoredCount; i++) {
    const label = sponsoredLabels.nth(i);

    await expect(label).toBeVisible();

    const resultItem = label.locator('xpath=ancestor::div[@role="listitem"][1]');

    const resultItemCount = await resultItem.count();

    if (resultItemCount === 0) {
      nonResultSponsoredLabels++;

      console.log(`Sponsored label ${i + 1} is outside a role=listitem result`);

      continue;
    }

    sponsoredSearchResults++;

    // Critical relationship used by the userscript:
    //
    // .puis-sponsored-label-text
    //        ↓
    // div[role="listitem"]
    //
    // If Amazon changes this relationship, this test should fail.

    const title = resultItem.locator('h2');

    await expect(title, `Sponsored search result ${i + 1} has no h2 title`).toHaveCount(1);

    const titleText = (await title.innerText()).trim();

    expect(titleText.length, `Sponsored search result ${i + 1} has an empty title`).toBeGreaterThan(
      0,
    );

    console.log(`Sponsored search listing ${sponsoredSearchResults}: ${titleText}`);
  }

  console.log(`Sponsored search listings: ${sponsoredSearchResults}`);
  console.log(`Sponsored labels outside search results: ${nonResultSponsoredLabels}`);

  expect(
    sponsoredSearchResults,
    'Amazon returned sponsored labels but none were inside div[role="listitem"]. ' +
      'The DOM structure required by the userscript may have changed.',
  ).toBeGreaterThan(0);

  await context.close();
});
