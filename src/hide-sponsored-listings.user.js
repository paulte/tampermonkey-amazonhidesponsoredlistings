// ==UserScript==
// @name         Hide Sponsored Listings in Amazon Search
// @namespace    https://github.com/paulte/tampermonkey-amazonhidesponsoredlistings
// @description  Remove sponsored listings from Amazon search results
// @author       paulte
// @match        https://www.amazon.co.uk/s*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  let removeTimeout;

  function removeSponsored() {
    const sponsoredLabels = document.querySelectorAll('.puis-sponsored-label-text');

    sponsoredLabels.forEach((label) => {
      const item = label.closest('div[role="listitem"]');

      if (item) {
        item.remove();
        console.log('Removed sponsored listing.');
      }
    });
  }

  function debouncedRemoveSponsored() {
    clearTimeout(removeTimeout);
    removeTimeout = setTimeout(removeSponsored, 300);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', removeSponsored);
  } else {
    removeSponsored();
  }

  const observer = new MutationObserver(debouncedRemoveSponsored);

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
})();
