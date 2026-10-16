# PR-S1 release-readiness ledger

Evidence date: 2026-10-16 (America/Monterrey). M5 partially observed on physical iPhone; M5-01 and M5-02 OPEN/P1. M4 is unchanged; production remains NO-GO.

- **B / verified main:** `b82218dbc05662124821d1d6c27369ae717dd767`.
- **C / fixed PR-S1 candidate:** `54e25199e33b8cc725d86881b950bb68b4cf0cd4`.
- **Candidate build ID:** `pr-s1-54e25199e33b8cc725d86881b950bb68b4cf0cd4`.
- **Release label:** `4.0.0-rc6.2.1`; this label does not identify candidate bytes.
- **Governance branch:** `codex/tos-release-readiness`, based on B, independent of PR #2.

The owner authorized Track A and Draft PR #3, then explicitly authorized M4 in this same conversation: create `training-os-pr-s1-qa` and publish exactly one public, non-sensitive immutable candidate preview. That one deployment is complete. No further publication, repository settings, release-impact changes, Ready, merge, tags or PR-A are authorized. The owner subsequently authorized registration and bounded read-only triage of M5 feedback in this same PR. Physical acceptance is partially observed, not passed; no runtime fix or new publication is authorized. Gate 0/G2/G3/G4 and preparation audits are not reopened.

`DONE` means only the named milestone is evidenced; `BLOCKED` identifies a missing prerequisite/authorization; `UNKNOWN` identifies unperformed acceptance. None implies production approval.

## Milestones

