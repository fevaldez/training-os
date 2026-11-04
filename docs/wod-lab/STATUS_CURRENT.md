# WOD Lab V0.2 — STATUS_CURRENT

Updated: 2026-11-04 UTC. State: IMPLEMENTED, LOCAL CLOUD VERIFICATION PASS; REMOTE PUBLICATION BLOCKED. No V0.2 deployment, merge, tag or PR was created. Physical iPhone and deployed HTTPS acceptance remain UNKNOWN.

## Verified execution and source

- Managed environment reports `provider: cloud`, `observations_current: true`, connected/running. Work used the Cloud shell at `/workspace`; no desktop-control tooling was used. Desktop capability being available does not establish a separate model setting.
- Repository: `fevaldez/training-os`, correct fetch/push origin; GitHub reports `pull: true`, `push: true`. Initial shell fetch needed the supported network-enabled execution permission; it then succeeded.
- The runtime does not expose an actual model identifier or reasoning-effort configuration. Session instructions identify Codex based on GPT-6; the requested GPT-6 / High preferences cannot independently be confirmed as applied.
- Read `AGENTS.md` and the pilot's previous status. Fetched latest `codex/wod-lab-pilot-v011`: `95795f4056b12d944e0ea8433efed98670b0f0b8`.
- Isolated worktree: `/workspace/training-os-wod-v02`; isolated branch: `codex/wod-lab-v02-cloud`, based exactly on that pilot checkpoint. Main baseline remains `5b69389c5a8d0a1257a33c157b4da5488899080c` in the original checkout.
- No separate approved WOD Library specification was found in that baseline. Implementation follows the owner's explicit Cloud-task acceptance list. Three bounded, read-only internal reviews covered programming, data and UX/QA. Only the integrator changed files.

## Implemented scope

Entry point: `pilots/wod-lab-v02/index.html`, alongside `core.js`. The eight original WOD prescriptions and V0.1.1 pilot files remain unchanged. Seven safe bodyweight WODs support equipment-constrained rotation.

- Deterministic UTC weekly rotation: two strength, one AMRAP, one EMOM, optional recovery; alternating conditioning order. Published snapshots remain fixed after reload, equipment edits, library deletion and import. Future eligible selections change between weeks. All scheduled sessions total 45 minutes including warmup/cooldown.
- Reusable bilingual exercises and custom WOD snapshots; reviewed custom WODs join future eligible pools. Explicit equipment requirements and pull-up-to-dumbbell-row substitution; unavailable equipment blocks start. KB step-ups require a stable bench.
- Accurate weekly adherence credits unique complete matching plan slots. Optional, partial and legacy records are distinguished. Comparable endurance and measured strength results require matching prescription, variant and context. Context locks after measurement. New phase ledgers reconcile pause/final-segment time; historical ledgers are retained unchanged.
- Non-destructive V0.1.1 migration, exact raw pre-migration backup, primary/backup write readback, failed-write rollback, malformed-data write blocking, single V0.2 writer tab and stale-write protection. No storage/caches are cleared.
- Explicit export/import includes current sessions, locale, exercises, custom WODs, history and backup bytes. Imports merge without duplicates; conflicting IDs/active sessions reject safely. Competing plans are archived with full metadata; destination publications remain fixed. Unknown fields are preserved.
- ES/EN new flows, translated accessible navigation, keyboard-accessible import, 44px targets and short-screen CTA layout improvements. Priority Normal/High/Low is parked in `BACKLOG.md`, not implemented.

See `pilots/wod-lab-v02/README.md` for the accepted contract, storage/recovery procedure and reproducible commands.

## Verification evidence

Focused PASS, final source:

