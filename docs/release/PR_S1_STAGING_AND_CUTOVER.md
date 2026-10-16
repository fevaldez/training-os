# PR-S1 isolated preview and cutover preparation

Status: **M4 DONE — one owner-authorized isolated Vercel QA deployment is READY and verified.** [Immutable preview](https://training-os-pr-s1-nphf0td5s-valcan.vercel.app/training-os/); [deployment receipt and exact-hash results](PR_S1_M4_EVIDENCE.md). Physical iPhone and independent code acceptance remain pending; production is NO-GO.

Source is pinned to `54e25199e33b8cc725d86881b950bb68b4cf0cd4` (C), not main `b82218dbc05662124821d1d6c27369ae717dd767` (B). Keep [PR #2](https://github.com/fevaldez/training-os/pull/2) Draft. This branch changes only release documents and local preparation tools.

## Reproducible local package

Prerequisites: Git with `--path-format`/porcelain `-z` support, Python 3.9+, local objects for B and C. No dependency installation, provider CLI, token, network call, server or production profile is needed by the helper. Missing Git objects cause a hard failure; obtain exact objects using an authorized read before retrying, never substitute a moving branch.

From this governance worktree:

```sh
PREVIEW_PARENT="$(mktemp -d /private/tmp/tos-pr-s1-preview.XXXXXX)"
python3 -B scripts/prepare_pr_s1_preview.py --output "$PREVIEW_PARENT/site"
python3 -B scripts/prepare_pr_s1_preview.py --output "$PREVIEW_PARENT/site" --verify-only
python3 -B scripts/test_prepare_pr_s1_preview.py
```

Both successful helper invocations report `LOCAL_VERIFIED`, full source C, eight files and `deployed:false`. The first command requires a new output directory outside **all** Git checkouts/metadata; it refuses replacement. Verification rejects changed bytes, extra files, symlinks and unexpected directories. Output paths differ across builds; the eight relative paths and every file byte are deterministic. Preparation tests build twice, compare exact bytes despite a deliberately dirty local checkout, and exercise refusal of overwrite, checkout output, symlinks, tampering and extra/private files. These are packaging tests, not N1/N2 or device acceptance.

The helper reads only allowlisted committed Git blobs. It never reads browser storage, credentials, exported history or untracked files. It never invokes a release script, copies a working tree, modifies candidate files, serves HTTP, writes a Git ref or uploads anything.

| Local output | Exact source at C / purpose |
|---|---|
| `training-os/index.html` | Unmodified current inline application, prescriptions and durability implementation |
| `training-os/version.json` | Unmodified candidate metadata; `index_sha256` must match candidate HTML |
| `training-os/manifest.webmanifest` | Unmodified `id`, `start_url`, `scope`: `/training-os/` |
| `training-os/training-os-loop-v1-180.png` | Candidate touch icon |
| `training-os/training-os-loop-v1-192.png` | Candidate icon |
| `training-os/training-os-loop-v1-512.png` | Candidate icon |
| `training-os/training-os-loop-v1-1024.png` | Candidate icon |
| `preview-provenance.json` | Generated deterministic B/C/build ID/release label/entry path and SHA-256 of all seven assets |

This is the same seven-asset application allowlist as current Pages, nested under `/training-os/` to preserve manifest launch paths. The provenance file is additional preparation metadata. No `sw.js`, legacy modules/HTML, tests, private fixtures, exports, `.git`, docs, credentials or provider configuration enters the application bundle. Production's `_site` builder remains unchanged and would not publish these new repo files.

Build ID: `pr-s1-54e25199e33b8cc725d86881b950bb68b4cf0cd4`. Candidate HTML SHA-256: `cc3284cb5eaf41778e0f8fcda86352cf85ab1d41b816d57f7e9e0ad7efbad5b3`. Keep provenance beside the artifact; verify it against the pinned Git objects, not merely against its own claims. No version bump or staging banner is injected into candidate HTML.

## Preparation verification recorded on 2026-10-16

- `python3 -B scripts/test_prepare_pr_s1_preview.py`: **2/2 PASS**, including independent builds, dirty-source exclusion and the refusal cases described above.
- Build and `--verify-only` both exited 0 with `LOCAL_VERIFIED`, eight files, source C and `deployed:false`. Local artifact: `/private/tmp/training-os-pr-s1-preview-54e2519`; this machine-local directory is not a hosted URL or a committed GitHub artifact.
- Local runtime: Python 3.9.6 / Node v24.21.0. No browser, N1/N2 replay, physical-device trial, network server or publication was performed.
- Scope review: only the three `docs/release/` documents and two new preparation scripts; existing tracked files are unchanged from B. None matches the current Pages main-push filters. Gate 0/G2/G3 are not reopened; the Draft PR's normal four-suite read-only validation runs automatically on opening, using B's unchanged workflow.

## Host selection and safety contract

Production is `https://fevaldez.github.io/training-os/`, with origin **`https://fevaldez.github.io`**. A different `/preview/` or another repository path there fails isolation. A different host name can qualify only after its effective HTTPS origin and redirects are verified. Use a dedicated preview domain/project without unrelated applications, user profiles or shared production authentication/storage. Source cleanup code may affect matching workers/caches on its own origin, which makes a dedicated origin necessary.

Do not select a provider based on a hypothetical domain or presumed authentication. First obtain the owner's host/account/project, exposure choice and publication authorization. Then read the chosen provider's actual deployment mechanics and inspect existing authorization once. If unavailable, report BLOCKED with the required sign-in/project access action; do not retry logins. M4 has now verified Vercel authentication, Owner permission on the existing Valcan Pro team, static-upload mechanics and public access; see the receipt.

| Required hosting property | Configuration/verification required before publishing |
|---|---|
| HTTPS + origin isolation | Dedicated actual scheme/host/effective port; compare browser `location.origin` with production; reject any production-origin redirect, authentication return or canonical redirect |
| Exact candidate bytes | Static upload of this package only; no build transforms, HTML injection, minification, analytics or automatic source rebuilds |
| Stable route behavior | `/training-os/` serves the candidate index; the three manifest paths stay local; icons and JSON return correct MIME types; unknown asset paths return 404, never an HTML fallback |
| Immutable identity | Provider immutable deployment URL/ID pinned to this upload; freeze URL for QA; verify hosted bytes/hash for all seven assets and provenance |
| Fresh delivery | Avoid mutable aliases; disable stale document caching for QA (`Cache-Control: no-store` or provider equivalent on HTML/metadata); verify actual headers |
| Exposure | Owner explicitly approves public non-identifying static source or identifies approved private access. Source is already public but that alone is not publication approval. If candidate content conflicts with exposure policy, stop; no silent sanitization/runtime editing |
| Access on device | Physical iPhone can reach the URL; private access must preserve origin and Home Screen launch capability; credentials must not enter source or artifacts |
| Production separation | No binding to production Pages, production workflows, secrets, domain, storage, repository deployment credentials or main push/merge; no auto-publish integration |

The owner selected Vercel for M4. Project `training-os-pr-s1-qa` has no Git connection, environment variables, access protection or toolbar injection. It uses basic fixed build resources on the existing plan. The contract above was checked against the actual single deployment; new private-access architecture remains outside this task.

## M4 authorization and publication record

The owner subsequently explicitly authorized **one** public, non-sensitive publication of C on a new isolated Vercel project named `training-os-pr-s1-qa`. That authorization was exercised once, using the existing eight-file bundle. **Stop before any additional deployment or production action.** No workflow dispatch or Git publishing integration was used.

The M4 execution followed these boundaries (M5 device checks remain pending):

1. Re-read main/#2 refs and verify C is still the accepted candidate. If #2 changed, stop and obtain a new candidate pin; do not silently follow it.
2. Reuse the already verified local directory with owner-approved static content; compare its file set and hashes immediately before the upload. No rebuild, preparation-test rerun or audit replay is needed. Transfer synthetic device fixtures separately for M5.
3. Verify actual provider account permissions, immutable-upload mechanics, route mapping, MIME/cache headers and distinct-origin behavior. Fill the selected-provider record below before upload.
4. Publish only the verified directory through that approved isolated mechanism. Do not use the repository's Pages workflow or merge #2.
5. Fetch the final URL/redirect chain and every file. Reject HTML fallback, modified bytes, mixed origin or any mismatching hash; compare with the locally verified manifest and Git C. Verify `/training-os/`, manifest and icons in the target iPhone context too.
6. Attach a provider deployment receipt with deployment ID, account/project, UTC timestamp, source C/build ID, artifact hashes and immutable HTTPS URL. Confirm final browser `location.origin` differs from production. Report live only after these checks succeed.
7. Freeze that deployment and hand the evidence plus [QA checklist](PR_S1_QA_MATRIX.md) to the device/independent reviewer. Any content replacement invalidates the associated acceptance.

| Observed M4 deployment record | Value |
|---|---|
| Owner authorization + approved template/exposure | Explicit in this conversation: one public, non-sensitive immutable C preview |
| Provider/account/project + verified upload mechanism | Vercel / existing Valcan Pro team, Owner access / `training-os-pr-s1-qa` (`prj_M0HJcEQBmyGGbkzVBEeMdNhwQpjd`); one direct REST static file upload, no Git link |
| Actual immutable HTTPS URL + final origin + redirect chain | [https://training-os-pr-s1-nphf0td5s-valcan.vercel.app/training-os/](https://training-os-pr-s1-nphf0td5s-valcan.vercel.app/training-os/); final origin `https://training-os-pr-s1-nphf0td5s-valcan.vercel.app`; no redirects on the required route or eight files |
| Source commit / build ID | C / `pr-s1-54e25199e33b8cc725d86881b950bb68b4cf0cd4`, verified by metadata and exact served hashes |
| Hosted per-file hash comparison + MIME/cache/404 evidence | 8/8 SHA-256 and MIME PASS, required route 200, missing script/worker 404; `Cache-Control: public, max-age=0, must-revalidate`; unauthenticated/no-cookie reads; [raw results](evidence/m4/verification.json) |
| Deployment ID / receipt / timestamp / operator | `dpl_2HkzDYDSVFvmeoJq1upj7eB8NDU4` / [Vercel receipt](https://vercel.com/valcan/training-os-pr-s1-qa/2HkzDYDSVFvmeoJq1upj7eB8NDU4) / READY 2026-10-16 18:52:19.336 UTC / Codex under explicit owner authorization |
| iPhone access and Home Screen launch URL | UNKNOWN — physical M5 is next. Desktop in-app-browser launch succeeded with `data-boot=ok`; this is not device evidence |

Vercel returned `target: production` for this QA project's first deployment even though the request omitted `target`; default QA aliases were assigned. This is recorded explicitly, not reported as a production release of Training OS. No existing project, production Pages/domain/workflow or PR #2 changed, and no corrective second deployment was attempted. Use the unique deployment URL above, never a mutable project alias, for acceptance. See [M4 evidence](PR_S1_M4_EVIDENCE.md).

## Cutover and repository governance

Observed current configuration, not altered here:

- [Release Pages at B](https://github.com/fevaldez/training-os/blob/b82218dbc05662124821d1d6c27369ae717dd767/.github/workflows/release-pages.yml): main push paths are `index.html`, `version.json`, `manifest.webmanifest`, `training-os-loop-v1-*.png`, `scripts/validate_release.py`, `scripts/test_engine.js`, `scripts/test_ui_static.js`, `scripts/release.sh`, and `.github/workflows/release-pages.yml`. Manual `workflow_dispatch` is independently available, without an explicit ref guard. Token grants `contents:read`, `pages:write`, `id-token:write`; deployment environment is `github-pages`.
- Release validation runs release/static, engine, UI and reliability, then publishes a fixed seven-file `_site`. It does not run PR-S1 persistence tests. A docs-only merge would not itself match these push filters, but no merge is authorized.
- [PR workflow at B](https://github.com/fevaldez/training-os/blob/b82218dbc05662124821d1d6c27369ae717dd767/.github/workflows/validate-pr.yml) runs four baseline suites on `pull_request` to main, including Draft PR openings/updates, with only `contents:read` and no deployment. Candidate C additionally has its approved durability entrypoint. Checkout tests the PR merge revision; run metadata records candidate `headSha`. Governance PR CI on B cannot validate C's runtime.
- Read-only main branch API returned `protected:false`, required checks disabled. Existence/configuration of environment reviewers, allowed deployment branches and bypass permissions has not been verified. No GitHub settings were changed.

Before a separately authorized release, require a reviewable release-impact proposal and repository-owner approval covering all of the following:

- Protect main with reviewed PRs, required validation mapped to the immutable candidate, stale-approval dismissal and appropriate bypass restrictions; inspect actual environment reviewers/branch policies. Do not infer protection from a successful CI run.
- Define and test promotion controls for **both** matching pushes and dispatch, including allowed ref and environment approval. A dispatch must never publish arbitrary branch content accidentally.
- Require durability validation for the released candidate, retaining read-only `pull_request` checks with no deployment secrets/privileges or `pull_request_target`. Any production-workflow amendment needs explicit release-impact approval.
- Require independent N1/N2 PASS plus physical matrix evidence, applicable offline gate, and staging receipt from the same exact candidate. No P0 GO with UNKNOWN/FAIL offline acceptance; this task does not begin PR-A or waive its gate.
- Have the owner export real data and verify a restore in a private disposable context before promotion. Record only attestation/date/hash privately; never attach real history, diagnostic notes, backup files or device profiles to the public PR. Verify active logs/drafts, history IDs/values/types, unknown fields, units, plans and timers.
- Inventory and close/quiesce all old Safari tabs and installed PWA instances after backup verification, without clearing storage/caches or uninstalling the production app. Old uncooperative clients can still write; new Web Locks alone do not retire them.
- Prepare an approved release version/hash/timestamp update separately. If candidate bytes change, bind CI and acceptance to the new exact head before owner release authorization. Verify current artifact/manifest identity and preserve deployment provenance.
- Obtain explicit owner authorization for Ready/merge/promotion; none is implied by CODE GO, this checklist, this Draft PR or staging success.

## Rollback contract (unexecuted)

1. Before approval, preserve the last known production artifact, source/version, hashes, deployment receipt and the privately verified external backup. Prepare a rollback mechanism with the same deployment controls and a tested disposable restore procedure.
2. Freeze writes/old clients on a proven cutover failure and export any divergent RAM first; do not force refresh, erase keys, reverse migrations silently or import a raw recovery dump blindly. Distinguish normal backup from diagnostic recovery format.
3. Owner separately authorizes redeployment of the verified previous artifact or a corrective release. Rehearse on the isolated origin first, including read compatibility with candidate-written data. HTML rollback alone does not prove data/client rollback. PR #2 remains unmerged until the release boundary is approved.
4. Verify effective URL, delivered hashes, app identity, history/active state and installed-client behavior after rollback; retain both before/after synthetic evidence. RC6.2.1 cleanup makes blindly rolling back a future offline-worker release unsafe; that future mechanism belongs to separately approved PR-A work.

Exact next action: device QA opens [https://training-os-pr-s1-nphf0td5s-valcan.vercel.app/training-os/](https://training-os-pr-s1-nphf0td5s-valcan.vercel.app/training-os/) in physical iPhone Safari, records model, exact iOS/build and Safari version, confirms that dedicated origin, imports only the pinned synthetic fixture, and executes D01–D10 in [the existing checklist](PR_S1_QA_MATRIX.md), then repeats in Home Screen context. Physical results remain UNKNOWN until human evidence is supplied. No additional deployment or release is authorized.
