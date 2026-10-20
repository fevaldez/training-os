# PR-A Offline-first implementation checkpoint

Baseline: `8dd621d05ef66baa9773518c4a45ac3bdd7ed5d1`. One branch: `codex/pr-a-offline-first`. Synthetic test data only. This is a Draft PR checkpoint, not release approval. The original CSE/runbook remains the scope reference.

## Runtime and storage contract

- `sw.js` is deterministically generated from `scripts/sw-runtime.js` and seven explicit public assets. The cache identity includes all asset sizes and SHA-256 values, release metadata and runtime digest. The worker itself is the eighth Pages artifact entry; it is fetched by the browser's worker update algorithm, avoiding a circular self-hash.
- Registration and worker scope are exactly `/training-os/`. Only `/training-os/`, `/training-os/index.html` navigations and exact allowlisted asset URLs (including their existing exact `?v=<release>` links) use the cache. Other routes, methods and origins remain network requests. Remote videos require internet.
- Install validates HTTP status, redirects, MIME, byte length, SHA-256 and Cache API readback before success. Partial candidates are discarded. Predecessor and unrelated caches are retained. Quota/eviction are explicit limitations; there is no claim of permanent browser storage.
- Cache-first serves one coherent pinned version even online. Failed updates retain the active version. No `skipWaiting`, `clients.claim`, reload or workout interrupt. A prepared update waits until all controlled tabs/windows close. Users save, close all clients and reopen; no new activation control bypasses the existing write protocol.
- Offline readiness is a worker response to a complete cache check plus current registration/controller identity. First installation does not claim an already open page. The UI asks the user to save, close and reopen. A successful download alone is not readiness.
- The two legacy cleanup blocks are removed. Registering the same worker URL updates the old registration without unregistering it. New cache names intentionally avoid the old HTML's `training-os` deletion expression. An old page can still unregister any worker at this scope; close old clients and re-open the current shell online. The new bootstrap can re-register and reuse verified bytes. Old code cannot be retroactively prevented from unregistering a worker or performing its own broad cache deletion.
- No workout schema change, storage migration or new personal-data cache. `index.html` from `const WORKOUTS =` to EOF is byte-identical to the approved baseline. `manifest.webmanifest` is byte-identical, including id/start_url/scope. Existing history/active/journals/locks/legacy/unknown fields and engine semantics are preserved.
- Validated old caches are retained deliberately; repeated releases may consume quota. A rejected future install keeps the current version. Future cache collection needs its own bounded compatibility decision; deleting origin data is not recovery.

## RED evidence and commands

`tests/evidence/pr-a/contract-red.txt`: real baseline bootstrap invokes unregister twice and cache deletion twice per matching cache; forced activation; seven-file artifact omits worker; no verified atomic install. Four contract failures.

`tests/evidence/pr-a/browser-red.txt`: actual baseline online visit, close tab, disable network and navigate again fails `ERR_INTERNET_DISCONNECTED`. One browser failure. No substitute HTML/model used for this reproduction.

Reproduce with `node tests/offline_contract.test.js --baseline` and `node tests/offline_browser.test.js --baseline` (browser tooling is the existing disposable Playwright setup). Expected RED exit is nonzero. GREEN uses the same commands without `--baseline`.

Focused current worker tests: **22/22 PASS**. They cover download failure, redirects, wrong HTTP status/type/size/digest, quota, Cache API open/readback failure, partial/corrupt/evicted cache, concurrent safe repair, exact-version asset links, allowlist/scope, no forced activation, old cleanup and legacy worker replacement. Browser tests use loopback HTTP with actual `Cache-Control: no-store`, explicit JavaScript MIME, fresh contexts and a disposable persistent profile. Focused Chromium scenarios: **11/11 PASS**, including ten cold-tab relaunches and one full browser-process restart. This is Chromium evidence, not Safari or physical iPhone evidence.

## Five-family acceptance and risk traceability

PASS below means automated candidate coverage. Physical/host-dependent requirements stay UNKNOWN. All 29 IDs are grouped here; they are not 29 independent audits.

