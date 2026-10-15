# PR-00 review record

Status: local uncommitted diff only. No push, GitHub PR, merge, tag, or deployment. PR-S1 and PR-A are specifications requiring separate approval.

Base/HEAD: `27abe8af3b50065fb2e76cc90f7b26ae2602fc42`.
Branch: `codex/pr00-validation`.

## Changed files

| Added file | Purpose |
|---|---|
| `.github/workflows/validate-pr.yml` | Standalone PR-only validation of four existing suites |
| `AGENTS.md` | Repository work, data, prescription, approval, and privacy rules |
| `docs/PR_S1_DATA_DURABILITY.md` | Separate data-durability specification; no implementation |
| `docs/PR_A_OFFLINE_ACCEPTANCE.md` | Separate offline/browser/iPhone/rollback checklist |
| `docs/PR00_REVIEW.md` | Test evidence, deployment boundary, and draft PR body |

All 27 baseline tracked files are byte-identical, including index.html, version.json, release-pages.yml, scripts/release.sh, worker, prescriptions, and existing tests. No package or lockfile is added.

## Workflow event / permissions matrix

| Event | New PR validation | Existing Pages workflow | Token / production implication |
|---|---|---|---|
| PR targeting main: opened, synchronize, reopened, ready_for_review | Four existing suites; no path filter | No pull_request trigger | New job: contents read; all unspecified permissions disabled; no secrets, environment, artifact upload, or deploy step |
| Push to codex/pr00-validation | No push trigger | Main branch filter excludes it | Neither workflow runs from this branch push |
| Push to main containing only these five added paths | No push trigger | No added path matches its push paths | No Pages run from this diff alone |
| Push to main changing an existing Pages-filtered path | No push trigger | Validation and Pages deployment can run | Existing contents read, pages write, id-token write; outside PR-00 |
| Manual release-pages workflow_dispatch | No workflow_dispatch trigger in new workflow | Still available independently; existing workflow has no explicit main-ref condition | Existing deployment authority remains; never dispatch as a PR check |

The new concurrency group is per PR and differs from `training-os-pages`, so it does not cancel production runs. Checkout uses persist-credentials false and defaults to the PR merge revision. No pull_request_target is used. Fork approval and repository Actions settings may affect scheduling; no remote run has occurred.

## Runtime and validation evidence

No dependencies were installed. Workflow action majors match the existing release workflow: actions/checkout@v6 and actions/setup-python@v6. Python remains 3.12. The existing release workflow has no setup-node pin, so this workflow also uses ubuntu-latest's supplied Node and logs both runtime versions. No new Node version is silently selected; deterministic Node pinning would be a separately reviewed parity change.

Actual local runtimes: Node v24.21.0; Python 3.9.6. Python 3.12 was not available at the checked conventional local paths; the CI configuration retains 3.12, but this local run is not a Python 3.12 run. The suites are dependency-free. No GitHub Actions execution, actionlint run, browser test, or physical iPhone QA is claimed.

Commands run from the isolated worktree, each exiting 0:

```sh
python3 -B scripts/validate_release.py        # 107/107 PASS
node scripts/test_engine.js                 # 57/57 PASS
node scripts/test_ui_static.js              # 23/23 PASS
python3 -B scripts/test_reliability_rc621.py  # 12/12 PASS
```

Additional local checks:

- Parsed both workflows with installed Ruby Psych; inspected event mappings, permissions, runner/actions, Python 3.12, unchanged runner-Node choice, exact suite commands, checkout credentials, concurrency, and absence of secrets/deploy jobs. Psych's YAML 1.1 `on` key coercion was normalized during inspection. This is a structural check, not a hosted Actions run.
- Compared all 27 tracked baseline files byte-for-byte using git show at the pinned SHA; HEAD remains that SHA.
- Compared every added path against all nine current Pages push patterns using their simple exact/wildcard forms: zero matches. Checked main-only push branches and absence of a PR trigger.
- Executed actual extracted store, history/active helpers, saveActive, and finishSession against a disposable in-memory localStorage. Injected setItem failure only for fv4.history, while allowing active removal. Confirmed history remains empty and active is removed. This reproduces the existing PR-S1 defect; PR-00 does not fix it.
- Checked added-file whitespace and patch applicability to the unchanged base checkout before delivery.

## No-production-deployment proof and limits

Current release push filters are index.html, version.json, manifest.webmanifest, training-os-loop-v1-*.png, scripts/validate_release.py, scripts/test_engine.js, scripts/test_ui_static.js, scripts/release.sh, and .github/workflows/release-pages.yml. None of the five additions matches. The release workflow's fixed seven-file Pages artifact also contains none of these additions.

The proof applies to this five-file diff under the inspected current triggers. A combined main push containing other filtered files, a later workflow change, or an independent manual dispatch can deploy. PR-00 neither changes repository protection/environment settings nor guarantees those controls exist. It does not authorize pushing or merging.

## Draft PR

Title: Add PR-only validation and document durability/offline gates

Training OS currently runs its four validation suites in the Pages release workflow, with no standalone pull-request gate. Add a main-targeted pull_request workflow using contents-read permissions, checkout without persisted credentials, the existing action majors/runtime choices, and no deployment steps or secrets. Add repository rules plus separate PR-S1 durability and PR-A offline acceptance specifications.

All 27 existing tracked files remain byte-identical. The five additions match none of the current Pages push path filters and are absent from its fixed artifact list. Existing manual release dispatch remains independently possible; this PR does not authorize it.

Validation: release/static 107/107, engine 57/57, UI-static 23/23, reliability 12/12; workflow structure and deployment-trigger scope checked locally; existing failed-history-save path reproduced using actual functions and disposable memory. Local Node was 24.21.0 and Python 3.9.6; workflow Python remains 3.12, and hosted PR validation has not run. No application, storage, prescription, worker, or release behavior is changed. Review and explicit approval are required before subsequent commit/push/merge or production action.