- `node pilots/wod-lab-v02/core.test.cjs`: **17/17** named tests. Evidence: `evidence-v02/core.txt`.
- Real headless Chromium **155.0.8059.79**, synthetic isolated storage, two independent loopback origins, controlled clock plus native browser UI/storage: **20/20** scenarios. Evidence: `evidence-v02/browser.txt`.
- Browser coverage includes full 45-minute AMRAP and strength sessions; EMOM interval counts; pause → next/skip/cool; phase-time reconciliation; one-save history; planned credit; custom exercises, explicit pull-up substitution and future custom snapshots surviving library deletion; paused V0.1.1 migration; active-session export/import/reimport; backup/quota failures; invalid/conflicting imports; read-only second tab; stale writes; unrelated FV storage; literal rendering of imported names/IDs; ES/EN and 390×844 / 320×420 layouts.

Unchanged repository regression suites PASS:

| Gate | Result |
| --- | --- |
| Release/static | 109/109 |
| Engine and superset skip | 57/57 + 48/48 |
| UI/static | 23/23 |
| Reliability | 12/12 |
| Durability, G3, G4.1 | 110/110 + 73/73 + 22/22 |
| M5 load core | 16/16 |
| Deterministic offline build | PASS, 7 pins |
| Offline contract | 22/22 |
| Release safety controls | 23/23 |
| Original storage browser | 9/9 |
| G3 browser | 10/10 |
| M5 load browser | 7/7 |
| M5 scroll browser | 9/9 |
| Superset skip browser | 22/22 |
| Production offline browser | 11/11 |

Initial child-process/loopback sandbox denials were resolved by using supported network-enabled execution; final suites passed. Review/tests caught and fixed weekly-start identity loss, imported wrong-prescription credit, missing KB platform requirement, mutable benchmark context, missing primary readback and imported plan metadata loss. A test startup race after adding the asynchronous writer lock was fixed by awaiting application readiness.

## Boundaries, remaining limits and confidence

- No known unresolved functional defect in the tested V0.2 scope. Physical iPhone Safari/Home Screen, true mobile background suspension and device closure storage remain unverified. Two local origins demonstrate migration isolation; no claim of testing a newly deployed HTTPS origin is made.
- V0.1.1 phase-ledger undercount remains in historical records; missing past time cannot be reconstructed. A legacy backup that already omitted its active session cannot recover that session. Export through V0.2 on the original origin first when an active V0.1.1 session must be migrated.
- V0.2 allows one writer tab per origin. Keep V0.1.1 closed while using it; the legacy app does not participate in the writer lock. Conflicting active/edited same-ID imports require preserving both exports and resolving the conflict before retrying.
- The WOD pilot has no offline-installation claim. Production offline regression results apply to unchanged FV source, not WOD caching.
- Only WOD pilot and WOD documentation paths changed. Main/FV/Home Gym PR #9 files, workflows, release tooling and settings were not changed. No paid resources, storage deletion or deployment actions were used. No draft PR was needed for verification.
- Confidence: HIGH in branch isolation, migration preservation and focused automated behavior; MODERATE in performance interpretation because exercise/load/scaling measurements are self-reported; physical iPhone/HTTPS delivery confidence remains UNVERIFIED.

## Checkpoint and exactly one next action

Remote publication is BLOCKED: shell Git push returned HTTP 403 (repository permission denied), and the GitHub Git Database API create-tree fallback returned HTTP 403, `Resource not accessible by integration`. No remote V0.2 commit/branch or PR was created, so committed remote readback cannot pass. GitHub metadata reports user-level push permission, but the actual configured credentials do not authorize these writes. The required configuration action is to enable repository Contents read/write for the GitHub integration and Cloud Git push credentials for `fevaldez/training-os`. A recoverable patch is saved at `/workspace/wod-v02-checkpoint.patch` against the exact verified pilot baseline; no attachments are required.

This file and the evidence are committed with the implementation on `codex/wod-lab-v02-cloud`; the final delivery message records the full local commit SHA and recovery patch; no pushed SHA or remote readback is claimed. The checkpoint does not authorize deployment.

Next owner action: Enable repository Contents read/write and Cloud Git push access for `fevaldez/training-os`.
