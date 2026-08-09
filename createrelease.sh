#!/usr/bin/env bash
set -euo pipefail

show_help() {
	cat <<EOF
Usage:
  $0 [option]

Create and push a new release tag.

Options:
  --major     Increment major version (v1.2.3 -> v2.0.0)
  --minor     Increment minor version (v1.2.3 -> v1.3.0)
  --patch     Increment patch version (v1.2.3 -> v1.2.4)

Recommended:
  $0 --patch
EOF
}

if [[ $# -ne 1 ]]; then
	show_help
	exit 1
fi

case "$1" in
--major | --minor | --patch)
	BUMP="$1"
	;;
*)
	show_help
	exit 1
	;;
esac

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

LATEST=$(git tag --sort=-version:refname | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' | head -1)

if [[ ! "$LATEST" =~ ^v([0-9]+)\.([0-9]+)\.([0-9]+)$ ]]; then
	echo "No valid release tags found. Defaulting to v1.0.0"
	LATEST="v1.0.0"

	if [[ ! "$LATEST" =~ ^v([0-9]+)\.([0-9]+)\.([0-9]+)$ ]]; then
		echo "ERROR: Invalid latest release tag: $LATEST"
		exit 1
	fi
fi

MAJOR="${BASH_REMATCH[1]}"
MINOR="${BASH_REMATCH[2]}"
PATCH="${BASH_REMATCH[3]}"

case "$BUMP" in
--major)
	((MAJOR++))
	MINOR=0
	PATCH=0
	;;
--minor)
	((MINOR++))
	PATCH=0
	;;
--patch)
	((PATCH++))
	;;
esac

RELEASE="v${MAJOR}.${MINOR}.${PATCH}"

echo
echo "Latest release: $LATEST"
echo "New release:    $RELEASE"
echo

read -r -p "Create this release? [y/N] " CONFIRM

if [[ "$CONFIRM" != "y" ]]; then
	echo "Cancelled"
	exit 0
fi

if git rev-parse "$RELEASE" >/dev/null 2>&1; then
	echo "ERROR: Tag already exists locally"
	exit 1
fi

if git ls-remote --exit-code --tags origin "refs/tags/$RELEASE" >/dev/null 2>&1; then
	echo "ERROR: Tag already exists remotely"
	exit 1
fi

git tag -a "$RELEASE" -m "Release $RELEASE"
git push origin "$RELEASE"

echo "Released $RELEASE"
