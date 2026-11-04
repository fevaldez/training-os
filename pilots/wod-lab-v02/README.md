# WOD V0.2 Cloud checkpoint

Entry point: `index.html`, alongside `core.js`. This is repository source, not a deployment. Serve this directory on loopback for review; deployment requires separate owner authorization. V0.1.1 remains byte-preserved in `../wod-lab-v011/`.

## Accepted contract

This implementation uses the owner's V0.2 acceptance list from the Cloud task. No separate approved WOD Library specification was present in the verified pilot branch. Three read-only specialist reviews covered programming, data, and UX/QA; one integrator made all edits.

- UTC Monday identifies a week. Sorted eligible pools rotate by week ordinal. The first publication stores five complete workout snapshots: two distinct strength sessions, one AMRAP, one EMOM (conditioning order alternates), and optional easy recovery. Existing publications survive library/profile edits and imports. Seven bodyweight options supplement the eight unchanged original prescriptions. Every scheduled workout is 8 + 30 + 7 = 45 minutes.
- Equipment defaults to bodyweight only. Requirements are conservative conjunctions; equipment edits affect unpublished future weeks. Missing equipment blocks start, including existing publications. KB step-ups additionally require a stable bench. A pull-up requires a rated, secured bar; the builder offers an explicit dumbbell-row substitution, with distinct saved exercise identity and equipment. A rack is never treated as a pull-up bar. No kipping, improvised anchors or automatic exercise substitution.
- Reusable exercises carry bilingual names, cues and equipment. Custom WODs snapshot ordered prescriptions and exercise identities. Only reviewed WODs built from reusable exercises enter future plans. Free-form legacy/custom workouts remain available without automatic eligibility. The custom main block is fixed at 30 minutes.
- Weekly goals count completed matching published slots once: strength 2, endurance 2, consistency 4; optional recovery is separate. Partials and legacy sessions remain visible but receive no invented adherence credit. Session minutes alone are not physiological improvement. AMRAP rounds and EMOM completed minute targets compare only complete matching prescriptions and exact user-reported scaling/load context. Context locks after the first measurement; measurements without context are not comparable. Strength compares the best external kg for the same exercise, reps, variant and workout across complete sessions, never between sets within one session.
- New-session phase ledgers reconcile with guided time across pause/next/skip/cool/finish. Historical V0.1.1 phase ledgers are preserved without inventing missing elapsed time.

## Storage and recovery

The application retains `training-os.wod-lab.v0`, `version: 1`, and adds `schemaVersion: 2`. Unknown fields, legacy custom WODs, history and current session snapshots survive migration. Before any primary write, the exact prior bytes are saved once to `training-os.wod-lab.v0.pre-v02` and read back. Primary writes also require readback verification. No FV keys, caches or storage are deleted.

A lifetime same-origin Web Lock permits one V0.2 writer tab. Other tabs are read-only with recovery export. Stale/uncooperating writes are detected before a write; malformed or unsupported source data blocks writes. Keep V0.1.1 closed while using V0.2 because that legacy version does not participate in the writer lock. Returning from a back-forward cache after releasing the lock requires reload.

Export includes the current session, full state, locale and original migration backup. Import explicitly merges distinct history/custom/exercise IDs and preserves unknown fields. Identical reimports are idempotent. Conflicting same-ID records, active sessions or unknown fields reject the import without replacement. Competing weekly plans are archived in `archivedPlans`, retaining destination publications and full incoming metadata; source migration backups are retained in `sourceBackups`. Destination equipment, optional-day preference and settings remain local. Imported sessions from a different archived prescription do not credit destination plan slots.

To migrate between HTTPS origins: export from the original origin, keep that file, open the destination, then import. V0.1.1's own exporter omitted active sessions; to preserve an active V0.1.1 session, run V0.2 on that original origin and export there first. An already stripped legacy file cannot reconstruct an omitted session. Browser tests simulate the origin boundary using two independent loopback origins; no new HTTPS deployment was authorized or used.

On failure, keep the original file/tab, export recovery (raw primary, pre-V0.2 bytes and memory state), and reload before retrying. Never clear storage. If two active sessions or conflicting record IDs prevent import, keep both exports and finish/save the active sessions or reconcile the conflict before importing again. Original raw backups also remain available in the JSON envelope.

## Reproducible focused checks

```sh
node pilots/wod-lab-v02/core.test.cjs
PLAYWRIGHT_MODULE=/path/to/playwright BROWSER_EXECUTABLE=/path/to/chromium node pilots/wod-lab-v02/browser.test.cjs
```

Browser tooling is external to the repository; no runtime dependency installation or paid service is required. Tests use synthetic storage in disposable contexts. `core.test.cjs` uses the Node test API; run it directly so all named cases are reported. Existing repository suites run unchanged. See `docs/wod-lab/STATUS_CURRENT.md` for the observed results and limits.
