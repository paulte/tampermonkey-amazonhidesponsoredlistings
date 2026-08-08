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

(function () {
  'use strict';

  let removeTimeout;

  function findSponsoredContainer(label) {
    const resultItem = label.closest('div[role="listitem"]');

    if (resultItem) {
      return resultItem;
    }

    const cardContainer = label.closest('.puis-card-container');

    if (cardContainer) {
      return cardContainer;
    }

    const resultContainer = label.closest('.s-result-item');

    if (resultContainer) {
      return resultContainer;
    }

    return null;
  }

  function removeSponsored() {
    const sponsoredLabels = document.querySelectorAll('.puis-sponsored-label-text');

    sponsoredLabels.forEach((label) => {
      const container = findSponsoredContainer(label);

      if (container) {
        container.remove();
        console.log('Removed sponsored listing.');
      } else {
        console.log('Sponsored label found, but no container identified.');
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
