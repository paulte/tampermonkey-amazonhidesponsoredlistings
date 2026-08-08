// ==UserScript==
// @name         Hide Sponsored Listings in Amazon Search
// @namespace    https://github.com/paulte/tampermonkey-amazonhidesponsoredlistings
// @homepageURL  https://github.com/paulte/tampermonkey-amazonhidesponsoredlistings
// @supportURL   https://github.com/paulte/tampermonkey-amazonhidesponsoredlistings/issues
// @description  Remove sponsored listings from Amazon search results
// @author       paulte
// @match        https://www.amazon.co.uk/s*
// @grant        none
// ==/UserScript==
//
/* global Node */

(function () {
  'use strict';

  const SPONSORED_MARKER = 'span[aria-label="Leave feedback on Sponsored ad"]';

  const SEARCH_RESULTS_CONTAINER = '.s-main-slot.s-result-list.s-search-results';

  /**
   * Starting at a Sponsored marker, walk up the DOM until we
   * find the result element whose parent is Amazon's search-results
   * container.
   *
   * This deliberately does NOT rely on:
   * - search_result_XX
   * - ASIN
   * - product name
   * - seller name
   * - generated CSS class suffixes
   */
  function findSponsoredResult(marker) {
    let element = marker;

    while (element && element !== document.body) {
      const parent = element.parentElement;

      if (parent && parent.matches(SEARCH_RESULTS_CONTAINER)) {
        return element;
      }

      element = parent;
    }

    return null;
  }

  /**
   * Remove sponsored results found beneath the supplied root.
   *
   * WeakSet prevents the same result from being processed repeatedly
   * if Amazon moves or updates its DOM.
   */
  const processed = new WeakSet();

  function removeSponsored(root = document) {
    const markers = [];

    if (root.nodeType === Node.ELEMENT_NODE && root.matches?.(SPONSORED_MARKER)) {
      markers.push(root);
    }

    if (root.querySelectorAll) {
      markers.push(...root.querySelectorAll(SPONSORED_MARKER));
    }

    for (const marker of markers) {
      const result = findSponsoredResult(marker);

      if (!result || processed.has(result)) {
        continue;
      }

      processed.add(result);

      result.remove();

      console.log('Removed sponsored Amazon result.');
    }
  }

  /**
   * Initial page scan.
   */
  function initialise() {
    removeSponsored();
  }

  /**
   * Amazon dynamically inserts search results and advertising
   * components after the initial page load.
   *
   * Watch for newly-added DOM and inspect only those additions.
   */
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          removeSponsored(node);
        }
      }
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialise, { once: true });
  } else {
    initialise();
  }

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
})();
