[![CI](https://github.com/paulte/tampermonkey-amazonhidesponsoredlistings/actions/workflows/test.yml/badge.svg)](https://github.com/paulte/tampermonkey-amazonhidesponsoredlistings/actions/workflows/test.yml)
[![CodeQL](https://github.com/paulte/tampermonkey-amazonhidesponsoredlistings/actions/workflows/codeql.yml/badge.svg)](https://github.com/paulte/tampermonkey-amazonhidesponsoredlistings/actions/workflows/codeql.yml)
[![Dependabot](https://img.shields.io/badge/dependencies-Dependabot-025E8C?logo=dependabot)](https://github.com/paulte/tampermonkey-amazonhidesponsoredlistings/network/updates)

Purpose

Tampermonkey script to remove sponsored listings from amazon searches

## Development and testing

This project uses automated testing and GitHub Actions to check both the userscript itself and the Amazon page structure it depends on.

- **CI** runs on pushes to `main` and pull requests. It checks formatting, JavaScript linting, Markdown formatting, spelling, and the local Playwright userscript tests. Note, this won't do live tests against amazon to
  ensure the search output still contains the same formateted sponsored listigns

- **Amazon Structure Check** runs separately because it accesses the live Amazon website. It checks that Amazon's current search-result HTML still exposes sponsored listings in a way that the userscript can identify. It
  runs weekly and can also be triggered manually.

  - **CodeQL** performs automated security analysis of the JavaScript code.
  - **Dependabot** monitors project dependencies and GitHub Actions for available updates.

  The Amazon Structure Check is intentionally not part of the normal CI test suite. Live website tests can be affected by changes in Amazon's content, availability, or anti-automation measures, so they are treated as an
  external compatibility check rather than a requirement for every code change.

  A failure of the Amazon Structure Check may indicate that Amazon has changed its search-result structure and that the userscript needs updating.
