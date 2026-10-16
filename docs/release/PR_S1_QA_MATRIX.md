# PR-S1 focused acceptance and physical-iPhone checklist

Status: **M6 preparation. M5.5/F preserved; brief M5-01 physical OK reported; general flicker not observed. Intermittent upward scroll OPEN; complete physical acceptance UNKNOWN.** M5 observations on C remain the owner’s limited self-report. Launch/render is limited evidence; full D01–D10 acceptance has not passed. All remaining independent/device outcomes remain UNKNOWN. Implementation-author G4.1 logs and passing CI are prior evidence, not independent acceptance or physical-iPhone results. This checklist grants no publication or production access.

Candidate C: `54e25199e33b8cc725d86881b950bb68b4cf0cd4`. Main B: `b82218dbc05662124821d1d6c27369ae717dd767`. Build: `pr-s1-54e25199e33b8cc725d86881b950bb68b4cf0cd4`. Historical hosted/device feedback source F: `c23f7cdd21b895c0aed3a6da49ea02da27d25aad`, build `pr-s1-m5-c23f7cdd21b895c0aed3a6da49ea02da27d25aad`; [M5.5 receipt](PR_S1_M55_EVIDENCE.md). C remains the original M4/counterexample reference. Later engineering candidate T is `f54ae0d6d0a0c3e93dba93bcd9338f7d1d92f42b`, CI SUCCESS ( [run 38981666499](https://github.com/fevaldez/training-os/actions/runs/38981666499) ); R final source is UNASSIGNED. The current F URL does not serve T; no final-source physical acceptance is inferred. Release label alone is insufficient. Never repeat Gate 0/G2/G3, the 199-check baseline audit or the entire G3 browser suite for independent acceptance.

## M6 owner feedback (limited physical evidence)

The owner reports **brief M5-01 physical OK**, **general flicker not observed on the latest F Preview**, **intermittent upward scroll OPEN across multiple scenarios**, and **complete physical acceptance UNKNOWN**. Exact model/iOS/build, Safari versus installed context, scenario chronology and recordings were not supplied. Preserve these observations without turning them into D01–D10 or post-T PASS.

T passed the targeted Chromium scroll cases (3/9 RED at F → 9/9 GREEN), while keyboard/focus, momentum, visual-viewport and Home Screen behavior remain unverified on physical Safari. The old/new trace also retained background-document anchoring movement during some intentional transitions; no match to the owner’s physical symptom is established. This does not close the reported upward-scroll finding.

On an owner-authorized hosted final R, replay each reported upward-scroll scenario with the before/after position, focus, selected input and active-state values, exact button and idle/running mode. Record whether the jump is an intended transition or an unintended movement; do not invent a diagnosis from the brief report. Safari and Home Screen/PWA get separate run sheets. The [single M6 decision table](PR_S1_STAGING_AND_CUTOVER.md#m6-controlled-release-decision-table) lists all release blockers, responsible parties, permissions and stops; this matrix is the procedure, not a second GO table.

## Entry checks and evidence sheet

Current M5.5 entry URL: [https://training-os-pr-s1-bvwfy5e7g-valcan.vercel.app/training-os/](https://training-os-pr-s1-bvwfy5e7g-valcan.vercel.app/training-os/). Deployment `dpl_FKDaxaMZFt3Ty1YyRXyjMrTQTTb7`, actual Preview, READY, exact F; 8/8 served hashes PASS and secure browser boot `ok`. A brief disposable Chromium smoke rejected empty load without RAM/disk change and logged positive 20 kg. This is automated evidence only.

Preserved M4 entry URL: [https://training-os-pr-s1-nphf0td5s-valcan.vercel.app/training-os/](https://training-os-pr-s1-nphf0td5s-valcan.vercel.app/training-os/). Deployment `dpl_2HkzDYDSVFvmeoJq1upj7eB8NDU4` is READY, source C; [eight-file hash/origin/route receipt](PR_S1_M4_EVIDENCE.md). Use this unique deployment URL rather than its mutable QA aliases. Desktop browser smoke showed `data-boot=ok`; it does not complete any physical-device row.

- [ ] Independent reviewer named; for physical tests, an actual iPhone and owner/device QA operator are available. Desktop emulation is not physical evidence.
- [ ] Read-only verify #2 OPEN/DRAFT at C and [CI run 38922832795](https://github.com/fevaldez/training-os/actions/runs/38922832795) completed/success at C. Any changed head invalidates this pin; do not update #2.
- [ ] For final release device/hosted tests, attach the separately approved R URL, final scheme/host/effective port, redirects, deployment receipt and fetched-file hash comparison to R. No such R host exists yet. #4 is Draft at T with successful exact-head CI; M5.5 remains F and cannot validate T/R. #2/C is preserved separately. Final origin must differ from `https://fevaldez.github.io` and be dedicated/disposable.
- [ ] Confirm no production storage, caches, app install or profile will be cleared. Use synthetic fixtures only; never import the owner's history to a public preview.
- [ ] Obtain the pinned synthetic fixture locally with `git show 54e25199e33b8cc725d86881b950bb68b4cf0cd4:tests/fixtures/storage/mixed-backup.json > /private/tmp/tos-pr-s1-synthetic.json`. Transfer only this fixture to the device's Files app. It is a mixed synthetic history (three records), active session and unit `lb`; preserve its IDs, field types and unknown fields.
- [ ] Keep fixture/evidence files outside all Git checkouts; no actual device history or diagnostic backups go into the public repository. Use a different disposable origin/profile for restore and malformed-input trials; do not clear a populated origin to reset it.

Complete one run sheet for **each** Safari and Home Screen context; do not assume they share storage:

| Field | Recorded value |
|---|---|
| Reviewer / operator / local timestamp + timezone | UNKNOWN |
| iPhone model / exact iOS version + build | UNKNOWN |
| Safari version / user agent / browser engine information | UNKNOWN |
| Context: Safari tab or Home Screen installed launch | UNKNOWN |
| Actual launch URL / `location.origin` / redirected URL | UNKNOWN |
| Provider deployment ID / immutable URL / fetched source F (or historical C) + hashes | UNKNOWN |
| Network: Wi-Fi/cellular, airplane mode, VPN/WARP if relevant | UNKNOWN |
| Secure context / `navigator.locks` available / storage health | UNKNOWN |
| Fixture hash / before and after JSON file names + hashes | UNKNOWN |
| Test ID / steps / expected / actual / PASS, FAIL, UNKNOWN or BLOCKED | UNKNOWN |
| Screenshot/video files and raw trace links (synthetic only) | UNKNOWN |

Use connected Safari Web Inspector on a Mac for raw state/failure injection when available. Record its exact version. If unavailable, UI-only rows may proceed, but instrumentation-dependent rows remain UNKNOWN/BLOCKED. Do not record a PASS based on a download-started message or a test that could not run.

## M5 reported findings and acceptance stops

Feedback date: 2026-10-16. Source is exact C and the immutable M4 URL above. User-supplied feedback is evidence; it does not authorize runtime modification or deployment. Exact iPhone model, iOS/build, Safari version, Safari versus Home Screen mode, network, recording, fixture state and per-button chronology remain UNKNOWN. Preserve the user's wording: the preview renders/loads on iPhone; the flicker is **reportedly any button**, not independently established for every control.

| ID / severity / status | Observed reproduction and evidence | Required acceptance (M5-01 automated at F; physical pending) |
|---|---|---|
| M5-01 / P1 data quality and workout tracking / automated PASS at F; physical OPEN | Enter repetitions with no load → tap **Completar set** → numeric `weightKg: 0` logged and next set/exercise reached. Exact C source at 1001–1003, 1477, 1765–1788 and 1824–1831 confirms the cause; [bounded source probe](evidence/m5/source-trace.json) reproduces saved zero and index advance for empty/cleared input using synthetic in-memory storage | Missing/unconfirmed load differs from explicit zero external kg; positive finite kg/lb also valid. Empty, cleared, invalid text, NaN and a prefilled old zero never imply confirmation. Explicit no-external-load choice or equivalent verified UX; do not globally prohibit zero, change prescriptions/rep/tempo/rest or normalize historical zeros. Failed completion validation changes no active session, log, index, timer or rest and shows an accessible inline error beside weight. Skip/omit stays separate. Test empty, cleared, explicit zero, positive kg/lb, negative, invalid and known bodyweight/no-added-load cases; verify durable save/reload/history/export/import and all existing durability suites. Prefer additive UI-only confirmation state; stop and explain if a schema change is unavoidable |
| M5-02 / P1 UX / OPEN; physical root cause UNKNOWN | User perceives significant/screen-wide flicker on button presses, reportedly any button. Exact C confirms normal-save pending/error panel churn at 1420–1450 and normal-save Today/weekly replacement at 1591–1612; stage renderers replace sections at 1739–1747/1769/1843; navigation forces scroll at 1614–1619; blur layers exist at 21/24/33. These are mechanisms/candidates, not a confirmed iPhone diagnosis | First capture exact buttons (weight ±, reps ±, RIR, Today/Programa/Progreso), idle versus running, Safari versus Home Screen, iPhone/iOS and flash color/blank frame versus position jump. Use synthetic preview data and a short recording or Web Inspector trace. Future controlled disposable-local A/B isolates pending-panel presentation, hidden Today DOM writes, affected-node updates, scoped bottom/sticky/picker blur and no-op forced scroll, one at a time. Require no visible flash/blank frame on repeat taps in both contexts, stable focus/scroll, no lost taps, input values or session state, and navigation/active-session regression checks. Do not blindly remove visuals or alter persistence protocol |

The exact-source Node probe is **not** browser paint or physical evidence. Weight+, reps+ and RIR each showed both recovery panels with three children during ordinary pending save, hidden/empty after successful save, plus two Today-section replacements while the overlay was open. A same-page navigation control forced scroll without the save/error path. Consequently no single cause explains the broad report yet. [Verified line references, evidence method, minimal correction plan and scoped regression mapping](PR_S1_M5_FINDINGS.md).

**Current decision:** GO for targeted load/zero/reload checks and other non-dependent M5 testing on M5.5/F. The original missing-load subcase remains FAIL on unchanged C; F passes 16 focused core and 7 M5 browser cases plus the live brief smoke. Physical acceptance on F is PENDING. M5-02 remains UNKNOWN and does not block verification of the proven M5-01 fix. Full M5 signoff and production remain NO-GO until their evidence gates pass; do not infer D01–D10 PASS from launch or desktop tests. Independent N1/N2 CODE GO remains separate and pending.

## M5.5 three-minute owner iPhone check

Use only the new slash-terminated [M5.5 Preview](https://training-os-pr-s1-bvwfy5e7g-valcan.vercel.app/training-os/) and synthetic entries. Before the timer, record iPhone/iOS build and Safari version, start a screen recording and verify the URL. Do not import real training data or open/clear the production app. If an unsaved/recovery error persists, stop and preserve/export divergent data before any reload. This is an interaction test, not an exercise session.

1. **0:00–0:30 — setup:** in Safari open the new URL. Tap **Planear sesión → Empezar · … sets → Omitir warm-up hoy** to start a dummy session (or resume a previously created synthetic session). Select **kg**. Record the exercise/set shown.
2. **0:30–1:00 — empty:** clear **Peso**, enter **8** repetitions, tap **Completar set**. Require the inline weight message, same set and no completed-set advance.
3. **1:00–1:30 — positive:** enter **20** in **Peso**, tap **Completar set**. Require advance and the last-set summary showing 20 kg × 8. Tap **Empezar ahora** (or **Empezar siguiente set**) to bypass waiting in this dummy test.
4. **1:30–2:20 — explicit zero and reload:** on this uncompleted set enter **8** reps and tap **Sin carga externa (0 kg)**. After save activity settles, reload Safari, tap **Reanudar**, then **Completar set** without selecting zero again. Require a weight error and no advance. Select **Sin carga externa (0 kg)** again and complete; require advance. A typed `0`, empty input or persisted zero alone must never reconfirm intent.
5. **2:20–3:00 — flicker:** start the next set, tap weight **+5/−5**, reps **+1/−1**, one **RIR** choice, then the session back arrow and **Hoy → Programa → Progreso**. Record the exact button, any flash/blank frame versus position jump, focus/scroll or lost input. Report M5-01 PASS/FAIL and M5-02 observed/not observed with the recording and device/context; absence in one short run is not a root-cause resolution.

Then add this exact preview using **Share → Add to Home Screen**, label it as M5.5 QA, verify its launch origin, and repeat the same three-minute sequence there (start a new dummy session if its storage is separate). This second context is additional to the first three-minute pass. Full D01–D10, downloaded/parsed export and restore, durability/force-close/quota and applicable offline evidence remain required for full acceptance. No physical PASS has yet been recorded.

## Focused independent code acceptance

For release acceptance, this section must bind to approved final R in disposable synthetic environments; the C-linked author evidence remains historical reference. It may run read-only before a hosted preview exists. The reviewer creates an independent driver using R's real persistence core and/or browser UI, not a rewritten storage algorithm. Verify `git rev-parse HEAD` and candidate bytes in a clean read-only checkout; `tests/storage_g3_support.cjs` supplies the synthetic store, real production extraction, fixtures and actual RC4 producer. Historical commits `d9309cb` (actual v3 producer) and `3edb8b9` (actual RC4 producer) are needed; original G2 R2/B2/R5 counterexample lineage is preserved in the C-linked G3/G4.1 evidence, not replaced by a new broad audit. Do not mutate the shared PR #2 checkout.

Reference only: [G4.1 author notes](https://github.com/fevaldez/training-os/blob/54e25199e33b8cc725d86881b950bb68b4cf0cd4/tests/G41_REVIEW.md), [focused core source](https://github.com/fevaldez/training-os/blob/54e25199e33b8cc725d86881b950bb68b4cf0cd4/tests/storage_g3.test.js), [browser source](https://github.com/fevaldez/training-os/blob/54e25199e33b8cc725d86881b950bb68b4cf0cd4/tests/storage_g3_browser.test.js). A repeat of these author's assertions alone must be labeled reproduction, not independent acceptance. Existing default entrypoints run broader G3 work; do not use them for this bounded review. If needed for comparison, `node -e 'require("./tests/storage_g3.test.js").runG41().catch(e=>{console.error(e);process.exitCode=1})'` invokes only the 22 focused G4.1 author checks, not the G3 suite. This command is unexecuted by Track A.

### N1: retired journal, three clients

- [ ] Start with one fresh synthetic shared store and real Web Locks in browser mode. Open A and B on the same disposable origin; fixture active draft `0_1` starts at 9. Record raw history, active, unit, migration/extras and recovery journal/backup/outcome keys.
- [ ] Instrument **all shared `setItem` and `removeItem` calls** (key + before/after + client + order); separately count recovery-key writes. In A, inject a single controlled `fv4.unit` write failure during import of the synthetic replacement (`history:[]`, `active:null`, `unit:kg`) to retain a divergent RAM journal. Wait until import completes/refuses; do not force-close A.
- [ ] In B, boot/recover from persisted evidence; verify ready. Save the current active draft as 15 reps, wait for completion, and record the raw active value and absent recovery keys. Keep A's local 9-rep copy alive.
- [ ] Remove only A's injected fault, reset the write counters, then tap **Reintentar** in A. Capture full raw state immediately before/after and the complete write trace.
- [ ] Require zero shared recovery mutations from A's stale retry, no recreated `fv4.recovery.v1`, `fv4.recovery.backup.v1` or `fv4.recovery.outcome.v1`; verify no stale active overwrite in the full trace. An unchanged final value alone does not prove zero transient writes.
- [ ] In B save **15→16**, await success, then open a fresh third tab. Require third tab ready with 16, persistent active 16, A's divergent RAM 9 still exportable, and A's stale save refused. Record all outcomes and raw snapshots; no silent merge or overwrite.

N1 PASS requires every assertion above, including zero-write evidence. Missing trace is UNKNOWN; a reproduced stale write or blocked B/third tab is a P0/P1 failure requiring one bounded defect report.

### N2: actual RC4 producer and strict rejection

- [ ] First replay original G2 R2 with the actual v3 producer (`realV3()`, `d9309cb:index.html`) and preserve its legitimate blank historical RIR and source keys without normalization; include it in the disposable mixed export/restore and zero-write rejection comparisons. Then generate schema-4 records with C's `realRC4('2')`, `realRC4('')`, and numeric `realRC4(2)`. Confirm original producer commit `3edb8b9`, schema 4, release `4.0.0-rc4` and original JSON value types. This executes actual lookup → constructor → draft → complete-set → finish; a hand-written record is insufficient provenance.
- [ ] Attach distinct synthetic IDs/unknown fields, combine the records with the current mixed fixture, and import to a disposable store. Export and restore into a second empty disposable store. Compare complete history, active logs/drafts, units and unknown fields; require string `"2"`, blank `""`, and numeric `2` unchanged, including types.
- [ ] In separate fresh disposable trials reject markup, `2junk`, `2e0`, `Infinity`, `NaN`, `11`, `-1`, leading/trailing whitespace, numeric Infinity/NaN, 11 and -1. For nonfinite JavaScript values use the in-memory core driver; JSON cannot encode them faithfully. Require invalid result and **zero shared writes** for each case, including recovery keys.
- [ ] Also put string `"2"`/`""` in current active logs and drafts; require rejection. Historical compatibility must not relax current active-state validation.
- [ ] Record raw before/after and full mutation trace per input, producer provenance, exported/restored JSON and semantic/type comparisons. If browser invalid-input dialogs appear, confirm no replacement or success message.

CODE GO requires independent N1/N2 PASS at final R **and** candidate CI PASS at exactly R. Track A leaves this decision **UNKNOWN / pending**. Stop after a proven P0/P1 with the single smallest reproduction; no broad re-audit.

## Physical device execution

The matrix below remains the full physical verification plan; the current M5.5 decision and exact-source evidence above take precedence. Use only the approved immutable isolated URL for authorized diagnostics. F remains the historical brief-check host. For final release verification, first obtain separate owner publication approval for exact R and bind these rows to its actual immutable URL; T has not inherited F device evidence. Record outcomes independently. Run Safari tabs first, then add the preview from Safari using **Share → Add to Home Screen**; label the new preview icon clearly in the OS dialog. The unchanged candidate icon/title can resemble production, so verify its launch URL with Web Inspector. Do not remove or launch the production icon as a test step.

| ID / priority | Executable steps | Required observation / evidence | Current status |
|---|---|---|---|
| D01 / P0 | With network online open `/training-os/`; record origin, build provenance, `document.documentElement.dataset.boot`, `isSecureContext`, locks availability and storage health; import the synthetic fixture through **Progreso → Importar** and confirm the replacement only in disposable storage | Final release candidate hashes match R (F results retained only as history); boot `ok`, ready state, three fixture history entries, active fixture, unit lb; screenshot and raw snapshot | F physical D01 UNKNOWN; C launch PARTIAL by owner self-report only |
| D02 / P0 | Open/resume the fixture workout, start execution, enter distinctive synthetic reps/load/RIR and complete one set; wait for save. Record draft/log/plan/timer state, reload online, resume and compare | Same durable log/draft, unit, plan/order, skipped-set flags and timer state; no silent success on a refused write | C missing-load subcase FAIL; F automated PASS and brief physical OK reported; complete R D02 UNKNOWN |
| D03 / P0 | Complete a synthetic workout, recording ID and set count; inspect Progreso history, reload, inspect again; export before/after | Exactly one completion, preserved values/unknown fields, no duplicate/lost history or active state; compare to before snapshot | UNKNOWN |
| D04 / P1 | Start a rest with recorded deadline, background and lock the phone past that deadline, then return; separately change tabs and return | Elapsed/deadline display is coherent, saved session intact, navigation usable; record times and actual alarm behavior without assuming guaranteed background alarms | UNKNOWN |
| D05 / P0 | After a confirmed successful save export a baseline, force-close Safari/app from app switcher, relaunch online in that same context and compare; run a separate failed-save trial only after exporting divergent RAM | Durable confirmed changes survive; failed unsaved RAM may be lost as explicitly warned and retained in verified external recovery export; no claim that unsaved RAM survives | UNKNOWN |
| D06 / P0 | Safari: open A/B on preview, independently exercise N1 above with Web Inspector and third tab. Home Screen: record actual storage relationship to Safari and use cooperating clients only if proven shared | B 15→16, third ready 16, zero stale writes; raw traces and screenshots. Unknown context sharing never counts as tested concurrency | UNKNOWN |
| D07 / P1 | In a fresh disposable instrumented context only, make Web Locks unavailable before boot using a page-start override; verify origin guard first. If iPhone cannot reproduce safely, leave UNKNOWN | Explicit `lock-unavailable`/blocked mutation, no successful save or overwritten data, raw recovery export remains possible. Record exact mechanism; desktop replay does not prove iPhone behavior | UNKNOWN |
| D08 / P0 | Controlled fault: using Web Inspector on preview only, record key snapshots, then temporarily fail `fv4.active` writes; complete a set, attempt unrelated unit save, export recovery, remove fault and tap Reintentar; wait, reload and compare. Real quota pressure is a separate trial on disposable storage only | Visible persistent dirty-state warning + Retry/Export, no false saved state, unchanged durable failed revision, successful exact retry when possible. Synthetic failure is labeled synthetic; no claim of real quota acceptance | UNKNOWN; real quota UNKNOWN |
| D09 / P0 | From **Progreso → Exportar JSON**, open Files → Downloads, verify actual nonempty file, record filename/size/hash, transfer/open it and parse JSON; restore via Importar into a second fresh disposable context, confirm, reload, export again and compare | Actual file exists and parses; history/active/units/plans/logs/drafts/unknown fields match exactly (allow exportedAt difference). Download initiation message alone fails this gate | UNKNOWN |
| D10 / P0 offline | After successful online launch/save/export, turn off Wi-Fi and cellular (airplane mode; verify no fallback), force-close the context, cold launch Safari URL and separately Home Screen, record screen/time/network/controller/state; restore network and verify preserved data | Record actual offline launch/resume outcome, never assume support. Expected UNKNOWN/FAIL before PR-A; failure blocks offline/P0 release gate. Do not implement or enable a worker here | UNKNOWN / expected fail |

For D08 the inspector can temporarily wrap `Storage.prototype.setItem` to throw `DOMException('synthetic quota','QuotaExceededError')` **only** for `this === localStorage && key === 'fv4.active'`, and restore the original function after export. Guard `location.origin` against the approved preview origin before installing any hook. D06 similarly scopes the single import fault to A and `fv4.unit`, then restores it before retry. Record hook code, installation/removal time and mutation trace; never set a fault or seed data on production. Quota caused by a controlled exception is not real device quota exhaustion.

A raw recovery export with `format:'training-os-raw-recovery-v1'` is diagnostic evidence containing raw keys, `memoryActive` and possibly `memoryJournal`; it is **not** a normal importable backup. Parse and inspect it separately; preserve local 9 and persistent 16 without silently choosing one. Any restore/adoption needs a bounded reviewed procedure in disposable storage. Normal D09 restore uses the normal schema-6 export, not a raw dump.

Normal exports exclude preferences/diagnostics/legacy source/recovery keys; compare the documented history, active, unit and preserved unknown payload fields, not excluded preferences. For failed-save trials verify both the persisted snapshot and memory snapshot before closing. Never force-close divergent RAM before a real external recovery file is verified.

## Result and bounded failure template

Record each test independently; UNKNOWN/BLOCKED is not PASS. Physical PASS requires the human operator's actual evidence, not Codex inference.

```text
Test ID / severity / PASS, FAIL, UNKNOWN or BLOCKED:
Reviewer and physical operator:
Candidate SHA / deployed hashes / immutable URL / origin:
Device + exact OS/browser versions / context / network / timestamp:
Synthetic fixture and preconditions:
Numbered reproduction steps:
Expected result:
Actual result:
Raw before/after JSON files + hashes / mutation trace:
Screenshot or video evidence (no real history):
Smallest proven P0/P1 defect, or missing evidence:
Owner / next action:
```

Decision record: N1 UNKNOWN; N2 UNKNOWN; candidate CI prior PASS at C; iPhone launch/render PARTIAL self-report (browser context UNKNOWN); M5-01 original C reproduction FAIL, automated F PASS and brief physical OK reported; general flicker not observed on latest F Preview; intermittent upward scroll OPEN; complete R physical acceptance UNKNOWN; full Safari/Home Screen acceptance, real quota, offline cold launch and downloaded-file restore UNKNOWN. Targeted M5.5/F physical testing GO; full M5 signoff remains NO-GO pending the physical evidence gates. **CODE GO pending. PRODUCTION NO-GO.** Production additionally requires the [cutover/backup/old-client/deployment-control/rollback gates](PR_S1_STAGING_AND_CUTOVER.md#m6-controlled-release-decision-table) and explicit owner authorization. No #2 edits, Ready, merge, deployment, tags or PR-A work follow automatically from this checklist.
