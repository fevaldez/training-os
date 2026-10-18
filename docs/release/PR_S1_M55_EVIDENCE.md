# M5.5 — second isolated QA Preview receipt

Status: **GO for targeted physical QA; one additional publication complete. Production NO-GO.** M5-01 automated PASS, physical pending; M5-02 UNKNOWN. This receipt grants no further deployment or release authority.

- Actual immutable Preview: [https://training-os-pr-s1-bvwfy5e7g-valcan.vercel.app/training-os/](https://training-os-pr-s1-bvwfy5e7g-valcan.vercel.app/training-os/). Use the trailing slash and this unique deployment hostname, never a mutable alias.
- Source: `c23f7cdd21b895c0aed3a6da49ea02da27d25aad`; build ID `pr-s1-m5-c23f7cdd21b895c0aed3a6da49ea02da27d25aad`; release label remains `4.0.0-rc6.2.1`.
- Existing project: `training-os-pr-s1-qa` / `prj_M0HJcEQBmyGGbkzVBEeMdNhwQpjd`, Valcan.
- Deployment: `dpl_FKDaxaMZFt3Ty1YyRXyjMrTQTTb7`; [provider receipt](https://vercel.com/valcan/training-os-pr-s1-qa/FKDaxaMZFt3Ty1YyRXyjMrTQTTb7).
- Actual classification: **Preview — API `target:null`, OIDC environment `preview`**, READY. Created `2026-10-16T21:34:02.617000+00:00`; READY `2026-10-16T21:34:05.136000+00:00`.
- [Structured verification](evidence/m55/verification.json) and [brief synthetic browser screenshot](evidence/m55/browser-smoke.jpg).

## Preflight and the single request

Exact Git F and parent C were checked. [PR #4](https://github.com/fevaldez/training-os/pull/4) remained OPEN/DRAFT at F with [exact-head CI success](https://github.com/fevaldez/training-os/actions/runs/38961446777). Existing authentication succeeded without a login attempt; Valcan Owner permission and the existing QA project were verified. One existing READY deployment was identifiable: M4/C. Main B and PR #2/C were unchanged.

The [official API](https://vercel.com/docs/rest-api/deployments/create-a-new-deployment) specifies omitted request target as Preview and returned null as Preview. Vercel’s [merged first-deployment notice](https://github.com/vercel/vercel/pull/17206) explains the first project deployment is assigned production and subsequent deployments default to Preview. Preflight confirmed this project already had READY M4 as its production target. This resolved the first-deploy constraint before upload; no test deployment was made.

A fresh external package was created at `/private/tmp/training-os-pr-s1-m55-c23f7cd`. The existing helper is pinned to old C and was **not run unchanged**: it was imported only in a disposable process, its in-memory `SOURCE` set to full F and `BUILD_ID` set to `pr-s1-m5-` plus F. The existing exact-blob, file-mode, B-ancestor, version/index hash, manifest path, external-directory and eight-file verification logic was reused. Its committed bytes and all candidate bytes remained unchanged. Seven regular Git blobs from F were copied byte-for-byte under `training-os/`; only root provenance JSON was regenerated deterministically. No release number bump or HTML injection occurred.

Exactly **one** `POST /v13/deployments` sent those eight base64-inlined files, existing project ID and non-sensitive source/build metadata. Request target was omitted; no production flag, `gitSource`, alias, custom environment, settings/build-machine override or promotion was requested. An exclusive attempt marker prevented a second create; there was no automatic retry. The project listing changed from one to exactly two deployments, M4 and M5.5. Subsequent calls were reads only.

## Privacy, permissions and cost

Only the seven approved application files and regenerated provenance were uploaded. No tests/fixtures, notes, exports, browser state, real history, credentials, environment values or other repository files entered the upload. Synthetic browser data was created locally after publication, never included in hosted assets.

Valcan Owner membership remains verified. The existing plan remains **Pro / active / no add-ons**; project configuration is unchanged, with basic/fixed build resources. **Zero new paid services**, upgrades, integrations, storage products or analytics activation were requested. Existing-plan metered usage is distinct from adding a paid service. The project has zero environment variables, no Git link/autodeploy, integrations, password/SSO protection or feedback toolbar. No project, billing, domain or production alias mutation was made.

## Exact delivered bytes

All **8/8** independent unauthenticated HTTPS fetches matched the fresh package and pinned source/provenance hashes:

| Served file | Bytes | Expected = observed SHA-256 | Result |
|---|---|---|---|
| `/preview-provenance.json` | 1139 | `133bbff47e9218532befd6fa1f9c5fd1e924f6626540d9d56a79ba32d5bbecd6` | PASS |
| `/training-os/index.html` | 153713 | `492315931392f2244276d4b41e3991b5b0ba619dca07e5406b82f305c4a36ac5` | PASS |
| `/training-os/manifest.webmanifest` | 708 | `6516991bc5de27d6431bc7849e772d6e02131741d458f533e214c71a38ae4162` | PASS |
| `/training-os/training-os-loop-v1-1024.png` | 866242 | `dc2a0c826857dbcfa0a2fb5942787e8ebae5174ccf647f3f56a7ba9bea7b97c8` | PASS |
| `/training-os/training-os-loop-v1-180.png` | 34324 | `8fe31c9fe94619e41ccebbbf88010bbc53571ff8e6585c03b657d0ef630bb234` | PASS |
| `/training-os/training-os-loop-v1-192.png` | 38310 | `1e985f8e487ba7a2076ec33f4388bf2ba6c1e6dbe2bab2dedb460c9f0519566c` | PASS |
| `/training-os/training-os-loop-v1-512.png` | 231912 | `00f7eda1245cc441b71d6e577a9537fb8d4937335848d08c3890fe90a1b1fb83` | PASS |
| `/training-os/version.json` | 267 | `98d558f05cc6337fa7b4b85068a258a86bc0d90477625b6da9129a176c2d5251` | PASS |

`version.json.index_sha256` equals the actual HTML hash above. Provenance source/build ID and seven embedded asset hashes match F and the package. The source files were not rebuilt or transformed by the host.

## Route, origin and browser results

Validation at `2026-10-16T21:34:49.116407+00:00`: **20/20 HTTP checks PASS** (8 new assets, two new launch paths, two missing paths, eight original M4 assets).

- Required `/training-os/`: 200, `text/html`, exact F HTML. All eight assets: direct 200, expected HTML/JSON/manifest/PNG MIME, no redirect. The slashless path also returns 200, but use `/training-os/` so relative manifest links resolve correctly.
- Missing `/training-os/does-not-exist.js` and `/training-os/sw.js`: actual 404, no HTML fallback. No worker file is published.
- Asset/document cache headers: `public, max-age=0, must-revalidate`; `X-Robots-Tag: noindex`. TLS certificates validated; no Authorization or cookies sent. Public access is proved by fetches, not an API visibility flag.
- Dedicated origin `https://training-os-pr-s1-bvwfy5e7g-valcan.vercel.app`, distinct from both M4 and production `https://fevaldez.github.io`; no cross-origin redirect.
- Brief Chromium `145.0.7632.6` smoke in a fresh disposable 390×844 context, synthetic fixture state only: boot `ok`, secure context, Web Locks available, same-origin manifest, **zero worker registrations**, zero page errors or cross-origin requests. Empty load + 8 reps rejected without RAM/disk change; positive 20 kg completed and saved. The explicit-zero control was visible. No full suite, audit or physical-device test was repeated. Screenshot records the expected weight error.

## M4 and production preservation

Original [M4 immutable URL](https://training-os-pr-s1-nphf0td5s-valcan.vercel.app/training-os/) still serves all **8/8 original recorded hashes**, including original HTML `cc3284cb5eaf41778e0f8fcda86352cf85ab1d41b816d57f7e9e0ad7efbad5b3` and C provenance. M4 remains READY, target production inside the dedicated QA project. Read-only alias lookups and project target comparison confirm both `training-os-pr-s1-qa.vercel.app` and `training-os-pr-s1-qa-valcan.vercel.app` still bind `dpl_2HkzDYDSVFvmeoJq1upj7eB8NDU4`. M5.5 has no aliases. The Training OS production origin/source, workflows and settings were untouched.

## Owner handoff and stop

**M5.5 GO** for the [exact three-minute owner iPhone check](PR_S1_QA_MATRIX.md#m55-three-minute-owner-iphone-check), repeated separately in Safari and Home Screen on this new URL. Record device/iOS/browser and synthetic screen evidence. M5-01 automated PASS does not replace physical zero/reload/history/export/restore acceptance. M5-02 stays UNKNOWN; no rendering fix or physical PASS is claimed. Remaining full D01–D10, independent code acceptance, offline/backup/old-client/deployment-control/rollback and explicit release gates remain open; **production NO-GO**.

Evidence changes are documentation only on Draft PR #3. PR #2, PR #4, candidate runtime, main and M4 remain unchanged. No merge, Ready, tag, release, Pages change/dispatch, production deployment or PR-A work occurred. Stop after this single publication and documentation push; any further upload needs new explicit authorization.
