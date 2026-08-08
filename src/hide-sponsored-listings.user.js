// ==UserScript==
// @name         Hide Sponsored Listings
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Remove sponsored listings with class 'puis-sponsored-label-text' from search results
// @author       You
// @match        https://www.amazon.co.uk/s*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    function removeSponsored() {
        const sponsoredLabels = document.querySelectorAll('.puis-sponsored-label-text');
        sponsoredLabels.forEach(label => {
            let item = label.closest('div[role="listitem"]');
            if (item) {
                item.remove();
                console.log('Removed sponsored listing.');
            }
        });
    }

    function debouncedRemoveSponsored() {
        clearTimeout(window._removeSponsoredTimeout);
        window._removeSponsoredTimeout = setTimeout(removeSponsored, 300);
    }

    // Run initially after DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', removeSponsored);
    } else {
        removeSponsored();
    }

    // Watch for dynamically added elements
    const observer = new MutationObserver(debouncedRemoveSponsored);

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();