| Family | CSE risks | Automated acceptance | Remaining acceptance |
|---|---|---|---|
| 1. Compatibility/install | A-01–A-07, A-21, A-28 | Bootstrap retention, actual old cleanup, same-origin old worker replacement, full precache/readback and atomic rejection, eight-entry source archive, deterministic metadata and baseline ancestry | Published preview/Pages HTTPS and actual worker MIME/headers UNKNOWN until separately authorized hosting verification |
| 2. Security/data | A-08–A-12, A-17–A-19, A-22 | Exact allowlist/scope, original storage/prescription bytes, existing PR-S1/G3/G4.1 regressions, synthetic offline set/export/restore, invalid import, quota/eviction fail closed | iPhone Safari/Home Screen partition/eviction and separate private backup workflows UNKNOWN; no sync claimed |
| 3. Lifecycle/versions | A-13–A-15, A-26 | Closed-tab and full-process offline restart, ten offline relaunches, multi-tab old/new workers, active writes and stale-write rejection, failed update retained, forward recovery with old source removed, measured readiness | Physical suspension/kill/relaunch and long-lived legacy clients UNKNOWN |
| 4. Release/QA | A-16, A-20, A-23–A-25, A-29 | Read-only exact-HEAD PR CI, all mandatory suites, source-bound eight-asset archive and one-byte mutation rejection, manual publish predicates unchanged | Independent delta acceptance, isolated hosted preview, Safari/Home Screen physical QA and postrelease smoke UNKNOWN; branch protection and old 19/20 scroll flake remain separate debt |
| 5. Operator 5G | A-27 | UNKNOWN; no simultaneous carrier failure captured; no attribution made | Optional separate RCA only during a reproduced failure; does not block warm-installed offline contract |

## Release-impact review

The artifact expands from seven to eight files: `index.html`, `version.json`, `manifest.webmanifest`, four `training-os-loop-v1-{180,192,512,1024}.png` icons and `sw.js`. No legacy modules, tests, private data, logs or backups enter `_site`.

`release-pages.yml` validates worker, runtime/build tooling and tests through push path filters; builds include `sw.js`; archive verification compares every exact byte with `git show $GITHUB_SHA:path` and rejects extras/alterations. PR validation checks out the candidate HEAD explicitly and runs browser regressions read-only. CI browser tooling reuses the existing pinned disposable Playwright dependency; the app has no added external dependencies.

Deploy eligibility and the protected `github-pages` environment are unchanged: main push only validates; only `workflow_dispatch`, `publish=true`, matching approved/main/source SHA, verified archive and owner environment approval can publish. No dispatch, release script, merge, tag or deploy is executed for this checkpoint. The release helper is updated only to regenerate/validate/stage the worker on a separately authorized future release; its manual-only message is corrected.

`version.json.index_sha256` is refreshed because HTML bytes change. The release number/date and PWA identity are not bumped by this implementation checkpoint. A future promotion must bind the selected release metadata and regenerated worker to its separately approved SHA.

## Non-destructive recovery / rollback

If install fails, remain online with current runtime; do not announce offline readiness until measured complete/control. If a cache is damaged/evicted, offline shell requests return an explicit 503 recovery message; reconnect and reopen to repair only the same verified pinned release. If pinned source bytes are no longer hosted, do not silently load mixed network HTML: obtain the forward update online. The recovery page explicitly checks for a complete worker update and reports when it is prepared; save other clients, close all controlled clients and wait for normal activation before reopening. Chromium verifies forward recovery when the old source is no longer hosted. Hosting verification must test this path before production.

Never revert HTML to RC6.2.1 or baseline cleanup while leaving new clients writing. Freeze writing clients, export synthetic/private states in their own contexts, preserve journals/locks and raw divergence, prefer a compatible forward fix, close old clients, validate every shell asset and repeat the device gate. A retained predecessor cache is evidence/recovery material, not permission for schema rollback. Do not use global cache/storage deletion, unregister production workers, reinstall production or restore real backups into QA.

