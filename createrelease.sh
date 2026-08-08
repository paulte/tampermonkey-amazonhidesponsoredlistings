#!/usr/bin/env bash
set -euo pipefail

if [[ "$(git branch --show-current)" != "main" ]]; then
	echo "ERROR: Not on main"
	exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
	echo "ERROR: Working tree is not clean"
	git status --short
	exit 1
fi

git pull --ff-only
git fetch --tags --prune

pre-commit run --all-files
npm test

if [[ -n "$(git status --porcelain)" ]]; then
	echo "ERROR: Working tree is not clean"
	git status --short
	exit 1
fi

echo
echo "Releasing $RELEASE from:"
git log -1 --oneline | cat
echo

echo "Recent releases:"
git tag --sort=-version:refname | head -10 | cat
echo

read -r -p "New Release version (e.g. v1.3.6): " RELEASE

if [[ ! "$RELEASE" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
	echo "ERROR: Version must be in the form v1.2.3"
	exit 1
fi

if git rev-parse "$RELEASE" >/dev/null 2>&1; then
	echo "ERROR: Tag already exists locally"
	exit 1
fi

if git ls-remote --exit-code --tags origin "refs/tags/$RELEASE" >/dev/null 2>&1; then
	echo "ERROR: Tag already exists remotely"
	exit 1
fi

echo
echo "Releasing $RELEASE from:"
git log -1 --oneline
echo

read -r -p "Create and push $RELEASE? [y/N] " CONFIRM

if [[ "$CONFIRM" != "y" ]]; then
	echo "Cancelled"
	exit 0
fi

git tag -a "$RELEASE" -m "Release $RELEASE"
git push origin "$RELEASE"

echo "Released $RELEASE"
