# G3 PR-S1 remediation evidence

Owner authorization: `TRAINING_OS_G3_AUTHORIZED_EXECUTION_2026-10-15.md`, beginning authorization block, explicitly invoked in the implementation chat. F1–F6 remediation and retention of F7 are authorized. Embedded G2 approval-pending notices are historical evidence; no release boundary is superseded. No Gate 0 or independent G2 audit was repeated.

Reviewed before HEAD: `84d381915f601dd189dc6fb3f96117352eb8bef3`. Pinned main: `b82218dbc05662124821d1d6c27369ae717dd767`. Existing branch `codex/pr-s1-data-durability`; existing Draft PR [#2](https://github.com/fevaldez/training-os/pull/2). The final checkpoint and PR description bind the new exact HEAD and its CI run after commit. Independent re-review is PENDING. Production is NO-GO.

## RED → GREEN

All stores, history records, imports, and browser contexts are synthetic. No owner browser/profile, origin data, caches or Service Workers were read or cleared by test tools. The G2 scripts embedded in the authorized document were extracted to a temporary directory and executed on the reviewed HEAD before production edits. Their exit 0 means **EXPECTED BUG REPRODUCED**, never a safety PASS.

| Finding | Original reproduced failure | Remediation / permanent coverage |
| --- | --- | --- |
| F1 / P0 / B2 + R5 | Stale reps 9 overwrote tab B's verified 15 after recovery | Recovery and migration no longer refresh the active compare token. Boot/import bind a verified matching snapshot explicitly under the lock. Divergent local memory stays available for raw export and cannot save. Core token/recovery/migration tests and real two-tab B2/reload pass. |
| F2 / P0 / R1 | Journal removal landed; read-back/reinsertion failed; a new instance had no before-image | An independent verified durable backup precedes all destination mutation. Journal cleanup is followed by a durable commit outcome bound to the backup ID/digest. Uncommitted recovery restores original bytes; a committed outcome retains its before-image. Fresh-instance interruption and cleanup-fault tests plus actual reload pass. |
| F3 / P1 / B1 | kg/lb success erased an active autosave failure with 2 RAM logs versus 1 stored | Failures are tracked by key; active writes track snapshot and revision. Older callbacks and unrelated unit successes cannot clear the dirty active warning. Exact Retry verifies it. Warning explicitly says RAM changes cannot survive reload/close; beforeunload is advisory. B1, close/re-entry, Retry/reload, and acknowledged force-close limitation pass. Recovery controls moved above the stage so the fixed rest dock cannot cover Retry/Export. |
| F4 / P1 / R3 | Eight legitimate earlier recipe/set combinations rejected the collection | Historical record/plan bounds are separate from current active bounds and derive from pinned actual recipes. Eight cases, all exercise bounds in four historical recipes, mixed schemas and current invalid bounds pass. Unavailable history has explicit Progress/Today/Program messages rather than zero-history metrics. |
| F5 / P1 / R2 | Actual v3 blank and numeric-string RIR failed migration; numeric 2 control passed | Legacy RIR accepts bounded numeric strings or blank only in supported legacy records. Original values and unknown fields remain unchanged. Blank displays as missing; arbitrary markup/unsafe strings reject before writes. Actual historical constructor/completion, source preservation, idempotent migration and export/import round-trip pass. |
| F6 / P1 / R4 | Explicit active without an intent could collide with imported history | Explicit/kept active share the same pre-mutation ID, intent digest and payload checks. Null/clear deterministically remove active. All 16 identity combinations pass; incompatible choices have zero writes. Real UI rejects the original collision without replacement. |
| F7 / P2 / authorization | G2 required separate workflow approval | Explicitly approved by this owner request. The PR-only workflow is retained byte-for-byte at reviewed HEAD, including depth 0 and the durability gate. `pull_request`, read-only contents, disabled credentials and no deployment steps remain. Release workflow is unchanged. Additive G3 tests run through the existing durability entrypoint. |

Original bug outputs: [core](evidence/g3/original-core-bugs.txt), [B1/B2](evidence/g3/original-browser-bugs.txt). Safety assertions against the reviewed production functions: [core RED](evidence/g3/core-red.txt), [browser RED](evidence/g3/browser-red.txt). The core RED run is 1/15 PASS, exit 1 (numeric RIR control passes; 14 safety failures across F1–F6). Browser RED is 1/8 PASS, exit 1 (the no-lock control passes). These outputs establish failures, not acceptance.

## Reproduction and new results

Run from the repository root; historical Git objects are provided by the already-approved depth-0 PR checkout:

```sh
node tests/storage_g3.test.js --reviewed  # expected exit 1, 1/15 safety cases pass
node tests/storage_durability.test.js     # original 110 + additive G3 73, exit 0
python3 scripts/validate_release.py
node scripts/test_engine.js
node scripts/test_ui_static.js
python3 scripts/test_reliability_rc621.py
# With locally installed Playwright/Chromium:
node tests/storage_g3_browser.test.js --reviewed        # expected exit 1, RED 1/8
node tests/storage_g3_browser.test.js --original-suite  # unchanged original 9/9
node tests/storage_g3_browser.test.js                   # G3 8/8
```

Browser runner binds a temporary loopback port, serves the selected production HTML, launches new Chromium contexts, then closes browser/server. `PLAYWRIGHT_MODULE` and `BROWSER_EXECUTABLE` may select locally installed test dependencies. No owner profile or external origin is used. Chromium was 145.0.7632.6, 390×844 for the G3 scenarios. Browser tests remain local evidence, not hosted CI or Safari/iPhone evidence.

| Suite | Before evidence | After result / exit |
| --- | --- | --- |
| Existing release/static | G2 107/107, exit 0 | 107/107, exit 0 |
| Existing engine | G2 57/57, exit 0 | 57/57, exit 0 |
| Existing UI static | G2 23/23, exit 0 | 23/23, exit 0 |
| Existing reliability | G2 12/12, exit 0 | 12/12, exit 0 |
| Original durability assertions | G2 110/110, exit 0 | 110/110, unchanged assertions, exit 0 |
| Additive G3 core | 1/15 RED, exit 1 | 73/73, exit 0 |
| Original disposable browser | G2 9/9, exit 0 | 9/9, unchanged script, exit 0 |
| Additive G3 browser | 1/8 RED, exit 1 | 8/8, exit 0 |

The 199 existing regression checks and all 110 earlier durability assertions remain intact. The only edit to the original durability harness is invoking the new G3 suite after its original result. The original browser script and four existing regression scripts are unchanged. Logs under [evidence/g3](evidence/g3) preserve RED and final GREEN separately. Historical fixtures have source provenance; helpers also execute/read the pinned actual production sources.

## Durable replacement lifecycle and recovery

1. Validate the entire incoming operation and reviewed raw snapshots before mutation. Capture exact raw history, active, unit, migration-marker and backup-metadata values.
2. Write and read back `fv4.recovery.backup.v1`. It contains the entire journal, a random operation ID and SHA-256 journal digest. If an independent before-image cannot be written and verified, refuse **before any destination mutation**. A RAM copy is diagnostic only.
3. Verify `fv4.recovery.v1`, then write/read back each destination and recheck all destinations. Unknown fields and raw before-images remain intact.
4. Remove and verify the journal while the independent backup remains durable. On uncertain journal cleanup, return failure and retain recovery UI. Reinsertion is optional additional evidence; safety does not depend on it succeeding.
5. Write/read back `fv4.recovery.outcome.v1`, identifying the matching backup ID/digest as committed. Only then report import success. A failed outcome write leaves rollback possible. A committed outcome whose read-back failed may resolve after restart as explicitly committed, with the original before-image still durably exportable. Do not promise that every reported failure rolls back.
6. Keep the last committed backup/outcome until a later explicitly confirmed replacement safely installs its own before-image. Ordinary session writes may proceed after a verified committed outcome; startup must not roll them back to the old import snapshot.
7. At startup, pending backup/journal without a matching committed outcome restores exact original bytes before normal writes. An old schema-1 journal is supported and gains an independent backup before restoration. Conflicting bytes or mismatched backup digests stop recovery, preserving raw export. After rollback, cleanup may remove journal/backup/outcome because the complete verified original is already restored; cleanup faults cannot remove that original.

Raw export includes both durable recovery keys, journal, current/source values, read errors, diagnostic RAM journal and divergent local active copy. A raw file requires manual inspection/conversion and a disposable-store comparison before normal import. Do not clear data, delete recovery keys, remigrate existing history or silently replace malformed values with defaults. Normal exports list recovery/preference/diagnostic exclusions.

Precise limitation: if storage refuses independent backup writes, replacement is unavailable and destinations remain untouched. If all original/durable evidence is evicted or storage persistently lies/denies every read/write, no local protocol can guarantee recovery. There is no universal persistence or force-close guarantee. External verified backups remain required. The retained independent journal increases quota use; it does not add another release path.

## Critical self-review and preservation

Reviewed compare-token lifetime after recovery/migration/import; dirty revision races; double-tab interleavings; commit versus rollback outcomes; all destination/cleanup boundaries across fresh instances; actual historical schemas and unsafe numeric text; explicit/kept/null/clear identity relationships; error UI, missing locks and four-second lock timeout. Review found and fixed the covered recovery-control obstruction, migration token refresh and post-import binding paths in addition to the original findings.

Current tests find no unresolved F1–F6 P0/P1 defect within the stated failure model. This is a self-review claim for independent challenge, not independent acceptance. Exact program/engine segment and set completion/skip/ticker functions are compared to the pinned main by the preserved suite. Recipe order, sets/reps, load semantics, rest math, tempo, supersets, plans, warmup/cooldown, injury constraints and alternatives are unchanged. Compatibility additions change validation/display, never normalize stored legacy records. Existing/new round trips retain unknown fields, historical names/indices/RIR strings, active logs, drafts, timers, plans, units and legacy sources.

Remaining UNKNOWNs: target/minimum Safari behavior; physical iPhone Safari/Home Screen; background suspension/force-close at each boundary; real quota pressure and abort/timeout behavior; offline cold launch/relaunch; downloaded-file retention/restore on iPhone; old-client quiescence. Without Web Locks, normal mutation fails closed with raw export available. A stale or dirty tab must export its local/remote copies and reload to adopt remote state; no silent rebase is provided. beforeunload cannot guarantee interception of mobile force-close.

## Release and independent reviewer handoff

Only the index checksum changes in `version.json`; release, timestamp, manifest, workers, program/engine modules, deployment/release tooling and the Pages workflow are unchanged. Retained F7 remains PR-only and uses no deployment secrets/permissions. Main must stay at the pinned SHA. A future main push touching index/version would trigger Pages, so passing CI is not release authorization.

Next independent reviewer: examine the new exact HEAD and its CI result, challenge B1/B2, repeat fresh-instance R1 including uncertain outcome cases, inspect retained before-images and dirty-key UI, and verify compatibility/identity matrices. No independent review was run or claimed by this implementation phase. Keep PR #2 Draft.

Recommendation: **GO FOR INDEPENDENT RE-REVIEW** only after the new exact HEAD's CI succeeds. **Production: NO-GO.** No Ready transition, merge, tag, release, deployment, Pages dispatch, main modification or PR-A work is authorized.