## Exact remaining iPhone and hosted preview QA

Use the final candidate SHA on a separately authorized isolated HTTPS origin, under `/training-os/`. First verify all eight served hashes, worker JavaScript MIME, real cache/update headers, scope and no cross-path interception. Reproduce old worker/baseline HTML then upgrade on that same disposable origin. Do not test migration against production.

Run independently in full Safari and Home Screen (not an in-app webview), with synthetic data and independent export/restores:

1. Complete online installation over Wi-Fi, verify current control/full cache, save/close/reopen as instructed; record build and shell identity.
2. Turn on airplane mode; open both launch paths, then fully close/force-stop and relaunch ten consecutive times per context. Require zero failed launches.
3. Complete positive-weight and explicitly confirmed zero sets offline; relaunch and check exact active/history bytes and unknown fields. Omit the second exercise of a superset, reach cooldown and save with no malformed session, duplicates or timer/load/rest changes.
4. Export the synthetic backup offline and restore into a separate disposable context; compare history, plan, active draft, unit and unknown fields. Invalid import must make no writes. Safari and Home Screen require separate backups; there is no automatic storage transfer.
5. Interrupt/restart/update five times; require zero lost/duplicate records. Open multiple tabs/standalone clients, preserve active work and locks, introduce a complete update, verify no cutover while clients remain, then save/close all and reopen into the new pinned shell.
6. Introduce incomplete download/quota/corrupt cache and eviction in QA. Require no false-ready, no history deletion, previous-version survival for failed update, and successful online repair/forward-update path. Never clear real browser data.
7. Background/foreground and OS suspension/force-close; verify active state and timers. Try installed cellular/offline/WARP on and off. Any carrier RCA requires index/version observations in the same failure window; do not infer a cause from a successful request.
8. Check external video failure is informational and does not block local shell rendering. Reconnect and confirm update/readiness, storage integrity and backup again.

Physical Safari: UNKNOWN. Physical Home Screen: UNKNOWN. Production release: NO-GO until independent delta acceptance, exact-SHA hosted/device gates and separate owner merge/deploy authorization. An isolated preview is a separate authorization boundary.

## Regression counts before candidate commit

| Suite | Result |
|---|---|
| Release/static contract | 109/109 PASS |
| Engine | 57/57 PASS |
| UI static | 23/23 PASS |
| Reliability | 12/12 PASS |
| Durability + G3 + G4.1 | 110/110 + 73/73 + 22/22 PASS |
| M5 load | 16/16 PASS |
| Superset skip | 48/48 PASS |
| Release safety controls | 23/23 PASS in focused run; final CI repeats with committed eight-file source |
| Offline worker / focused Chromium | 22/22 + 11/11 PASS |

Full required CI runs once when the final candidate Draft PR is opened, checking out its exact HEAD. The PR check and run logs are the authoritative final-SHA record, including original/G3/G4.1/M5/scroll/superset browser results. No CI status is inferred from local tests. Existing identical suites invoked by other harnesses are not extra independent tests.

## Changed-file manifest

- `.github/workflows/release-pages.yml`
- `.github/workflows/validate-pr.yml`
- `docs/architecture/PR_A_IMPLEMENTATION_EVIDENCE.md`
- `index.html`
- `scripts/build_offline.py`
- `scripts/release.sh`
- `scripts/sw-runtime.js`
- `scripts/test_reliability_rc621.py`
- `scripts/validate_release.py`
- `sw.js`
- `tests/evidence/pr-a/browser-green.txt`
- `tests/evidence/pr-a/browser-red.txt`
- `tests/evidence/pr-a/contract-green.txt`
- `tests/evidence/pr-a/contract-red.txt`
- `tests/offline_browser.test.js`
- `tests/offline_contract.test.js`
- `tests/offline_scope.cjs`
- `tests/offline_support.cjs`
- `tests/release_controls.test.js`
- `tests/storage_g3.test.js`
- `tests/superset_skip_scope.cjs`
- `version.json`
