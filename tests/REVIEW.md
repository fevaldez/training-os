# PR-S1 data durability evidence and recovery review

**Current status:** G2 identified F1–F6 in the original implementation below. The authorized G3 remediation, corrected protocol, evidence, limitations and independent re-review handoff are documented in [G3_REVIEW.md](G3_REVIEW.md). Original logs and claims below describe reviewed HEAD `84d3819`; they are not current acceptance evidence. PR #2 remains Draft; production is NO-GO.

Base: `b82218dbc05662124821d1d6c27369ae717dd767` (merged PR-00). Scope: PR-S1 only. All storage/browser fixtures are synthetic. No owner browser profile, localStorage, cache, or personal training records were opened.

## Reproduction and gates

Run from the repository root:

```sh
node tests/storage_durability.test.js --baseline
# EXPECTED exit 1: original production finishSession deletes fv4.active after history setItem throws.
node tests/storage_durability.test.js
python3 scripts/validate_release.py
node scripts/test_engine.js
node scripts/test_ui_static.js
python3 scripts/test_reliability_rc621.py
```

The baseline mode extracts and executes the pinned original `store`, `saveActive`, and `finishSession`; it is not a rewritten model. The normal suite extracts the current inline production engine, durability factory, download helper, and completion-entry builder. Its first test verifies that baseline RED is the expected specific failure. PR CI fetches baseline history and runs this suite with the unchanged existing four gates.

| Gate | Result | Committed evidence |
| --- | --- | --- |
| Original history quota failure | RED, expected exit 1; history and active both absent | `evidence/baseline-red.txt` |
| Production durability failure injections | 110/110 PASS | `evidence/durability-green.txt` |
| Existing release/static | 107/107 PASS | `evidence/release-green.txt` |
| Existing engine | 57/57 PASS | `evidence/engine-green.txt` |
| Existing UI static | 23/23 PASS | `evidence/ui-green.txt` |
| Existing reliability | 12/12 PASS | `evidence/reliability-green.txt` |
| Disposable Chromium, 390×844 | 9/9 PASS | `evidence/browser-green.txt` |

