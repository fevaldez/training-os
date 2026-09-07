#!/usr/bin/env bash
set -euo pipefail

VERSION="${1:-}"
MESSAGE="${2:-}"

if [[ -z "$VERSION" ]]; then
  echo "Usage: ./scripts/release.sh <version> [commit message]"
  echo "Example: ./scripts/release.sh 4.0.0-rc5"
  exit 1
fi

if [[ "$(git branch --show-current)" != "main" ]]; then
  echo "ERROR: releases must run from main"
  exit 1
fi

git remote get-url origin >/dev/null 2>&1 || {
  echo "ERROR: origin remote is not configured"
  exit 1
}

if git rev-parse "v$VERSION" >/dev/null 2>&1; then
  echo "ERROR: local tag v$VERSION already exists"
  exit 1
fi

git fetch origin main --tags

read -r BEHIND AHEAD < <(git rev-list --left-right --count origin/main...HEAD)
if [[ "$BEHIND" != "0" ]]; then
  echo "ERROR: local main is behind origin/main by $BEHIND commit(s). Pull/rebase first."
  exit 1
fi

python scripts/bump_version.py "$VERSION"
python scripts/validate_release.py
node scripts/test_engine.js
node scripts/test_ui_static.js

if [[ -z "$MESSAGE" ]]; then
  MESSAGE="release: Training OS $VERSION"
fi

git add index.html version.json manifest.webmanifest training-os-loop-v1-*.png \
  scripts/bump_version.py scripts/validate_release.py scripts/test_engine.js scripts/test_ui_static.js scripts/release.sh \
  .github/workflows/release-pages.yml

git commit -m "$MESSAGE"
git tag -a "v$VERSION" -m "Training OS $VERSION"
git push origin main --follow-tags

REMOTE_MAIN="$(git ls-remote origin refs/heads/main | awk '{print $1}')"
LOCAL_HEAD="$(git rev-parse HEAD)"
if [[ "$REMOTE_MAIN" != "$LOCAL_HEAD" ]]; then
  echo "ERROR: remote main verification failed"
  exit 1
fi

git ls-remote --exit-code --tags origin "refs/tags/v$VERSION" >/dev/null

echo "Release $VERSION verified on origin/main. GitHub Actions will validate and deploy automatically."
