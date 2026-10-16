# PR-S1 release-readiness ledger

Evidence date: 2026-10-16 (America/Monterrey). M4 isolated QA deployment recorded; production remains NO-GO.

- **B / verified main:** `b82218dbc05662124821d1d6c27369ae717dd767`.
- **C / fixed PR-S1 candidate:** `54e25199e33b8cc725d86881b950bb68b4cf0cd4`.
- **Candidate build ID:** `pr-s1-54e25199e33b8cc725d86881b950bb68b4cf0cd4`.
- **Release label:** `4.0.0-rc6.2.1`; this label does not identify candidate bytes.
- **Governance branch:** `codex/tos-release-readiness`, based on B, independent of PR #2.

The owner authorized Track A and Draft PR #3, then explicitly authorized M4 in this same conversation: create `training-os-pr-s1-qa` and publish exactly one public, non-sensitive immutable candidate preview. That one deployment is complete. No further publication, repository settings, release-impact changes, Ready, merge, tags or PR-A are authorized. Track B acceptance remains pending. Gate 0, G2, G3 and preparation tests were not repeated for M4.

`DONE` means only the named milestone is evidenced; `BLOCKED` identifies a missing prerequisite/authorization; `UNKNOWN` identifies unperformed acceptance. None implies production approval.

## Milestones

