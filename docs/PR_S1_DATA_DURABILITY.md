# PR-S1: preserve data when saving, importing, or exporting fails

Status: specification only. Requires separate implementation approval; PR-00 does not change application behavior.

Baseline: `27abe8af3b50065fb2e76cc90f7b26ae2602fc42`, release `4.0.0-rc6.2.1`.

## Verified failure path

In baseline `index.html:1161`, `store.set()` returns false when `localStorage.setItem()` throws, without changing the initial `store.ok` flag. In `index.html:1575`, `finishSession()` executes:

```js
const h = history();
h.push(entry);
store.set('fv4.history', h);
saveActive(null);
```

The return value is ignored. `saveActive(null)` at line 1182 attempts to delete `fv4.active`; completion then closes the session and navigates to Progress. If the history write fails but removal succeeds, the completed session is lost. A successful initial availability probe does not establish durability for later writes.

At lines 1584-1585, export uses an envelope with schema 4 containing newer record schemas; import validates only the history array, ignores write outcomes, leaves an existing active session when the incoming active value is null/absent, and can announce completion after a partial failure. The v3 migration at lines 1166-1177 also ignores write results. These are source-derived findings, not device reproduction.

## Scope and invariants

Modify only the approved persistence/completion/import/export/recovery paths in `index.html`, with focused tests proposed at `tests/storage_durability.test.js` and `tests/fixtures/storage/`. Update checksum bookkeeping only in that separately approved PR. Keep prescriptions, release promotion, workers, and pilot implementation outside PR-S1.

- Preserve every existing history record, supported mixed record schemas, unknown fields, unit, plan, drafts, logs, set/skip status, and timer state. Do not rerun a lossy migration over existing history.
- Introduce a strict storage result API that distinguishes absent, unreadable, malformed, write-failed, read-back-failed, and verified data. Do not use the current default-returning `store.get()` to certify persistence: a corrupt history must never be treated as an empty history and overwritten.
- A save is verified only after serialization succeeds, setItem succeeds, and a fresh raw getItem matches the exact serialized snapshot and validates structurally. If read-back fails or differs, retain recovery state and report an unverified save. Read-back cannot guarantee immunity from later OS eviction; backup remains necessary.

## Completion protocol and retry

1. Before finishing, freeze a completion intent: existing stable session ID, endedAt, entry payload, and a deterministic payload digest. Retain it with the active session; verify that write. Do not regenerate timestamps or the intended entry on retries. If intent persistence fails, keep the session open and its in-memory copy available for export.
2. Read and validate current history without fallback-to-empty. Look up the stable session ID. If an identical completed payload already exists, reuse it; if the ID exists with a different payload, stop with a conflict error. Otherwise append exactly once, preserving prior entries and unknown fields.
3. Write and read back the candidate history. Only after confirming the intended entry and prior records are present may active-session cleanup begin.
4. Verify active removal. If removal fails or execution stops after history persistence, startup/retry reconciles the retained intent against history and clears only the already-committed active session. Never append a duplicate. Keep a bounded completion button lock to prevent repeated taps during one attempt.
5. Surface persistence failures beside the completion control: "No se pudo verificar el guardado. Conservamos la sesión; reintenta o exporta un respaldo." Keep Retry and Export available. Do not display successful completion, discard the in-memory session, or navigate away on failed/unverified history writes. If only active cleanup fails after verified history, say the session is saved but cleanup needs retry.

Multiple tabs can overwrite each other's localStorage histories; read-back alone is not mutual exclusion. Serialize history mutations using a supported same-origin lock, re-read history inside it, and test competing writers. Where locking is unavailable, require an explicitly tested single-writer/fail-closed policy; do not claim a localStorage compare-and-set is atomic. Older tabs do not honor new locks: the rollout plan must quiesce old writers after preserving their active session. Do not claim safe arbitrary concurrency with old clients.

## Import and export failure behavior

- Validate the entire import before mutation: supported envelope/record versions, arrays/objects, IDs, workload references, active-state structure and bounds, finite values, and valid units. Preserve unknown fields. Reject unsupported or inconsistent data with zero writes; render imported text safely, never as HTML.
- Show replacement scope and require the existing explicit confirmation. Capture the exact pre-import raw values before any destructive write. Use a durable, verified journal/backup for multi-key replacement, with a documented startup recovery decision before normal writes resume. Inject interruptions after every stage; localStorage does not provide multi-key transactions.
- Apply history, active state, and unit as one recoverable operation. Treat explicit `active: null` as a request to clear active only after verified history replacement. For older envelopes where active is absent, require an explicit keep/replace choice instead of silently inheriting an unrelated active session.
- On failed write/read-back/rollback, retain the journal and recovery UI. Do not announce "Importación completa" until all intended values verify. Do not delete source or recovery keys until reconciliation succeeds. A failed recovery must still allow exporting preserved raw snapshots.
- Export must report read, parse, serialization, Blob/URL, or download-initiation failures and leave storage unchanged. A browser download click is not proof that the user saved a file: say download initiated and provide verification guidance. Round-trip into a disposable store and compare records, active state, units, and unknown fields. State which preference/diagnostic keys the format excludes.
- Preserve v3 source keys. Set a migration completion marker only after all destination writes verify; retry must not duplicate or discard history. Test interrupted and previously completed migrations.

## Required failure-injection tests / definition of done

Tests must invoke extracted production functions or the approved persistence implementation, not a separately rewritten model. Use a disposable in-memory storage adapter; never the user's browser storage.

| Injection / case | Required result |
|---|---|
| History setItem throws while active removal would succeed | Current baseline reproduces loss; fixed implementation retains active and shows error |
| History read throws, JSON is corrupt, or read-back returns stale/different bytes | No overwrite with empty/default history; no active removal |
| Initial availability test succeeds, later quota/write fails | Failure reaches UI and can be retried/exported |
| Intent write fails | No history mutation or active deletion; in-memory export remains available |
| Interrupted after history write, before read-back or active cleanup | Retry recognizes identical ID/payload and completes once |
| Active removal fails after verified history | Saved entry remains once; reconciliation retries only cleanup |
| Repeated finish taps / same ID with conflicting payload | Exactly one entry / explicit conflict, respectively |
| Concurrent cooperating tabs / unsupported lock / old client | Serialized updates / safe refusal / documented rollout boundary |
| Malformed, unsupported, or unsafe import | Zero mutation; text cannot become executable markup |
| Import write or read-back fails at each key; rollback also fails | Verified restoration or retained recovery journal; no success message |
| Import with null versus absent active, kg/lb, mixed record schemas | Explicit deterministic result; fidelity preserved |
| Export read/serialization/download initiation failure | Visible failure, storage unchanged, no false saved-file claim |
| Round-trip with unknown fields and interrupted v3 migration | Lossless supported data; idempotent migration |

DoD: regression demonstrated against the pinned baseline; all focused failure tests and existing 107 release, 57 engine, 23 UI, and 12 reliability checks pass; diff preserves prescription; backup/restore and recovery evidence attached. Physical iPhone storage/download behavior is verified before production promotion. No automatic release or continuation is authorized by this specification.
