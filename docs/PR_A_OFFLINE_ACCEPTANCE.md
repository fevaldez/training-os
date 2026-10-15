# PR-A: offline acceptance and recovery gate

Status: future acceptance checklist only. PR-00 changes no worker, application, artifact builder, release workflow, or release script. Requires separate approval after PR-S1 data-durability work.

Baseline: `27abe8af3b50065fb2e76cc90f7b26ae2602fc42`, release `4.0.0-rc6.2.1`. The previously generated RC6.2.2 ZIP remains unverified and must not be used.

## Source and packaging blockers

- [ ] Account for BOTH unconditional cleanup blocks in `index.html`: reliability-bootstrap unregister/cache deletion at lines 135-136, and repeated async cleanup at line 139. A retained old tab can still execute them. Preserve user data while retiring old clients; removing one block is insufficient.
- [ ] Inventory legacy `rc2.html:53` cleanup and `app.mjs:133` registration. Neither is in today's published artifact. Do not resurrect stale modular code as current production.
- [ ] Replace the dormant `sw.js` design deliberately: it calls skipWaiting/clients.claim, deletes all other origin caches, and precaches assets the current deployment omits. No origin-wide deletion or generic HTML fallback for missing scripts/assets.
- [ ] In a separately authorized release-impact PR, change Pages input filters and the fixed `_site` copy list. Current output is only index.html, version.json, manifest.webmanifest, and four training-os-loop-v1 icons. Merely adding sw.js or pilot files to Git does not publish them. Reliability-test changes alone currently do not trigger Pages.
- [ ] Keep the personal manifest id/start_url/scope `/training-os/` stable. Record expected routes, MIME types, file hashes, and controller scope. No pilot or private source data enters the artifact.
- [ ] Replace reliability assertions that demand unregister/cache deletion with behavior tests; retain the other identity/navigation/data safeguards. Static checks alone do not prove offline behavior.

## Worker state and update contract

- [ ] Document unregistered, installing, installed/waiting, activating, controlled/ready, update-available, install-failed, and recovery states. Show offline-ready only after a complete validated shell and effective controller exist.
- [ ] Cache required assets as a coherent release. Test missing/invalid responses, partial downloads, quota failure, rejected and hanging requests. Never promote an incomplete candidate or overwrite known-good assets with an error response.
- [ ] Cold navigation uses the validated cached shell when offline or the network hangs; network failure cannot leave an indefinite blank screen. A first-ever load without a successful installation is explicitly outside the offline guarantee.
- [ ] An active workout stays on a coherent release. A waiting update does not automatically force takeover/reload; promotion occurs only at an approved safe point after durable session preservation. Test multiple clients and stale cleanup documents.
- [ ] Use owned, versioned cache names; preserve unrelated caches and all localStorage keys. Keep a previous known-good offline-capable release through the recovery window.
- [ ] Test candidate N, candidate N+1, failed N+1 installation, and corrective rollback with the same storage fixtures. Include old installs with no worker, a legacy worker, and RC6.2.1 cleanup code.
- [ ] Root worker handling must not serve personal HTML or cache content for future pilot routes. Shared origin caches/storage remain a privacy boundary limitation even with distinct scopes.

## Physical iPhone gate (external evidence required)

Record device/iOS, app context, candidate commit/release, active controller/cache version, network condition, timestamps, expected/actual result, and data comparison. Use an isolated candidate first; do not remove the existing installed app or clear storage.

- [ ] Export existing data before change; restore to a disposable test context and verify history, active logs/drafts, unit, plan, skipped sets, and timer fidelity.
- [ ] After a verified online install and activation: 10/10 airplane-mode cold launches from Home Screen, including active-session resume and completion/history read.
- [ ] 10/10 cold launches under documented degraded/unavailable network conditions; separately record affected direct-cellular behavior and WARP status. Confirm a cold cached launch rather than a still-resident document.
- [ ] Background/lock across a rest deadline; return, force-close, relaunch, ordinary sets, A→B→rest, skips, cooldown, early finish, and full finish. No loss, duplication, prescription change, or forced navigation.
- [ ] Distinguish Safari and Home Screen storage/controller state. Verify sharing/cancel/copying a technique URL preserves the session; no assumption of shared storage or guaranteed background alarm.
- [ ] Introduce an update while training, an incomplete candidate, and a tested rollback. Session remains usable, safe promotion works, offline launch survives, and data matches.

Any missing field evidence, data loss, unrecoverable launch, changed prescription, or unrelated cache destruction is NO-GO. The 10/10 counts are a bounded acceptance threshold, not a claimed lifetime reliability rate. Carrier/DNS/TLS root cause remains separate; document-side logs cannot observe pre-document failure.

## Fallback and rollback

- [ ] Preserve verified exports, current artifact provenance, and a source-faithful offline workout reference. Wi-Fi/hotspot/WARP are observed workarounds, not a guaranteed repair.
- [ ] Roll back to a tested offline-capable artifact or corrective release without reversing data migrations destructively. Redeploying RC6.2.1 blindly is unsafe: its cleanup can unregister the new worker and delete its caches.
- [ ] Server rollback does not prove installed-client rollback. Verify controller, cache, release, cold launch, and history on the device. Keep recovery available when the network cannot fetch an update.
- [ ] Require reviewed code, automated/browser evidence, physical-device evidence, and explicit production approval. This checklist grants no push, merge, tag, release, or deployment authority.
