# Training OS 4.0.0-rc4 — bootstrap to one-click releases

## What this release changes
- Publishes the selected **Continuous Loop** icon.
- Home Screen branding becomes **Training OS / T·OS**.
- Keeps the RC3 workout logic; this release does not alter routine programming.
- Adds automated release validation.
- Adds official GitHub Pages deployment through GitHub Actions.

## ONE-TIME BOOTSTRAP
1. Upload this package to the repository root, preserving:
   `.github/workflows/release-pages.yml`
   and `scripts/`.
2. GitHub → Settings → Pages.
3. Build and deployment → Source → **GitHub Actions**.
4. Commit to `main`.

That commit will automatically run `Release Training OS`.

## After bootstrap: one-click release
GitHub → Actions → **Release Training OS** → Run workflow → Run workflow.

GitHub supports manual workflow runs when `workflow_dispatch` is configured.

## After bootstrap: one-command release
From a cloned repo with GitHub CLI/git authentication:

`./scripts/release.sh <version>`

This command now **bumps the version in `index.html` + `version.json`, recomputes the SHA, validates, commits, tags, and pushes**.

Example:
`./scripts/release.sh 4.0.0-rc5`

The push triggers validation + Pages deploy automatically.

## Home Screen icon refresh
Once 4.0.0-rc4 is live:
1. Open the live Training OS URL in Safari.
2. Remove ONLY the old Training OS Home Screen icon.
3. Safari Share → Add to Home Screen.
4. Add it again. Your site/localStorage data is not deleted by removing the shortcut.

## Release gate
GitHub will refuse the deployment if:
- release marker is inconsistent,
- required workout-flow markers disappear,
- an icon is missing or wrong-sized,
- the index checksum does not match `version.json`.

## Reliability hardening added
- CI validation has **zero PyPI/runtime package dependencies**.
- `release.sh` refuses to release from a non-main branch.
- It refuses duplicate tags.
- It aborts when local `main` is behind `origin/main`.
- After push it verifies both remote `main` and the release tag.
