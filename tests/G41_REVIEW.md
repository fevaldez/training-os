# G4.1 targeted N1/N2 remediation

Targeted continuation authorized by the owner on 2026-10-16. Previous HEAD: `c97255dc9ab83c7b241abf5a4e36e95fe09a4c5a`; expected main: `b82218dbc05662124821d1d6c27369ae717dd767`. Reuse existing branch and Draft PR #2. No Gate 0, G2, complete G4 review, release workflow change, framework or architecture redesign.

## N1 — retire stale RAM journals before any shared write

Previous production code recreated `fv4.recovery.backup.v1` from A's old `memoryJournal` before noticing that B had recovered and advanced active state. The targeted replay recorded one recovery write, B's 16-rep save refused, and a fresh third tab not ready.

The corrected `recover()` treats RAM-only journals as diagnostic/export data. If the shared journal and backup are absent, it does not resurrect either. A persisted journal lacking a backup still receives a verified backup, but only after checking all before/after conflicts under the existing Web Lock. No merge, stale write-token refresh, or silent replacement of divergent local state occurs.

Permanent core and real Chromium replay: A fails import, B restores and saves 15 reps, A retries, B saves 16 reps, and a third tab initializes normally at 16. A performs zero shared recovery writes, recovery artifacts stay absent, and its 9-rep local copy remains exportable alongside the 16-rep persistent copy. Additional tests verify zero writes on a conflicting persisted orphan journal and successful restoration of a legitimate legacy journal after freshness checks.

## N2 — accept RC4's actual historical RIR values

The helper executes actual source from `3edb8b9`: prior-set lookup, `makeSession`, `draftFor`, `completeSet`, and `finishSession`, with synthetic earlier input and only UI/storage dependencies stubbed. RC4 emits schema 4, release `4.0.0-rc4`, and preserves inherited RIR `"2"` or `""`. Both failed the previous validator; numeric 2 passed as a control.

The runtime change adds historical schema 4 to the existing bounded legacy-RIR predicate in `record()`. The numeric-string/blank grammar and finite/range checks are unchanged. `validActive()` still uses strict current log/draft validation. Values and unknown fields are never normalized. Tests accept `"2"`, `""`, and numeric 2, reject markup, malformed numeric strings, nonfinite and out-of-range values with zero writes, and round-trip mixed history, active state, units and unknown fields into another disposable store. Actual Chromium initializes and imports/exports the mixed RC4 collection unchanged.

## Evidence and commands

All fixtures and browser profiles are synthetic/disposable; no owner storage/profile/cache was accessed. Existing framework, Web Lock, durability harness, historical-source extraction and browser runner are reused.

```sh
node tests/storage_g3.test.js --g41-reviewed
# Expected exit 1: 1/4 PASS. N1, RC4 string and blank fail; numeric control passes.
node tests/storage_durability.test.js
# Exit 0: 110 original + 73 G3 + 22 G4.1 checks.
python3 scripts/validate_release.py
node scripts/test_engine.js
node scripts/test_ui_static.js
python3 scripts/test_reliability_rc621.py
# With local Playwright/Chromium selected via existing environment options:
node tests/storage_g3_browser.test.js --g41-reviewed
# Expected exit 1: targeted N1/N2 RED 0/2.
node tests/storage_g3_browser.test.js --original-suite
# Exit 0: unchanged original 9/9.
node tests/storage_g3_browser.test.js
# Exit 0: existing G3 8 + targeted N1/N2 2 = 10/10.
```

Separate logs: [core RED](evidence/g41/core-red.txt), [browser RED](evidence/g41/browser-red.txt), [durability GREEN](evidence/g41/durability-green.txt), [original browser GREEN](evidence/g41/original-browser-green.txt), [G3 + targeted browser GREEN](evidence/g41/browser-green.txt), [release](evidence/g41/release-green.txt), [engine](evidence/g41/engine-green.txt), [UI](evidence/g41/ui-green.txt), [reliability](evidence/g41/reliability-green.txt). Browser: Chromium 145.0.7632.6, fresh same-origin contexts and real Web Locks. Browser runners close their temporary loopback servers and contexts.

Existing checks are preserved: 107 release + 57 engine + 23 UI + 12 reliability = 199; original durability 110; G3 core 73; original browser 9; G3 browser 8. New targeted coverage: 22 core + 2 browser. The approved PR-only CI workflow remains unchanged and runs the additive core tests through its existing durability entrypoint. The original 73 G3 checks and browser scenarios are not weakened.

## Preservation, limits and handoff

The production diff changes only the legacy-history predicate and recovery ordering. Preserved tests compare WORKOUTS/engine, set/skip flow and ticker functions against pinned main. No prescription, timer calculation, plan, unit, history entry, unknown field or active payload is rewritten by these fixes. Only `version.json.index_sha256` is refreshed; release, timestamp, manifest, workers and release workflow/tooling are unchanged.

No remaining N1/N2 defect is proven by the targeted replays after correction. This is not a complete G4 review or independent acceptance. A retired transaction's RAM journal may remain exportable, but never authorizes shared mutation. Divergent RAM requires export and explicit adoption/reload; no silent merge is provided. LocalStorage/OS eviction, force-close of unsaved RAM, no-Web-Locks mutation refusal, old-client quiescence, physical Safari/iPhone/offline/quota/download/restore QA and production authorization remain outstanding limits/gates from G3.

Final targeted independent acceptance is PENDING on the new exact commit and CI result recorded in the final G4.1 checkpoint and Draft PR description. Recommendation may be **GO for final targeted independent acceptance** after those gates succeed. **Production remains NO-GO.** Keep PR #2 Draft. No Ready, merge, deployment, release, main change or PR-A work.