| ID | Milestone / entry criterion | Status at preparation checkpoint | Source SHA | Exit evidence / command | Risk and exact next action | Owner |
|---|---|---|---|---|---|---|
| M0 | PR-00 baseline / approved baseline work | DONE | B | [PR #1 merged](https://github.com/fevaldez/training-os/pull/1); merge SHA B; `git ls-remote origin refs/heads/main` = B | Baseline validation is closed; do not repeat its audit | Completed baseline owner |
| M1 | PR-S1 implementation + bounded G4.1 repair / approved candidate branch | DONE — implemented, not released | C | [PR #2 OPEN/DRAFT](https://github.com/fevaldez/training-os/pull/2); [CI success at C](https://github.com/fevaldez/training-os/actions/runs/38922832795); [G4.1 implementation evidence](https://github.com/fevaldez/training-os/blob/54e25199e33b8cc725d86881b950bb68b4cf0cd4/tests/G41_REVIEW.md) | Author replays are not independent N1/N2 acceptance; keep #2 Draft | PR-S1 implementation owner |
| M2 | Independent N1/N2 final acceptance / exact C + disposable store | UNKNOWN — pending, no independent PASS | C | Required: [N1/N2 procedure and evidence contract](PR_S1_QA_MATRIX.md#focused-independent-code-acceptance); raw before/after, zero stale recovery writes, B 15→16, fresh third tab 16, exact RC4 value preservation/rejection | Assign independent QA to only N1/N2; stop on proven P0/P1 | Independent QA |
| M3 | Reproducible isolated preview preparation / safety boundary + SHA pin | DONE — existing package reused, Vercel configuration verified | C (content), B (governance base) | [Local preparation](PR_S1_STAGING_AND_CUTOVER.md#reproducible-local-package); [M4 configuration and receipt](PR_S1_M4_EVIDENCE.md) | Preserve the frozen eight-file bundle; any new deployment requires authorization | Release engineer |
| M4 | Preview deployment / M3 + explicit staging publication authorization | DONE — one isolated deployment READY | C | [Actual immutable HTTPS preview](https://training-os-pr-s1-nphf0td5s-valcan.vercel.app/training-os/); deployment `dpl_2HkzDYDSVFvmeoJq1upj7eB8NDU4`; [8/8 hash and 12/12 HTTP validation evidence](PR_S1_M4_EVIDENCE.md) | Vercel labeled this QA project's first deployment `production`; existing app production is unchanged. Use only immutable URL for M5 | Release engineer |
| M5 | Physical Safari/iPhone acceptance / M4 reachable + synthetic fixture | UNKNOWN — M4 available, physical results pending | C | Required: [device matrix](PR_S1_QA_MATRIX.md), exact device/iOS/Safari versions, screenshots, parsed download + disposable restore, raw comparisons | Open the immutable M4 URL on a physical iPhone and execute D01–D10 in Safari, then Home Screen; offline gate remains open | Device QA + owner |
| M6 | Release mechanism and cutover / M2 + M5 + backup + release authorization | BLOCKED — PRODUCTION NO-GO | B current production source; C unpromoted | Required: [cutover gates](PR_S1_STAGING_AND_CUTOVER.md#cutover-and-repository-governance), protection/trigger control, immutable-head CI, owner backup/restore, version/hash review and rollback evidence | `main` currently unprotected; approve/control deployment separately; no release action in this PR | Release engineer + owner |
| M7 | PR-A offline-first / separate scope authorization after PR-S1 decision | BLOCKED — NOT AUTHORIZED, unstarted | B specification; no PR-A implementation SHA | [Existing future acceptance specification](../PR_A_OFFLINE_ACCEPTANCE.md) | Offline cold-launch behavior is UNKNOWN/expected fail here; no worker/cache/runtime implementation | Separate future implementation owner |
| M8 | Functional backlog / reusable second user / P0 safety stable | BLOCKED — DEFERRED, no implementation authorization | B planning baseline; no feature SHA | No implementation or SaaS/private-access decision | Product owner scopes separate architecture only after release safety is stable | Product architecture owner |

## Risks and bounded corrective actions

Priorities below describe gate severity, not newly proven runtime defects. UNKNOWN remains an open gate, never a PASS.

| ID / priority | Verified evidence or limit | Bounded corrective action / acceptance | Owner |
|---|---|---|---|
| R1 / P0 release | [Pages workflow at B](https://github.com/fevaldez/training-os/blob/b82218dbc05662124821d1d6c27369ae717dd767/.github/workflows/release-pages.yml) publishes after matching main pushes and also permits manual dispatch; no explicit ref guard on dispatch | Do not merge #2 to test. Separate release-impact approval must establish gated promotion, dispatch/ref control and tested rollback | Release engineer |
| R2 / P0 release | Pages validation omits persistence suites; candidate PR validation includes them; current main's PR workflow has only four baseline suites | Preserve both workflows here. Require successful candidate durability CI mapped to C; any changed runtime head invalidates acceptance | Release engineer / reviewer |
| R3 / P0 privacy/data | Production URL is `https://fevaldez.github.io/training-os/`, origin `https://fevaldez.github.io`; localStorage is origin scoped, not path scoped | Reject all previews on that origin, including another repository/path. Verify actual final HTTPS scheme/host/port and redirects. Use a dedicated origin with no other applications or real history | Release engineer |
| R4 / P1 UNKNOWN | G4.1 N1/N2 evidence is author-produced; independent final acceptance is absent | Independently replay only N1/N2 at C, preserve raw traces and stop on one bounded P0/P1 defect | Independent QA |
| R5 / P0 UNKNOWN | No physical iPhone Safari/Home Screen force-close, quota, download retention or restore acceptance | Run synthetic matrix after M4; mark unavailable injection/device evidence UNKNOWN/BLOCKED; no simulated physical PASS | Device QA |
| R6 / P0 migration | Older tabs/PWA clients do not cooperate with new Web Locks | Before approved cutover, verify owner's real external backup and disposable restore privately, coordinate all old tabs/PWA closure; no silent migration/merge | Owner + release engineer |
| R7 / P1 identity | C changes candidate bytes but preserves `4.0.0-rc6.2.1`; candidate index SHA-256 is `cc3284cb5eaf41778e0f8fcda86352cf85ab1d41b816d57f7e9e0ad7efbad5b3` | Identify preview by full source/build ID + per-file hashes. Only a separate approved release change may bump version/hash/timestamp | Release engineer |
| R8 / P0 architecture | Browser/OS may later evict localStorage and recovery keys; failed writes can leave divergent RAM | Require verified external backups; export divergent RAM before closing/reloading; never promise absolute durability | QA + owner |
| R9 / P1 process | Prior validation already exists; more broad audits do not supply missing device evidence | No Gate 0/G2/G3 repeat. Limit new application acceptance to N1/N2 and physical matrix; preparation tests concern packaging only | Engineering lead |
| R10 / P1 integration | Current runtime lives in one shared `index.html` | Keep this governance branch on B; do not edit runtime/version/release files or #2; serialize future release edits | All contributors |
| R11 / P0 governance | Read-only `gh api repos/fevaldez/training-os/branches/main` returned `protected:false`, required checks off | Document proposed protection and approval controls; owner must separately authorize settings/release workflow changes before cutover | Repository owner |
| R12 / P0 exposure | Owner explicitly approved one public, non-sensitive C preview; Vercel Owner access and dedicated HTTPS origin verified for M4 | Exactly eight approved source/provenance files uploaded; no browser state, exports, profiles, secrets or private fixtures. Any changed content/exposure requires a new decision | Owner + release engineer |
| R13 / P0 offline UNKNOWN | Candidate retains cleanup behavior and no offline-first release is implemented; existing offline gate still applies | Report observed offline results honestly. No P0 GO while the offline gate is absent; PR-A needs separate authorization | Device QA + owner |

## Acceptance decisions

- **M4 checkpoint:** the owner's later one-publication authorization was exercised once; [deployment evidence](PR_S1_M4_EVIDENCE.md) is recorded in this same Draft PR. It grants no release or additional deployment authority.
- **CODE GO:** independent N1 **and** N2 PASS at exactly C, plus successful CI for the same immutable candidate. Author evidence or this governance PR's baseline CI cannot substitute.
- **PRODUCTION GO:** CODE GO plus verified isolated deployment, physical device acceptance (including the applicable offline gate), private owner backup/restore, old-client quiescence, controlled deployment triggers, approved version/hash change, tested rollback, and explicit owner release authorization. Currently **NO-GO**.
- **Isolated QA preview live:** **M4 DONE**, verified 2026-10-16 at [the immutable deployment URL](https://training-os-pr-s1-nphf0td5s-valcan.vercel.app/training-os/), distinct origin `https://training-os-pr-s1-nphf0td5s-valcan.vercel.app`, source C and deployment `dpl_2HkzDYDSVFvmeoJq1upj7eB8NDU4`. All eight file hashes match; [receipt](PR_S1_M4_EVIDENCE.md). Physical iPhone acceptance is still UNKNOWN.

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
