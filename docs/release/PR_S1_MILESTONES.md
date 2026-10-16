# PR-S1 release-readiness ledger

Evidence date: 2026-10-16 (America/Monterrey). M5-01 automated fix PASS in stacked Draft PR #4; physical verification pending. M5-02 UNKNOWN. M4 is unchanged; production remains NO-GO.

- **B / verified main:** `b82218dbc05662124821d1d6c27369ae717dd767`.
- **C / fixed PR-S1 candidate:** `54e25199e33b8cc725d86881b950bb68b4cf0cd4`.
- **Candidate build ID:** `pr-s1-54e25199e33b8cc725d86881b950bb68b4cf0cd4`.
- **Release label:** `4.0.0-rc6.2.1`; this label does not identify candidate bytes.
- **F / unpromoted bugfix HEAD:** `c23f7cdd21b895c0aed3a6da49ea02da27d25aad`, [stacked Draft PR #4](https://github.com/fevaldez/training-os/pull/4), parent C. F is not deployed.
- **Governance branch:** `codex/tos-release-readiness`, based on B, independent of PR #2.

The owner authorized Track A and Draft PR #3, then explicitly authorized M4 in this same conversation: create `training-os-pr-s1-qa` and publish exactly one public, non-sensitive immutable candidate preview. That one deployment is complete. No further publication, repository settings, release-impact changes, Ready, merge, tags or PR-A are authorized. The owner subsequently authorized M5 registration and then a four-gate fast track: minimal M5-01 implementation, bounded M5-02 investigation, mandatory final tests and one stacked Draft bugfix PR. That implementation lives only in PR #4 at F; PR #2 and this governance PR runtime are unchanged. No new publication is authorized. Physical acceptance remains partial. Prior audits were not reopened and no additional planning document or independent review cycle was created.

`DONE` means only the named milestone is evidenced; `BLOCKED` identifies a missing prerequisite/authorization; `UNKNOWN` identifies unperformed acceptance. None implies production approval.

## Milestones

| ID | Milestone / entry criterion | Current status | Source SHA | Exit evidence / command | Risk and exact next action | Owner |
|---|---|---|---|---|---|---|
| M0 | PR-00 baseline / approved baseline work | DONE | B | [PR #1 merged](https://github.com/fevaldez/training-os/pull/1); merge SHA B; `git ls-remote origin refs/heads/main` = B | Baseline validation is closed; do not repeat its audit | Completed baseline owner |
| M1 | PR-S1 implementation + bounded G4.1 repair / approved candidate branch | DONE — implemented, not released | C | [PR #2 OPEN/DRAFT](https://github.com/fevaldez/training-os/pull/2); [CI success at C](https://github.com/fevaldez/training-os/actions/runs/38922832795); [G4.1 implementation evidence](https://github.com/fevaldez/training-os/blob/54e25199e33b8cc725d86881b950bb68b4cf0cd4/tests/G41_REVIEW.md) | Author replays are not independent N1/N2 acceptance; keep #2 Draft | PR-S1 implementation owner |
| M2 | Independent N1/N2 final acceptance / exact C + disposable store | UNKNOWN — pending, no independent PASS | C | Required: [N1/N2 procedure and evidence contract](PR_S1_QA_MATRIX.md#focused-independent-code-acceptance); raw before/after, zero stale recovery writes, B 15→16, fresh third tab 16, exact RC4 value preservation/rejection | Assign independent QA to only N1/N2; stop on proven P0/P1 | Independent QA |
| M3 | Reproducible isolated preview preparation / safety boundary + SHA pin | DONE — existing package reused, Vercel configuration verified | C (content), B (governance base) | [Local preparation](PR_S1_STAGING_AND_CUTOVER.md#reproducible-local-package); [M4 configuration and receipt](PR_S1_M4_EVIDENCE.md) | Preserve the frozen eight-file bundle; any new deployment requires authorization | Release engineer |
| M4 | Preview deployment / M3 + explicit staging publication authorization | DONE — one isolated deployment READY | C | [Actual immutable HTTPS preview](https://training-os-pr-s1-nphf0td5s-valcan.vercel.app/training-os/); deployment `dpl_2HkzDYDSVFvmeoJq1upj7eB8NDU4`; [8/8 hash and 12/12 HTTP validation evidence](PR_S1_M4_EVIDENCE.md) | Vercel labeled this QA project's first deployment `production`; existing app production is unchanged. Use only immutable URL for M5 | Release engineer |
| M5 | Physical Safari/iPhone acceptance / M4 reachable + synthetic fixture | PARTIAL — M5-01 automated PASS at F; physical results pending; M5-02 UNKNOWN | C live; F unpromoted fix | [Draft PR #4](https://github.com/fevaldez/training-os/pull/4); [exact-head CI SUCCESS](https://github.com/fevaldez/training-os/actions/runs/38961446777); 16 focused core + 7 M5 browser cases PASS. Original iPhone render/load is limited self-report | Deliver proven M5-01 fix without waiting for M5-02 diagnosis; owner next authorizes one isolated F preview, then physical load/zero/reload checks and per-button flicker recording. Do not overwrite M4 | Device QA + owner |
| M6 | Release mechanism and cutover / M2 + M5 + backup + release authorization | BLOCKED — PRODUCTION NO-GO | B current production source; C unpromoted | Required: [cutover gates](PR_S1_STAGING_AND_CUTOVER.md#cutover-and-repository-governance), protection/trigger control, immutable-head CI, owner backup/restore, version/hash review and rollback evidence | `main` currently unprotected; approve/control deployment separately; no release action in this PR | Release engineer + owner |
| M7 | PR-A offline-first / separate scope authorization after PR-S1 decision | BLOCKED — NOT AUTHORIZED, unstarted | B specification; no PR-A implementation SHA | [Existing future acceptance specification](../PR_A_OFFLINE_ACCEPTANCE.md) | Offline cold-launch behavior is UNKNOWN/expected fail here; no worker/cache/runtime implementation | Separate future implementation owner |
| M8 | Functional backlog / reusable second user / P0 safety stable | BLOCKED — DEFERRED, no implementation authorization | B planning baseline; no feature SHA | No implementation or SaaS/private-access decision | Product owner scopes separate architecture only after release safety is stable | Product architecture owner |

## Open M5 findings (not remediated)

Source for both findings is C and the unchanged [immutable M4 preview](https://training-os-pr-s1-nphf0td5s-valcan.vercel.app/training-os/). Physical observations are the owner's self-report from `TRAINING_OS_M5_IPHONE_FEEDBACK_2026-10-16.md`; no exact device/iOS/browser context, recording or full D01–D10 results were supplied. The attachment is evidence, not authorization to implement its suggested fixes.

| ID / status / severity | Exact observed fact | Confirmed source mechanism versus hypothesis | Acceptance / owner / next action |
|---|---|---|---|
| M5-01 / P1 — automated fix PASS at F; physical acceptance OPEN | After entering repetitions without load, **Completar set** logs numeric `weightKg: 0` and moves to the next exercise/set | Confirmed at C: baseline prefill zero (1001–1003), zero displayed empty (1477), `renderSet()` input/sync (1765–1788, especially 1782), reps-only gate and zero-coercing log/index/timer transition (1824–1831). [Exact-source probe](evidence/m5/source-trace.json) reproduced durable zero plus index 0→1 in synthetic memory, not on a device | Missing/unconfirmed load must differ from deliberate zero external load; do not ban zero, normalize history, or change prescriptions. All detailed [acceptance criteria and minimal plan](PR_S1_M5_FINDINGS.md#m5-01--open-p1-data-quality--workout-tracking) remain required. Implemented at F in Draft PR #4; 16/16 core and 7/7 M5 browser PASS; physical verification still required. Owner + device QA |
| M5-02 / OPEN / P1 — UX; physical root cause UNKNOWN | Screen-wide or significant flicker on button presses, **reportedly any button**; no claim that every button has been independently reproduced | Confirmed source mechanisms: pending/error recovery panels appear/disappear around normal saves (1420–1450; DOM at 109/120), full Today/weekly DOM replacement (1591–1612), stage-renderer replacement (1739–1747, 1769, 1843), forced navigation scroll (1614–1619), blur layers (21/24/33). Source probe confirms DOM churn only; repaint, layout shift and WebKit compositing as causes remain hypotheses | Record exact iPhone/iOS, Safari vs Home Screen, buttons, idle/running context and video/paint trace; controlled one-variable isolation only after authorization. Require no flash/blank frame on repeat taps, stable focus/scroll, no lost taps/inputs/state. [Full acceptance and isolation plan](PR_S1_M5_FINDINGS.md#m5-02--open-p1-ux-physical-root-cause-unknown). Device QA + future bugfix owner |

## M5 fast-track execution checkpoint

- **Bugfix artifact:** [Draft PR #4](https://github.com/fevaldez/training-os/pull/4), HEAD F, stacked on unchanged PR #2/C. No merge, Ready, deployment or release. No new infrastructure or planning document.
- **M5-01:** minimal input/explicit-zero UI guard; transient intent is not serialized and reload requires reconfirmation. Empty/cleared/invalid/typed-zero completion cannot mutate active/log/index/rest/timer or save. Positive kg/lb and comma-decimal inputs, unknown fields, historical zeros and separate skip are preserved. Unit-only rerender does not round the stored load. Program, durability core and completion transition body are byte-identical to C; only the required HTML hash is updated in version metadata.
- **RED→GREEN:** old C 2/15 PASS (13 targeted failures), final F 16/16 PASS including one added precision control. [Committed evidence](https://github.com/fevaldez/training-os/tree/c23f7cdd21b895c0aed3a6da49ea02da27d25aad/tests/evidence/m5).
- **M5-02 UNKNOWN:** one bounded local Chromium rendering probe measured stage top 70→284 synchronously→70 by the next animation frame. No physical iPhone screen-wide flicker or causal paint match was established. No speculative blur/rendering/persistence fix; this does not hold up M5-01.
- **Final tests:** local mandatory baseline 199/199, original browser 9/9, G3/G4.1 browser 10/10 and M5 browser 7/7 PASS. Initial local durability passed 110 original + 72/73 G3 + 22 G4.1; only the old workflow pin failed after the authorized stack-target/additive-test change. The exact expectation was updated without relaxing production workflow preservation, and only that assertion was rechecked locally. Final exact-head CI passed **107 + 57 + 23 + 12 + 110 + 73 + 22 + 16** checks at F: [run 38961446777](https://github.com/fevaldez/training-os/actions/runs/38961446777). No unnecessary full local-suite repeat.
- **CI safety:** read-only `pull_request` workflow additionally targets `codex/pr-s1-data-durability` so the stacked PR runs CI, and adds the M5 core check. No secrets, deployment rights, release workflow change, publish/dispatch step or new dependency. The exact-workflow assertion permits only those additions and keeps release-pages byte-identical.
- **Remaining gate:** physical Safari/Home Screen load, explicit-zero, reload/export/restore verification at F after separate preview authorization; per-button flicker/device evidence; full release/backup/old-client/offline controls remain open. Existing M4 stays pinned to C.

## Risks and bounded corrective actions

Gate priorities below are distinct from the two OPEN/P1 findings above. UNKNOWN remains an open gate, never a PASS.

| ID / priority | Verified evidence or limit | Bounded corrective action / acceptance | Owner |
|---|---|---|---|
| R1 / P0 release | [Pages workflow at B](https://github.com/fevaldez/training-os/blob/b82218dbc05662124821d1d6c27369ae717dd767/.github/workflows/release-pages.yml) publishes after matching main pushes and also permits manual dispatch; no explicit ref guard on dispatch | Do not merge #2 to test. Separate release-impact approval must establish gated promotion, dispatch/ref control and tested rollback | Release engineer |
| R2 / P0 release | Pages validation omits persistence suites; candidate PR validation includes them; current main's PR workflow has only four baseline suites | Preserve both workflows here. Require successful candidate durability CI mapped to C; any changed runtime head invalidates acceptance | Release engineer / reviewer |
| R3 / P0 privacy/data | Production URL is `https://fevaldez.github.io/training-os/`, origin `https://fevaldez.github.io`; localStorage is origin scoped, not path scoped | Reject all previews on that origin, including another repository/path. Verify actual final HTTPS scheme/host/port and redirects. Use a dedicated origin with no other applications or real history | Release engineer |
| R4 / P1 UNKNOWN | G4.1 N1/N2 evidence is author-produced; independent final acceptance is absent | Independently replay only N1/N2 at C, preserve raw traces and stop on one bounded P0/P1 defect | Independent QA |
| R5 / P0 physical gate; P1 findings tracked | M5-01 now passes automated checks at F; immutable C preview still has the reported defect. M5-02 physical cause remains UNKNOWN; full device force-close/quota/download/restore acceptance absent | Do not block delivery of the proven load fix on physical flicker diagnosis. Preserve M4; separately authorize isolated F preview and device verification; retain UNKNOWN for unobserved cases | Device QA + owner |
| R6 / P0 migration | Older tabs/PWA clients do not cooperate with new Web Locks | Before approved cutover, verify owner's real external backup and disposable restore privately, coordinate all old tabs/PWA closure; no silent migration/merge | Owner + release engineer |
| R7 / P1 identity | C changes candidate bytes but preserves `4.0.0-rc6.2.1`; candidate index SHA-256 is `cc3284cb5eaf41778e0f8fcda86352cf85ab1d41b816d57f7e9e0ad7efbad5b3` | Identify preview by full source/build ID + per-file hashes. Only a separate approved release change may bump version/hash/timestamp | Release engineer |
| R8 / P0 architecture | Browser/OS may later evict localStorage and recovery keys; failed writes can leave divergent RAM | Require verified external backups; export divergent RAM before closing/reloading; never promise absolute durability | QA + owner |
| R9 / P1 process | Prior validation already exists; more broad audits do not supply missing device evidence | No Gate 0/G2/G3 repeat. Limit new application acceptance to N1/N2 and physical matrix; preparation tests concern packaging only | Engineering lead |
| R10 / P1 integration | Current runtime lives in one shared `index.html` | Keep this governance branch on B; do not edit runtime/version/release files or #2; serialize future release edits | All contributors |
| R11 / P0 governance | Read-only `gh api repos/fevaldez/training-os/branches/main` returned `protected:false`, required checks off | Document proposed protection and approval controls; owner must separately authorize settings/release workflow changes before cutover | Repository owner |
| R12 / P0 exposure | Owner explicitly approved one public, non-sensitive C preview; Vercel Owner access and dedicated HTTPS origin verified for M4 | Exactly eight approved source/provenance files uploaded; no browser state, exports, profiles, secrets or private fixtures. Any changed content/exposure requires a new decision | Owner + release engineer |
| R13 / P0 offline UNKNOWN | Candidate retains cleanup behavior and no offline-first release is implemented; existing offline gate still applies | Report observed offline results honestly. No P0 GO while the offline gate is absent; PR-A needs separate authorization | Device QA + owner |

## Acceptance decisions

- **Fast-track delivery:** GO for delivery of the proven M5-01 fix at F in the single stacked Draft PR. M5-02 UNKNOWN does not block that delivery. Full physical M5 acceptance and production remain unapproved. The next owner action is separate isolated-preview authorization for F, followed by physical load/explicit-zero/reload testing and a precise flicker recording; never treat the unchanged C preview as fixed. M2 independent durability CODE GO remains separate.

- **M4 checkpoint:** the owner's later one-publication authorization was exercised once; [deployment evidence](PR_S1_M4_EVIDENCE.md) is recorded in this same Draft PR. It grants no release or additional deployment authority.
- **CODE GO:** independent N1 **and** N2 PASS at exactly C, plus successful CI for the same immutable candidate. Author evidence or this governance PR's baseline CI cannot substitute.
- **PRODUCTION GO:** CODE GO plus verified isolated deployment, physical device acceptance (including the applicable offline gate), private owner backup/restore, old-client quiescence, controlled deployment triggers, approved version/hash change, tested rollback, and explicit owner release authorization. Currently **NO-GO**.
- **Isolated QA preview live:** **M4 DONE**, verified 2026-10-16 at [the immutable deployment URL](https://training-os-pr-s1-nphf0td5s-valcan.vercel.app/training-os/), distinct origin `https://training-os-pr-s1-nphf0td5s-valcan.vercel.app`, source C and deployment `dpl_2HkzDYDSVFvmeoJq1upj7eB8NDU4`. All eight file hashes match; [receipt](PR_S1_M4_EVIDENCE.md). Physical iPhone launch is self-reported only; the M5-01 automated fix at F is unpromoted, M5-02 stays UNKNOWN and remaining physical rows are not passed.

## Read-only evidence refresh

These reads do not run tests, dispatch workflows, change #2 or alter repository settings:

```sh
git ls-remote origin refs/heads/main refs/heads/codex/pr-s1-data-durability
gh pr view 2 --repo fevaldez/training-os --json url,isDraft,state,headRefOid,statusCheckRollup
gh run view 38922832795 --repo fevaldez/training-os --json url,headSha,event,status,conclusion
gh api repos/fevaldez/training-os --jq '{visibility,default_branch,has_pages}'
gh api repos/fevaldez/training-os/pages --jq '{html_url,build_type,https_enforced}'
gh api repos/fevaldez/training-os/branches/main --jq '{name,protected,protection}'
```

Observed: main B, candidate C, #2 OPEN/DRAFT, CI `pull_request` / completed / success; repository public, Pages workflow-managed with HTTPS enforced, main unprotected. These are dated observations and must be refreshed before a future release decision.
