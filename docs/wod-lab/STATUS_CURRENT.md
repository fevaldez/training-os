# WOD Lab V0.1.1 — STATUS_CURRENT

Updated: 2026-10-28, America/Monterrey. Pilot: Thursday 2026-10-29.
State: READY FOR USER-2 IPHONE QA. Physical Safari/Home Screen acceptance remains UNKNOWN.

## Source and integrity

The newly attached resolved ZIP was extracted in an isolated temporary directory. All five entries in ASSET_MANIFEST.json matched both their byte counts and SHA-256 values. The packaged documents were read as source/context; current owner messages govern authorization.

- Source package SHA-256: `6883621d1d7c24256cc0467e8e1047b2384fbb1bafd2880c7589ccc3bfdf72aa`.
- Main HTML: 60,422 bytes; SHA-256 `e4f5b02ba11688f4953b8eb4cdca6af76a67776fbb4e158fdb077cebea298a54`.
- Feedback HTML: 7,907 bytes; SHA-256 `1a7b49be1ecdebc2283937b2e43cc7d1f88b35765e505332a64b3231344313e0`.
- Feedback dependency: OPTIONAL; recovered from ZIP and included, not DEFERRED.
- The application and feedback bytes were not edited. Approved goal/challenge-first UX, eight WODs and `training-os.wod-lab.v0` storage key are preserved.

## Branch and repository persistence

- Repository: `fevaldez/training-os`.
- Isolated worktree/branch: `codex/wod-lab-pilot-v011`.
- Verified main base: `5b69389c5a8d0a1257a33c157b4da5488899080c`.
- Exact deployed code commit: `f77a939b0c892ea3993ff2c21ece404e86e22f2b`; pushed successfully to the isolated branch.
- Approved sources: `pilots/wod-lab-v011/training_os_wod_lab_v011_pilot.html` and `pilots/wod-lab-v011/training_os_wod_feedback_v01.html`.
- This checkpoint is committed separately from the deployed code. Its Git commit is available in the isolated branch's file history; it does not change the deployed HTML.
- No main/FV/Home Gym files, workflows, settings, domains, aliases, billing, secrets or existing user storage were changed. No PR, merge, tag or production release was created.

## Safe delivery preflight and deployment

Preflight PASS via the existing cached official Vercel CLI/session: current Valcan OWNER permission; existing project `training-os-pr-s1-qa`, ID `prj_M0HJcEQBmyGGbkzVBEeMdNhwQpjd`. The initial browser-login/global-CLI obstacle was recovered using that existing authenticated CLI; no login or credential retrieval was needed.

Existing Valcan Pro usage credit was sufficient for this small static Preview (about $19.70 remaining at preflight). No new project, subscription, paid feature or billing change was made. Project protection fields were unset and anonymous access was verified. No Valcan project was linked to `fevaldez/training-os`; branch pushes did not trigger an extra Vercel deployment. Twelve existing deployments were checked, with no matching WOD artifact to reuse. No custom framework/build/install overrides were configured.

- Deployment creation requests: **1/1**, no retry. A process-level guard disabled POST retries and wrote a single-request ledger before the request.
- Deployment ID: `dpl_7iPcmuP3U7WKxwXbiPt94tUF7qC7`.
- State: **READY**. Target: Preview (`target: null` in Vercel API). Aliases: `[]`.
- Exact application URL: https://training-os-pr-s1-paz6da3vv-valcan.vercel.app/
- Exact feedback URL: https://training-os-pr-s1-paz6da3vv-valcan.vercel.app/training_os_wod_feedback_v01.html
- Both URLs returned anonymous HTTP 200 without redirect. The actual served HTML bytes matched the verified source SHA-256 for both files.
- Only `index.html` (the unchanged main HTML) and `training_os_wod_feedback_v01.html` were supplied in the deployment request. No Git checkout, environment values, private responses or user records were uploaded.
- The deployment-specific HTTPS origin is separate from FV and the prior Home Gym Preview. Continue testing on this exact origin to retain its local data.

## Focused QA

PASS — real headless Chromium 145.0.7632.6, fresh isolated browser context, native localStorage, real clock and visible UI clicks. The shipped test hook was used only to inspect state. HTTPS runtime: **22/22 checks PASS** on the actual URL above, including launch HTTP 200, served main SHA, AMRAP and EMOM execution, pause holding elapsed time, pause → next/skip/cool remaining paused, resume, finish/save, reload, two visible history rows, ES default, EN UI and EN retention after reload. No existing user storage was cleared or edited.

PASS — goal first, challenge first, eight built-in WODs, ES/EN home and active-session translation, player controls and no horizontal overflow at 390×844 and 320×420. Main bytes are the same as those inspected in the UX lane.

PASS — verified feedback file loads, switches ES/EN, accepts all four synthetic ratings and generates a complete visible summary. Both served feedback hash and anonymous HTTP 200 were separately checked. No feedback was sent externally.

PASS — repository-required baseline suites: release/static 109/109, engine 57/57 plus 48/48 skip regressions, UI/static 23/23, reliability 12/12. These cover the unchanged repository baseline and are separate from the WOD HTTPS checks.

UNKNOWN — physical iPhone Safari, Add to Home Screen, actual mobile background suspension and native storage after app/device closure. Browser evidence is not physical iPhone acceptance. No offline claim is made for this static pilot.

## Remaining defects and blockers

- Proven P0/P1 defects: **none** in the bounded checks. Delivery blockers: **none**.
- P2, deferred without code changes: phase-level exported `records[].elapsedMs` undercounts activity accrued before pauses and the final unfinished segment. One observed run had guidedMs=2,120 ms but record elapsed sum=850 ms; saved guidedSeconds=2 and native storage were correct. The visible/saved guided total is reliable in that test; per-phase analytics are not a complete time ledger.
- P2, deferred without redesign: at 320×420 the fixed bottom navigation initially covers the home CTA; scrolling reveals it, and Explore provides an alternate route. At 390×844 it is visible.

## Fail-forward rules retained

The main application is critical; feedback remains optional and must never block an otherwise safe app Preview. Resolve sources from the immutable bundle and manifest before assuming local paths. Continue independent safe tasks after recoverable failures. If repository writes fail, preserve this checkpoint as a downloadable artifact and explicitly avoid claiming remote persistence. The single deployment allowance is now consumed: no redeploy, retry, production promotion, aliases/domains change, storage reset, main/Home Gym change or scope expansion under this authorization.

## Confidence and exactly one next owner action

Confidence: HIGH in artifact integrity, isolated delivery and the focused Chromium results; physical iPhone behavior remains unverified.

Next owner action: Run one user-2 iPhone Safari validation on the exact application URL: change ES/EN, open an AMRAP, pause → next → resume, skip, finish/save, reload and confirm the history entry, then complete the four-question feedback form.