The four existing suites total 199 checks. Browser checks are additional local evidence; PR CI has no browser installation dependency. Optional browser reproduction requires a locally available Playwright package/browser and an HTTP server bound to loopback:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
# In another shell, with Playwright installed:
node tests/storage_browser.test.js
```

`PLAYWRIGHT_MODULE`, `BROWSER_EXECUTABLE`, and `DURABILITY_URL` can select installed test dependencies and the loopback URL. The script launches a fresh, disposable context and seeds only synthetic fixtures. It tests a quota failure through the real UI, Retry, a parseable backup download, safe text rendering, interrupted import/raw-journal export/reload rollback, lossless import, and real same-origin Web Locks in two tabs. A download event and readable test file are Chromium evidence, not proof of a user's saved file or an iPhone download.

## Storage protocol and preservation

- `fv4.history` never uses a default-returning read to authorize a mutation. Reads distinguish absent, unreadable, malformed, and structurally verified data. Writes distinguish serialization, write, and fresh exact-byte read-back failures.
- Completion freezes ID, endedAt, the complete entry, and a canonical SHA-256 digest in `fv4.active`. Retrying does not rebuild the entry. History ID/payload conflicts stop; identical committed payloads reconcile without duplication. Cleanup starts only after the complete candidate history verifies. Failed removal retains the intent or its memory copy and reports that history is saved.
- New completed entries retain `sessionSnapshot`, including drafts, logs, timer state, unit fields if present, plans, skips, and unknown active fields. Existing record schemas 3/4/5 and schema-less legacy records retain their payloads. Supported active schemas are 4/5/6 and schema-less legacy states with the validated structure. Envelopes 4/5/6 are supported; new exports use envelope 6.
- Every data mutation uses the same Web Lock. A four-second acquisition timeout releases the button lock with a visible failure. Without Web Locks, data mutations fail closed; raw recovery export remains available. Active writes compare the previously observed raw snapshot inside the lock, and stale import confirmations are rejected.
- Imports validate all incoming data before writes, require an explicit replacement confirmation, and require an explicit keep/clear choice if an older envelope omits active. Explicit null clears active only after history verifies. Unsafe stored text is escaped at its rendering sinks.
- `fv4.backupExtras.v1` preserves unknown envelope fields through import/export. It is included with history, active, unit and the migration marker in the recovery journal. Import does not overwrite unrelated preference/diagnostic or legacy source keys.
- `fv4.recovery.v1` contains exact raw `before` and intended `after` values for history, active, unit, migration marker and backup metadata. No destination writes precede journal verification. If final journal removal cannot be read back, the journal is reinserted; an in-memory journal also remains exportable when reinsertion fails. All intended keys are verified again before journal removal and success.
- Startup resolves a retained journal BEFORE migration or normal writes: it rolls back the unacknowledged replacement to exact `before` bytes. This applies even if all destination writes landed before interruption. A rollback failure retains the journal and blocks ordinary data writes. Bytes changed by an uncooperating writer cause a recovery conflict and require manual review instead of overwriting them.
- Legacy v3 history/unit source keys remain untouched. Migration only fills absent destinations, copies unknown legacy fields, and marks completion after all destination writes verify. Interrupted migrations restore and retry idempotently. Existing history is never remapped.
- Normal exports contain history, active (including an unsaved in-memory copy), unit, and unknown imported metadata. They exclude migration bookkeeping, today presets/availability, diagnostics, v3 source keys, and the recovery journal; the file lists exclusions. Raw recovery exports include the journal/source bytes, unreadable-key errors, and the in-memory active copy. No export function writes storage. The UI says download initiated and asks the user to verify the file.

Preservation assertions compare the entire inline WORKOUTS/engine segment against the pinned baseline, plus unchanged set completion/skip/tick functions. Thus order, prescription, sets/reps, load semantics, rest, tempo, supersets, injury constraints, alternatives, warmup/cooldown and timer calculations are unchanged. Fixture assertions deep-compare prior records, unknown nested fields, active plans/drafts/logs/timers/skips, both units, and unknown envelope metadata across disposable-store round trips. Rollback tests compare exact pre-operation raw bytes, including absent values. No tests use production user data.

## Adversarial self-review

Reviewed partial writes, stale and throwing read-back, intent/quota failures, interruption after every journal stage, failed rollback/removal, ID/digest conflicts, repeated calls, cooperating/stale/unsupported writers, untrusted text, migration retry, export serialization/download failures and code preserved outside the allowed paths.

Defects found and resolved during this review:

1. A partial import needed Retry to enter journal recovery before attempting another write.
2. An autosave/unit write that landed but failed read-back needed an exact-snapshot idempotent retry.
3. Stored draft/last-exercise text needed escaping; malformed display-field types now reject before import writes.
4. A stale tab's export needed to refuse hiding a newer persisted active session; raw export preserves both copies.
5. Unknown envelope metadata needed durable round-trip preservation in the same journal.
6. An older envelope's keep-active choice needed to reject a conflicting imported history ID before mutation.
7. Final journal-removal read-back failure needed journal reinsertion plus an exportable in-memory snapshot if storage refuses reinsertion.
8. CI needed the pinned baseline commit available for actual RED reproduction and program-preservation comparison.

No unresolved P0 defect was found within the tested cooperating-writer protocol. This is a self-review, not the independent review or the offline physical-device gate. Do not interpret this as P0 production GO.

## Non-destructive recovery and rollout boundary

On a storage/recovery error, leave the session open. Retry completion or journal recovery; use Export to preserve raw snapshots and the in-memory session. Do not clear storage/caches, delete a journal, remove legacy source keys, or edit malformed history to an empty array.

A raw recovery file is deliberately rejected by the normal importer. If automatic recovery cannot complete, retain the original file and inspect `values['fv4.recovery.v1']`, its before/after raw snapshots, current values, and any memory copy. Reconstruct a supported envelope from a chosen valid snapshot in a disposable store, then compare every record/field and count. If bytes cannot be parsed, preserve them for manual repair; never replace them with defaults. Only a reviewed normal envelope should enter the explicit import confirmation. Recovery is not guaranteed if both original and journal data have been evicted or are unreadable.

Before any future rollout, preserve and verify an export plus active-session/raw recovery copies, then quiesce **all old Training OS tabs and installed instances sharing the origin**. Reopen only the independently reviewed revision, verify the new envelope-6 export and preservation counts, and exercise recovery before resuming writes. Old clients do not honor the lock; arbitrary concurrency with them is unsupported. No rollout or user-data migration was performed by this task.

Remaining gates: actual Safari/macOS and iPhone Safari/Home Screen behavior, offline/relaunch/device interruption, real quota pressure, file-download retention and restore, and old-client quiescence. localStorage read-back is evidence of the current value, not protection from later browser/OS eviction. Journals/intents/snapshots increase storage use; insufficient capacity fails closed and may need raw export/manual recovery.

## Release-impact review and decision

The production implementation stays inline in `index.html`, which is already in the fixed Pages artifact. Only `version.json.index_sha256` changes; release/version/timestamp, manifest, worker, deployment workflow, release tooling, program modules, and PR-A are unchanged. The PR-only validation workflow still uses `pull_request`, read-only contents permission, no persisted credentials or deployment secrets, and no publish/release step.

**Merging index/version changes into main would trigger the existing Pages workflow.** This task pushes only the authorized branch and opens one Draft PR. No main push, merge, ready transition, release script, manual workflow dispatch, tag, or deployment is authorized or performed. A future merge therefore requires an explicit release-impact decision in addition to independent review and device gates.

Decision: **GO for independent review of the Draft PR; NO-GO for merge/production promotion.** Final HEAD, Draft URL and actual CI results are recorded in the final PR-S1 REVIEW CHECKPOINT and Draft PR description after GitHub validation completes.
