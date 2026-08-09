[![CI](https://github.com/paulte/tampermonkey-amazonhidesponsoredlistings/actions/workflows/test.yml/badge.svg)](https://github.com/paulte/tampermonkey-amazonhidesponsoredlistings/actions/workflows/test.yml)
[![CodeQL](https://github.com/paulte/tampermonkey-amazonhidesponsoredlistings/actions/workflows/codeql.yml/badge.svg)](https://github.com/paulte/tampermonkey-amazonhidesponsoredlistings/actions/workflows/codeql.yml)
[![Dependabot](https://img.shields.io/badge/dependencies-Dependabot-025E8C?logo=dependabot)](https://github.com/paulte/tampermonkey-amazonhidesponsoredlistings/network/updates)

# Purpose

Tampermonkey script to remove sponsored listings from amazon searches

# Development and testing

Testing is present in a number of places

- pre-commit will check formatting, linting, and spelling before allowing a commit to be made
- CI will run the same precommit tests on any commit via github actions
- It is expected that a `npm run test` is run before any commit. This validates the userscript against a live amazon search page to ensure that the sponsored listings are still being removed. This test will fail if amazon changes their page structure and the userscript needs to be updated.
- Note, direct testing against amazon is not part of the CI test suite because it is not reliable. It appears that amazon has anti-automation measures that will block any tests triggered in github actions.

In the background, github actions will perform the following:

- codeql will perform automated security analysis of the javascript code
- dependabot will monitor project dependencies and github actions for available updates

# Release process

Run one of the following depending on whether you want to bump he major, minor or patch version

```bash
./create-release.sh  ( --major | --minor | --patch )
```

By default, `./create-release.sh --patch` should be used

This process will perform a few tasks:

- Validate local git is up-to-date, on main and clean
- Run `pre-commit` and `npm run test` to ensure that the code is in a good state
- Create a new git tag as specified by the user
- Push the tag to github

The act of pushing the tag will trigger a github action to create a new release. This action will validate the userscript metadata and create a new release in github with the userscript attached. A repo webhook will notify greasyfork.org to update the userscript there as well.