| ID | Milestone / entry criterion | Current status | Source SHA | Exit evidence / command | Risk and exact next action | Owner |
|---|---|---|---|---|---|---|
| M0 | PR-00 baseline / approved baseline work | DONE | B | [PR #1 merged](https://github.com/fevaldez/training-os/pull/1); merge SHA B; `git ls-remote origin refs/heads/main` = B | Baseline validation is closed; do not repeat its audit | Completed baseline owner |
| M1 | PR-S1 implementation + bounded G4.1 repair / approved candidate branch | DONE — implemented, not released | C | [PR #2 OPEN/DRAFT](https://github.com/fevaldez/training-os/pull/2); [CI success at C](https://github.com/fevaldez/training-os/actions/runs/38922832795); [G4.1 implementation evidence](https://github.com/fevaldez/training-os/blob/54e25199e33b8cc725d86881b950bb68b4cf0cd4/tests/G41_REVIEW.md) | Author replays are not independent N1/N2 acceptance; keep #2 Draft | PR-S1 implementation owner |
| M2 | Independent N1/N2 final acceptance / exact C + disposable store | UNKNOWN — pending, no independent PASS | C | Required: [N1/N2 procedure and evidence contract](PR_S1_QA_MATRIX.md#focused-independent-code-acceptance); raw before/after, zero stale recovery writes, B 15→16, fresh third tab 16, exact RC4 value preservation/rejection | Assign independent QA to only N1/N2; stop on proven P0/P1 | Independent QA |
| M3 | Reproducible isolated preview preparation / safety boundary + SHA pin | DONE — existing package reused, Vercel configuration verified | C (content), B (governance base) | [Local preparation](PR_S1_STAGING_AND_CUTOVER.md#reproducible-local-package); [M4 configuration and receipt](PR_S1_M4_EVIDENCE.md) | Preserve the frozen eight-file bundle; any new deployment requires authorization | Release engineer |
| M4 | Preview deployment / M3 + explicit staging publication authorization | DONE — one isolated deployment READY | C | [Actual immutable HTTPS preview](https://training-os-pr-s1-nphf0td5s-valcan.vercel.app/training-os/); deployment `dpl_2HkzDYDSVFvmeoJq1upj7eB8NDU4`; [8/8 hash and 12/12 HTTP validation evidence](PR_S1_M4_EVIDENCE.md) | Vercel labeled this QA project's first deployment `production`; existing app production is unchanged. Use only immutable URL for M5 | Release engineer |
| M5 | Physical Safari/iPhone acceptance / M4 reachable + synthetic fixture | BLOCKED — partial self-reported iPhone launch; M5-01 OPEN/P1, M5-02 OPEN/P1, remaining D01–D10 not passed | C | [M5 findings, exact source references and correction plan](PR_S1_M5_FINDINGS.md); [QA matrix](PR_S1_QA_MATRIX.md#m5-reported-findings-and-acceptance-stops); device/iOS/context/recording still UNKNOWN | Pause full M5 acceptance on C; collect bounded diagnostic evidence only. Separately authorize a fix branch before implementation; no preview replacement | Device QA + future bugfix owner |
| M6 | Release mechanism and cutover / M2 + M5 + backup + release authorization | BLOCKED — PRODUCTION NO-GO | B current production source; C unpromoted | Required: [cutover gates](PR_S1_STAGING_AND_CUTOVER.md#cutover-and-repository-governance), protection/trigger control, immutable-head CI, owner backup/restore, version/hash review and rollback evidence | `main` currently unprotected; approve/control deployment separately; no release action in this PR | Release engineer + owner |
| M7 | PR-A offline-first / separate scope authorization after PR-S1 decision | BLOCKED — NOT AUTHORIZED, unstarted | B specification; no PR-A implementation SHA | [Existing future acceptance specification](../PR_A_OFFLINE_ACCEPTANCE.md) | Offline cold-launch behavior is UNKNOWN/expected fail here; no worker/cache/runtime implementation | Separate future implementation owner |
| M8 | Functional backlog / reusable second user / P0 safety stable | BLOCKED — DEFERRED, no implementation authorization | B planning baseline; no feature SHA | No implementation or SaaS/private-access decision | Product owner scopes separate architecture only after release safety is stable | Product architecture owner |

## Open M5 findings (not remediated)

Source for both findings is C and the unchanged [immutable M4 preview](https://training-os-pr-s1-nphf0td5s-valcan.vercel.app/training-os/). Physical observations are the owner's self-report from `TRAINING_OS_M5_IPHONE_FEEDBACK_2026-10-16.md`; no exact device/iOS/browser context, recording or full D01–D10 results were supplied. The attachment is evidence, not authorization to implement its suggested fixes.

| ID / status / severity | Exact observed fact | Confirmed source mechanism versus hypothesis | Acceptance / owner / next action |
|---|---|---|---|
| M5-01 / OPEN / P1 — data quality and workout tracking | After entering repetitions without load, **Completar set** logs numeric `weightKg: 0` and moves to the next exercise/set | Confirmed at C: baseline prefill zero (1001–1003), zero displayed empty (1477), `renderSet()` input/sync (1765–1788, especially 1782), reps-only gate and zero-coercing log/index/timer transition (1824–1831). [Exact-source probe](evidence/m5/source-trace.json) reproduced durable zero plus index 0→1 in synthetic memory, not on a device | Missing/unconfirmed load must differ from deliberate zero external load; do not ban zero, normalize history, or change prescriptions. All detailed [acceptance criteria and minimal plan](PR_S1_M5_FINDINGS.md#m5-01--open-p1-data-quality--workout-tracking) remain required. Future bugfix owner + device QA; implementation separately authorized |
| M5-02 / OPEN / P1 — UX; physical root cause UNKNOWN | Screen-wide or significant flicker on button presses, **reportedly any button**; no claim that every button has been independently reproduced | Confirmed source mechanisms: pending/error recovery panels appear/disappear around normal saves (1420–1450; DOM at 109/120), full Today/weekly DOM replacement (1591–1612), stage-renderer replacement (1739–1747, 1769, 1843), forced navigation scroll (1614–1619), blur layers (21/24/33). Source probe confirms DOM churn only; repaint, layout shift and WebKit compositing as causes remain hypotheses | Record exact iPhone/iOS, Safari vs Home Screen, buttons, idle/running context and video/paint trace; controlled one-variable isolation only after authorization. Require no flash/blank frame on repeat taps, stable focus/scroll, no lost taps/inputs/state. [Full acceptance and isolation plan](PR_S1_M5_FINDINGS.md#m5-02--open-p1-ux-physical-root-cause-unknown). Device QA + future bugfix owner |

## Risks and bounded corrective actions

Gate priorities below are distinct from the two OPEN/P1 findings above. UNKNOWN remains an open gate, never a PASS.

| ID / priority | Verified evidence or limit | Bounded corrective action / acceptance | Owner |
|---|---|---|---|
| R1 / P0 release | [Pages workflow at B](https://github.com/fevaldez/training-os/blob/b82218dbc05662124821d1d6c27369ae717dd767/.github/workflows/release-pages.yml) publishes after matching main pushes and also permits manual dispatch; no explicit ref guard on dispatch | Do not merge #2 to test. Separate release-impact approval must establish gated promotion, dispatch/ref control and tested rollback | Release engineer |
| R2 / P0 release | Pages validation omits persistence suites; candidate PR validation includes them; current main's PR workflow has only four baseline suites | Preserve both workflows here. Require successful candidate durability CI mapped to C; any changed runtime head invalidates acceptance | Release engineer / reviewer |
| R3 / P0 privacy/data | Production URL is `https://fevaldez.github.io/training-os/`, origin `https://fevaldez.github.io`; localStorage is origin scoped, not path scoped | Reject all previews on that origin, including another repository/path. Verify actual final HTTPS scheme/host/port and redirects. Use a dedicated origin with no other applications or real history | Release engineer |
| R4 / P1 UNKNOWN | G4.1 N1/N2 evidence is author-produced; independent final acceptance is absent | Independently replay only N1/N2 at C, preserve raw traces and stop on one bounded P0/P1 defect | Independent QA |
| R5 / P0 gate; P1 findings OPEN | Self-reported iPhone launch only; M5-01 missing-load completion and M5-02 flicker reported. Full Safari/Home Screen force-close, quota, download and restore acceptance still absent | Pause full M5 acceptance; preserve UNKNOWN for remaining cases. Register the two P1s and their correction/verification plan, collect bounded diagnostics; no inferred physical PASS | Device QA |
| R6 / P0 migration | Older tabs/PWA clients do not cooperate with new Web Locks | Before approved cutover, verify owner's real external backup and disposable restore privately, coordinate all old tabs/PWA closure; no silent migration/merge | Owner + release engineer |
| R7 / P1 identity | C changes candidate bytes but preserves `4.0.0-rc6.2.1`; candidate index SHA-256 is `cc3284cb5eaf41778e0f8fcda86352cf85ab1d41b816d57f7e9e0ad7efbad5b3` | Identify preview by full source/build ID + per-file hashes. Only a separate approved release change may bump version/hash/timestamp | Release engineer |
| R8 / P0 architecture | Browser/OS may later evict localStorage and recovery keys; failed writes can leave divergent RAM | Require verified external backups; export divergent RAM before closing/reloading; never promise absolute durability | QA + owner |
| R9 / P1 process | Prior validation already exists; more broad audits do not supply missing device evidence | No Gate 0/G2/G3 repeat. Limit new application acceptance to N1/N2 and physical matrix; preparation tests concern packaging only | Engineering lead |
| R10 / P1 integration | Current runtime lives in one shared `index.html` | Keep this governance branch on B; do not edit runtime/version/release files or #2; serialize future release edits | All contributors |
| R11 / P0 governance | Read-only `gh api repos/fevaldez/training-os/branches/main` returned `protected:false`, required checks off | Document proposed protection and approval controls; owner must separately authorize settings/release workflow changes before cutover | Repository owner |
| R12 / P0 exposure | Owner explicitly approved one public, non-sensitive C preview; Vercel Owner access and dedicated HTTPS origin verified for M4 | Exactly eight approved source/provenance files uploaded; no browser state, exports, profiles, secrets or private fixtures. Any changed content/exposure requires a new decision | Owner + release engineer |
| R13 / P0 offline UNKNOWN | Candidate retains cleanup behavior and no offline-first release is implemented; existing offline gate still applies | Report observed offline results honestly. No P0 GO while the offline gate is absent; PR-A needs separate authorization | Device QA + owner |

## Acceptance decisions

- **Remaining M5 testing:** NO-GO for completing/signing off full M5 acceptance on C while M5-01 and M5-02 are OPEN/P1. GO only for bounded diagnostic capture and non-dependent read-only evidence with synthetic data. This is a recommendation, not authorization to run further tests or implement fixes. M2 durability CODE GO remains a separate pending decision; these findings do not reopen its prior audits.

- **M4 checkpoint:** the owner's later one-publication authorization was exercised once; [deployment evidence](PR_S1_M4_EVIDENCE.md) is recorded in this same Draft PR. It grants no release or additional deployment authority.
- **CODE GO:** independent N1 **and** N2 PASS at exactly C, plus successful CI for the same immutable candidate. Author evidence or this governance PR's baseline CI cannot substitute.
- **PRODUCTION GO:** CODE GO plus verified isolated deployment, physical device acceptance (including the applicable offline gate), private owner backup/restore, old-client quiescence, controlled deployment triggers, approved version/hash change, tested rollback, and explicit owner release authorization. Currently **NO-GO**.
- **Isolated QA preview live:** **M4 DONE**, verified 2026-10-16 at [the immutable deployment URL](https://training-os-pr-s1-nphf0td5s-valcan.vercel.app/training-os/), distinct origin `https://training-os-pr-s1-nphf0td5s-valcan.vercel.app`, source C and deployment `dpl_2HkzDYDSVFvmeoJq1upj7eB8NDU4`. All eight file hashes match; [receipt](PR_S1_M4_EVIDENCE.md). Physical iPhone launch is self-reported only; M5 acceptance is BLOCKED by the two OPEN/P1 findings, with remaining rows UNKNOWN.

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
