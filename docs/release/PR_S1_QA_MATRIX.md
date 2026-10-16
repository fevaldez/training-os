# PR-S1 focused acceptance and physical-iPhone checklist

Status: **M4 preview verified and available; Track B acceptance not executed.** All independent/device outcomes remain UNKNOWN. Implementation-author G4.1 logs and passing CI are prior evidence, not independent acceptance or physical-iPhone results. This checklist grants no publication or production access.

Candidate C: `54e25199e33b8cc725d86881b950bb68b4cf0cd4`. Main B: `b82218dbc05662124821d1d6c27369ae717dd767`. Build: `pr-s1-54e25199e33b8cc725d86881b950bb68b4cf0cd4`. Release label alone is insufficient. Never repeat Gate 0/G2/G3, the 199-check baseline audit or the entire G3 browser suite for independent acceptance.

## Entry checks and evidence sheet

M4 entry URL: [https://training-os-pr-s1-nphf0td5s-valcan.vercel.app/training-os/](https://training-os-pr-s1-nphf0td5s-valcan.vercel.app/training-os/). Deployment `dpl_2HkzDYDSVFvmeoJq1upj7eB8NDU4` is READY, source C; [eight-file hash/origin/route receipt](PR_S1_M4_EVIDENCE.md). Use this unique deployment URL rather than its mutable QA aliases. Desktop browser smoke showed `data-boot=ok`; it does not complete any physical-device row.

- [ ] Independent reviewer named; for physical tests, an actual iPhone and owner/device QA operator are available. Desktop emulation is not physical evidence.
- [ ] Read-only verify #2 OPEN/DRAFT at C and [CI run 38922832795](https://github.com/fevaldez/training-os/actions/runs/38922832795) completed/success at C. Any changed head invalidates this pin; do not update #2.
- [ ] For device/hosted tests, attach M4's actual URL, final scheme/host/effective port, redirect chain, deployment receipt and fetched-file hash comparison to C. Final origin must differ from `https://fevaldez.github.io` and be dedicated/disposable.
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
| Provider deployment ID / immutable URL / fetched source C + hashes | UNKNOWN |
| Network: Wi-Fi/cellular, airplane mode, VPN/WARP if relevant | UNKNOWN |
| Secure context / `navigator.locks` available / storage health | UNKNOWN |
| Fixture hash / before and after JSON file names + hashes | UNKNOWN |
| Test ID / steps / expected / actual / PASS, FAIL, UNKNOWN or BLOCKED | UNKNOWN |
| Screenshot/video files and raw trace links (synthetic only) | UNKNOWN |

Use connected Safari Web Inspector on a Mac for raw state/failure injection when available. Record its exact version. If unavailable, UI-only rows may proceed, but instrumentation-dependent rows remain UNKNOWN/BLOCKED. Do not record a PASS based on a download-started message or a test that could not run.

## Focused independent code acceptance

This section can run read-only against C in disposable synthetic environments before a hosted preview exists. The reviewer creates an independent driver using C's real persistence core and/or browser UI, not a rewritten storage algorithm. Verify `git rev-parse HEAD` and candidate bytes in a clean read-only checkout; `tests/storage_g3_support.cjs` supplies the synthetic store, real production extraction, fixtures and actual RC4 producer. Historical commit `3edb8b9` is needed for RC4 generation. Do not mutate the shared PR #2 checkout.

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

- [ ] Generate schema-4 records with C's `realRC4('2')`, `realRC4('')`, and numeric `realRC4(2)`. Confirm original producer commit `3edb8b9`, schema 4, release `4.0.0-rc4` and original JSON value types. This executes actual lookup → constructor → draft → complete-set → finish; a hand-written record is insufficient provenance.
- [ ] Attach distinct synthetic IDs/unknown fields, combine the records with the current mixed fixture, and import to a disposable store. Export and restore into a second empty disposable store. Compare complete history, active logs/drafts, units and unknown fields; require string `"2"`, blank `""`, and numeric `2` unchanged, including types.
- [ ] In separate fresh disposable trials reject markup, `2junk`, `2e0`, `Infinity`, `NaN`, `11`, `-1`, leading/trailing whitespace, numeric Infinity/NaN, 11 and -1. For nonfinite JavaScript values use the in-memory core driver; JSON cannot encode them faithfully. Require invalid result and **zero shared writes** for each case, including recovery keys.
- [ ] Also put string `"2"`/`""` in current active logs and drafts; require rejection. Historical compatibility must not relax current active-state validation.
- [ ] Record raw before/after and full mutation trace per input, producer provenance, exported/restored JSON and semantic/type comparisons. If browser invalid-input dialogs appear, confirm no replacement or success message.

CODE GO requires independent N1/N2 PASS at C **and** candidate CI PASS at C. Track A leaves this decision **UNKNOWN / pending**. Stop after a proven P0/P1 with the single smallest reproduction; no broad re-audit.

## Physical device execution

Use only the approved immutable isolated URL. Repeat D01–D10 in both contexts unless a row states otherwise. Run Safari tabs first, then add the preview from Safari using **Share → Add to Home Screen**; label the new preview icon clearly in the OS dialog. The unchanged candidate icon/title can resemble production, so verify its launch URL with Web Inspector. Do not remove or launch the production icon as a test step.

| ID / priority | Executable steps | Required observation / evidence | Current status |
|---|---|---|---|
| D01 / P0 | With network online open `/training-os/`; record origin, build provenance, `document.documentElement.dataset.boot`, `isSecureContext`, locks availability and storage health; import the synthetic fixture through **Progreso → Importar** and confirm the replacement only in disposable storage | Candidate hashes match C; boot `ok`, ready state, three fixture history entries, active fixture, unit lb; screenshot and raw snapshot | UNKNOWN |
| D02 / P0 | Open/resume the fixture workout, start execution, enter distinctive synthetic reps/load/RIR and complete one set; wait for save. Record draft/log/plan/timer state, reload online, resume and compare | Same durable log/draft, unit, plan/order, skipped-set flags and timer state; no silent success on a refused write | UNKNOWN |
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

Decision record: N1 UNKNOWN; N2 UNKNOWN; candidate CI prior PASS at C; physical Safari UNKNOWN; physical Home Screen UNKNOWN; real quota UNKNOWN; offline cold launch UNKNOWN; downloaded-file restore UNKNOWN. **CODE GO pending. PRODUCTION NO-GO.** Production additionally requires the [cutover/backup/old-client/deployment-control/rollback gates](PR_S1_STAGING_AND_CUTOVER.md#cutover-and-repository-governance) and explicit owner authorization. No #2 edits, Ready, merge, deployment, tags or PR-A work follow automatically from this checklist.
