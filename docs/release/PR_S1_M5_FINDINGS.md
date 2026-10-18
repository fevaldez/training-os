# M5-01 / M5-02 — bounded triage and correction plan

Status: **historical triage at C retained; M5-01 automated fix PASS at F, physical pending; M5-02 OPEN/P1, UNKNOWN.** F `c23f7cdd21b895c0aed3a6da49ea02da27d25aad` is now available only on the [M5.5 actual Preview](https://training-os-pr-s1-bvwfy5e7g-valcan.vercel.app/training-os/); [receipt](PR_S1_M55_EVIDENCE.md). The original source facts and acceptance criteria below remain preserved. Source C is `54e25199e33b8cc725d86881b950bb68b4cf0cd4`, HTML SHA-256 `cc3284cb5eaf41778e0f8fcda86352cf85ab1d41b816d57f7e9e0ad7efbad5b3`. Existing [M4 preview](https://training-os-pr-s1-nphf0td5s-valcan.vercel.app/training-os/) and its deployment remain unchanged. Findings update only Draft PR #3.

At the original investigation checkpoint, the owner supplied `TRAINING_OS_M5_IPHONE_FEEDBACK_2026-10-16.md` and authorized registration plus bounded read-only source investigation, not implementation of the document's suggested experiments. During that original investigation, no Gate 0/G2/G3/G4, broad audit, runtime edit, real workout history access, browser-storage/cache clearing, worker operation, new deployment or PR #2 edit occurred.

## M6 owner feedback update

Subsequent owner report (2026-10-16) on the latest existing M5.5/F Preview: **M5-01 brief physical OK reported; general flicker not observed; intermittent upward scroll OPEN across multiple scenarios; complete physical acceptance UNKNOWN.** This supplements, rather than rewrites, the original C observations below. No exact device/iOS, context, scenario trace or recording was supplied; do not claim the scroll cause or complete physical acceptance is confirmed.

Later Track A engineering HEAD `f54ae0d6d0a0c3e93dba93bcd9338f7d1d92f42b`, CI SUCCESS ( [run 38981666499](https://github.com/fevaldez/training-os/actions/runs/38981666499) ), is registered in the [M6 ledger](PR_S1_MILESTONES.md). Its targeted scroll suite improved 3/9→9/9 in Chromium; exact-head hosted baseline/durability/load checks passed. The documented inherited background-document anchoring movement during some transitions remains causally unlinked to the owner’s report. Keyboard/visual-viewport/momentum/Home Screen behavior is physically UNKNOWN. Its implementation/automated results do not resolve an unperformed physical check. M4/C and M5.5/F are immutable historical hosts and do not serve that later candidate. Final release source R remains UNASSIGNED; the [single M6 decision table](PR_S1_STAGING_AND_CUTOVER.md#m6-controlled-release-decision-table) preserves the unknown/blocked physical and release gates. No application diagnosis, audit or correction was performed by this documentation task.

## Observed facts and provenance

- Physical iPhone, **self-reported**: preview renders/loads. This is limited launch evidence, not full D01–D10 PASS.
- **M5-01:** after filling repetitions without entering load, the user can press **Completar set**; the completed set stores numeric `weightKg: 0` and moves to the next exercise/set.
- **M5-02:** significant/screen-wide flicker on button presses, **reportedly any button**. No per-button independent reproduction, exact device/iOS version, browser mode, recording or established physical root cause was supplied.
- Device, OS/build, Safari version, Safari versus Home Screen, idle/running timing, flash color versus position jump, synthetic fixture state and raw device logs remain UNKNOWN. Do not invent those details or mark other physical checks PASS/FAIL.

## M5-01 — OPEN P1 data quality / workout tracking

### Confirmed cause at exact C

| Source | Verified behavior |
|---|---|
| [prefillFromMemory, lines 1001–1003](https://github.com/fevaldez/training-os/blob/54e25199e33b8cc725d86881b950bb68b4cf0cd4/index.html#L1001), [draftFor/saveDraft, 1714–1721](https://github.com/fevaldez/training-os/blob/54e25199e33b8cc725d86881b950bb68b4cf0cd4/index.html#L1714) | A baseline draft has zero load without an intentional-zero signal; draft creation is saved |
| [fmtWeight, 1477](https://github.com/fevaldez/training-os/blob/54e25199e33b8cc725d86881b950bb68b4cf0cd4/index.html#L1477) | Zero displays as an empty string |
| [renderSet, 1765–1788; sync at 1782](https://github.com/fevaldez/training-os/blob/54e25199e33b8cc725d86881b950bb68b4cf0cd4/index.html#L1765) | `parseFloat(value)||0` collapses empty/invalid load to zero; changing reps also runs the same load sync |
| [completeSet, 1824–1831](https://github.com/fevaldez/training-os/blob/54e25199e33b8cc725d86881b950bb68b4cf0cd4/index.html#L1824) | Only reps gate completion; `weightKg:+d.weightKg||0` is logged, index increments, state/timer transition and save/render follow |
| [active/set numeric validation, 1187–1218](https://github.com/fevaldez/training-os/blob/54e25199e33b8cc725d86881b950bb68b4cf0cd4/index.html#L1187) | Numeric zero is a valid data value; the model cannot infer whether it was deliberately selected |

**Bounded reproduction performed:** real C engine, durability core, draft/input/completion and persistence functions in Node VM, synthetic in-memory storage/locks and instrumented DOM adapters. No browser or actual device was exercised. See [read-only probe](evidence/m5/bounded-source-probe.cjs) and [raw trace](evidence/m5/source-trace.json).

| Input with 8 reps | Save | Completed log | Index | Result |
|---|---|---|---|---|
| Empty weight | success | numeric `weightKg:0`, `done:true` | 0→1, state rest | Defect reproduced |
| Positive 20 entered, then cleared | success | numeric `weightKg:0`, `done:true` | 0→1, state rest | Defect reproduced |
| Explicit typed `0` (current-code control) | success | numeric `weightKg:0`, `done:true` | 0→1 | Currently indistinguishable from missing load; this control is not proof of a deliberate-zero UX |
| Positive `20` kg control | success | numeric `weightKg:20`, `done:true` | 0→1 | Control preserved |

The probe checks the actual serialized `fv4.active` in a disposable Map, not merely a copied formula. Stage rendering/scroll/ticker are stubbed; no physical transition, durable download or end-to-end history acceptance is inferred.

### Original minimal correction plan (implemented at F; physical verification pending)

1. Keep raw weight text and an explicit per-session/per-set no-external-load confirmation in additive UI state outside serialized active/history data. Add an explicit **Sin carga externa (0 kg)** choice. Do not infer confirmation from default/prefilled zero, empty input, prior history or an exercise name.
2. Parse the entire nonempty input strictly; require positive finite load after kg/lb conversion, or deliberate zero choice. Reject negative, malformed, partial, NaN/nonfinite and cleared input. Do not use a falsy-to-zero fallback to validate completion. Keep raw invalid text outside the persisted numeric draft and avoid replacing a prior valid numeric load with zero merely because another input changed.
3. Validate before mutating any completion state or calling save: on rejection, preserve active session, logs, index, last set, endsAt/rest and timer. Present a weight-local inline error with accessible association/announcement; preserve focus. Keep skip/omit independent.
4. Preserve prescriptions, reps/tempo/rest, units, history interpretation and every historical zero/unknown field. Positive prefill may retain current semantics only after valid numeric checks; an old zero never implies confirmation. An ephemeral zero choice expires on reload/set/session change, so a resumed zero draft requires explicit reconfirmation; already completed historical zeros stay unchanged. Prove this behavior in reload tests.
5. Prefer no schema/storage change. If an implementation cannot meet these invariants without one, stop and report migration/compatibility impact before proceeding.

Expected scope, not a patch estimate commitment: one isolated bugfix branch rooted at C, `index.html` input/confirmation/completion UI, focused tests and a separately approved `version.json.index_sha256` bookkeeping change if needed by the existing hash contract. Do not implement those edits on PR #3 or PR #2. No engine/prescription, recovery protocol, production workflow or PR-A change is planned.

### Required acceptance and regression

Test empty, cleared, prefilled old zero, typed zero without explicit choice, explicit no-external-load zero, positive kg/lb, negative, invalid text/partial parse, NaN/nonfinite and known bodyweight/no-added-load cases. On every invalid completion, compare the complete before/after active/log/index/last/timer/rest and save count: no change/write from the rejected completion; accessible inline error near weight. Verify separate skip behavior and superset/rest timing. Explicit zero must work and persist as numeric zero without normalizing history.

Verify confirmed session save, reload/resume (including zero reconfirmation), completed history, normal export/import and unknown-field preservation on synthetic data. Preserve the existing durability/failure/retry gates; no blanket `weightKg>0` validator at the storage/history layer.

## M5-02 — OPEN P1 UX, physical root cause UNKNOWN

### Confirmed source mechanisms versus hypotheses

| Confirmed source fact | Evidence and causal limit |
|---|---|
| Ordinary saves classify `pending` through the failure-message presenter, then clear it after matching success | [persistenceMessage/renderRecovery/saveActive, 1420–1450](https://github.com/fevaldez/training-os/blob/54e25199e33b8cc725d86881b950bb68b4cf0cd4/index.html#L1420). Probe: weight+, reps+, RIR each made both recovery panels visible with paragraph + Retry + Export (three children), then hidden/empty on success. This is a confirmed DOM/presentation path; whether an intermediate frame is painted on the reported iPhone is UNKNOWN |
| Recovery cards precede visible content | [DOM 109 and 120](https://github.com/fevaldez/training-os/blob/54e25199e33b8cc725d86881b950bb68b4cf0cd4/index.html#L109). `completionRecovery` precedes `sessionStage`. Possible layout movement when it appears is a hypothesis; no layout engine was measured |
| saveActive always calls renderHome, without an overlay visibility guard | [1442–1450](https://github.com/fevaldez/training-os/blob/54e25199e33b8cc725d86881b950bb68b4cf0cd4/index.html#L1442), [1591–1612](https://github.com/fevaldez/training-os/blob/54e25199e33b8cc725d86881b950bb68b4cf0cd4/index.html#L1591). Probe: each action replaced Today decision and weekly snapshot while overlay was modeled open. Full stage replacement was not invoked for those stepper/RIR saves |
| Transition dispatchers replace stage sections; Today preset selection replaces its section | [renderStage 1739–1747](https://github.com/fevaldez/training-os/blob/54e25199e33b8cc725d86881b950bb68b4cf0cd4/index.html#L1739), [renderSet 1769](https://github.com/fevaldez/training-os/blob/54e25199e33b8cc725d86881b950bb68b4cf0cd4/index.html#L1769), [renderRest 1843](https://github.com/fevaldez/training-os/blob/54e25199e33b8cc725d86881b950bb68b4cf0cd4/index.html#L1843), [Today handlers 1602–1604](https://github.com/fevaldez/training-os/blob/54e25199e33b8cc725d86881b950bb68b4cf0cd4/index.html#L1602). Intentional transitions do not by themselves prove an unintended flash |
| Fixed/sticky blur layers are present | [.bottom 21, .sessionbar 24, .picker 33](https://github.com/fevaldez/training-os/blob/54e25199e33b8cc725d86881b950bb68b4cf0cd4/index.html#L21). WebKit compositing/repaint contribution remains a hypothesis, not a diagnosis |
| Navigation forces top scroll even for the selected page | [showPage 1614–1619](https://github.com/fevaldez/training-os/blob/54e25199e33b8cc725d86881b950bb68b4cf0cd4/index.html#L1614); session transition scrolling is separately [1705](https://github.com/fevaldez/training-os/blob/54e25199e33b8cc725d86881b950bb68b4cf0cd4/index.html#L1705). Probe's same-page navigation invokes one top scroll without the pending-save banner path; scroll jump could be perceived as flicker but is not proven |

No universal button/flicker cause is confirmed. The source probe cannot measure WebKit painting, frame colors, visual layout shift, lost taps or physical focus. Fast pending→success DOM changes might occur within one painted frame. Do not claim that any one mechanism explains the physical report or that removing blur fixes it.

### Minimal root-cause and correction plan (unexecuted)

1. First obtain a short physical-iPhone screen recording or Inspector paint/repaint trace, exact model/iOS/build, Safari versus Home Screen, color scheme, flash color/blank versus position jump, network, exact button sequence, keyboard/focus and scroll position. Compare idle navigation (Today/Programa/Progreso including current-page tap) against running weight ±, reps ± and RIR. Use only preview synthetic data; no production profile access.
2. On separately authorized disposable local source contexts, instrument recovery panel visibility/child replacement, Today/weekly/stage DOM replacement counts, focus/selection/scroll, input and active-state snapshots, frame timing and paint/layout evidence where available. Reproduce the same action sequence before changing anything; compare a no-op tap control.
3. Isolate one variable at a time: (A) stable/non-resizing normal-save pending presentation versus transient recovery cards; (B) avoid identical/hidden Today DOM replacement, refreshing it on return; (C) update only changed nodes where a replacement is implicated; (D) disable blur separately on bottom, sticky session bar and picker layers; (E) remove only same-page/no-op forced scroll, preserving intentional transition navigation. Record baseline/intervention/revert on the same device/context, then repeat to establish cause and effect. None of these experiments was performed in this read-only task.
4. Select only the smallest intervention supported by the trace. Leading scoped candidate: separate pending **presentation** from actual error UI, reuse stable nodes, and avoid unnecessary hidden Today rebuilds if they contribute. Preserve pending/unsaved-memory guards, revision matching, unload protection, save ordering, genuine failure/dirty warnings and Retry/Export until verified success; never turn an unconfirmed save into a saved-state claim or hide a real failure. Do not rewrite the storage protocol, blindly remove iOS visuals, add blanket GPU hacks or change functional navigation.

Likely implementation surfaces are recovery-status presentation, renderHome/Today invalidation and the one implicated nav/style layer; actual diff depends on the physical trace. One bugfix PR may contain both findings only if owner authorizes that precise bounded scope. No flicker fix is declared selected or proven here.

### Required regression and physical verification

- For each affected action, verify no transient error panel for ordinary pending success, no unnecessary stage/input replacement, stable focus/selection/scroll, no lost taps or input/session state. Real failures must remain visible and retry/exportable; delayed/failed/overlapping saves must retain exact revision semantics and honest unsaved state.
- Cover current-page and cross-page navigation, Today preset/planner, overlay open/close, unit switching, repeated weight/reps/RIR actions, warmup/set/superset/rest/cooldown transitions, retries and completion. Preserve intentional scroll-to-top transitions and all training semantics.
- Physical acceptance: repeat the recorded tap sequence in both Safari and Home Screen, idle and running, with versioned recordings. Require **no visible flash/blank frame on repeated taps**, stable focus/scroll and zero lost taps, values or session state. DOM counters or desktop emulation cannot substitute for this evidence.

## M5.5 current execution status

The later four-gate implementation authorization produced [stacked Draft PR #4](https://github.com/fevaldez/training-os/pull/4) at F: M5-01 strict input validation, transient explicit-zero intent and accessible rejection, with no history/schema/prescription change. RED→GREEN and mandatory regression/durability/browser evidence are recorded in the [milestone ledger](PR_S1_MILESTONES.md#m5-fast-track-execution-checkpoint); [exact F CI](https://github.com/fevaldez/training-os/actions/runs/38961446777) passed. This supersedes the original unexecuted M5-01 planning status above, without altering the C observations or their line references.

M5.5 then authorized and completed exactly one additional immutable F Preview. Live brief smoke passed secure boot, empty-load no-mutation rejection and positive 20 kg completion. Physical Safari/Home Screen acceptance, zero reconfirmation and downloaded/parsed export/restore remain pending; M5-02 UNKNOWN. The bounded Chromium layout observation (stage top 70→284 synchronously→70 next frame) did not reproduce or causally match the reported physical screen-wide flicker; no speculative fix was made.

**Current recommendation:** GO for [targeted physical testing on M5.5/F](PR_S1_QA_MATRIX.md#m55-three-minute-owner-iphone-check) and non-dependent remaining M5 checks. Full M5 signoff and production remain NO-GO. Preserve M4/C, both Draft implementation PRs and all data. Earlier investigation-only recommendations below are historical; they do not describe the later authorized implementation/publication. No further deployment, broad audit or independent review cycle is authorized.

## Original verification mapping and bounded stop

These commands describe **future bugfix regression**, not tests rerun by this documentation task:

| Gate | Existing command / required evidence |
|---|---|
| Release/static + version/hash contract | `python3 scripts/validate_release.py` |
| Engine/prescription/timer | `node scripts/test_engine.js` |
| UI static | `node scripts/test_ui_static.js` |
| Reliability/navigation | `python3 scripts/test_reliability_rc621.py` |
| All existing candidate durability suites | `node tests/storage_durability.test.js` (includes original/G3/G4.1); keep all assertions unchanged |
| Existing real-browser durability suites | With existing authorized browser dependencies: `node tests/storage_g3_browser.test.js --original-suite` (starts its disposable loopback server for the original suite) and `node tests/storage_g3_browser.test.js`; synthetic disposable contexts only |
| New focused regressions | Missing/explicit load matrix + no-mutation rejection; pending/error presentation and DOM/focus/scroll behavior; delayed/failing/overlapping save cases |
| Exact-head hosted CI | Future bugfix head must pass its required PR checks; #3's documentation CI validates B's unchanged baseline, not a runtime correction |
| Physical target gate | Human-supplied Safari + Home Screen evidence, then the D01–D10 matrix; download/parsed restore and offline statuses reported honestly |

Read-only source probe run in this task: `node docs/release/evidence/m5/bounded-source-probe.cjs` (after registration; the identical probe was executed from a temporary file). It reads exact Git objects and writes JSON to stdout; no network, server, deployment, profile or filesystem storage mutation. Its result is [source-trace.json](evidence/m5/source-trace.json). No existing acceptance suite or broad audit was rerun manually. A documentation push triggers the existing read-only PR CI normally; it does not deploy.

**Original C-only recommendation (superseded for F by M5.5 above):** NO-GO for continuing/completing full remaining M5 acceptance on C while these P1s are OPEN. GO only for bounded diagnostic recording and non-dependent read-only checks with synthetic data. M5-01's missing-load subcase is FAIL; launch is PARTIAL; every unobserved D01–D10 assertion remains UNKNOWN. M2 durability CODE GO stays separate and pending; no prior audit is reopened.

Historical investigation checkpoint: stop after that record and correction plan. At that time, later implementation required authorization for: one new isolated fix branch/worktree rooted at C and one Draft bugfix PR, without changing PR #2 or promoting a new source pin automatically. Keep M4 immutable. Any preview republication, release/hash approval, merge, release or PR-A requires its own authorization. Never clear device storage/caches or remove the production installed app.
