# M4 — isolated Vercel QA deployment evidence

Status: **DONE — exactly one isolated QA deployment, verified 2026-10-16.** Production remains NO-GO. No independent N1/N2 or physical-iPhone PASS is claimed.

- Actual preview: [https://training-os-pr-s1-nphf0td5s-valcan.vercel.app/training-os/](https://training-os-pr-s1-nphf0td5s-valcan.vercel.app/training-os/)
- Dedicated HTTPS origin: `https://training-os-pr-s1-nphf0td5s-valcan.vercel.app`, distinct from production `https://fevaldez.github.io`.
- Source: `54e25199e33b8cc725d86881b950bb68b4cf0cd4`; build ID `pr-s1-54e25199e33b8cc725d86881b950bb68b4cf0cd4`.
- Project: `training-os-pr-s1-qa`, `prj_M0HJcEQBmyGGbkzVBEeMdNhwQpjd`, existing Valcan team.
- Deployment: `dpl_2HkzDYDSVFvmeoJq1upj7eB8NDU4`; [Vercel deployment receipt](https://vercel.com/valcan/training-os-pr-s1-qa/2HkzDYDSVFvmeoJq1upj7eB8NDU4). Created 2026-10-16 18:52:15.823 UTC; READY 18:52:19.336 UTC.
- Full structured results: [verification.json](evidence/m4/verification.json). Browser proof: [desktop launch screenshot](evidence/m4/browser-launch.jpg).

## Authorization, permissions and billing

The owner explicitly authorized this project and exactly one public, non-sensitive immutable QA publication in the existing conversation. Existing local Vercel authentication returned HTTP 200; confirmed Owner membership on the existing Valcan team. No login or new credential was attempted.

The existing team plan was Pro/active before and after; billing add-ons remained absent. No subscription, plan upgrade, add-on, storage service, integration, enhanced build machine or application function was requested. Project resources are basic/fixed; no environment variables, Git connection, password/SSO protection or preview toolbar were configured. Vercel allocates analytics identifiers automatically, but no paid analytics activation, instrumentation script or add-on was requested; delivered HTML remains byte-identical. This statement concerns new services, not a guarantee about future metered usage under the existing plan.

One project-create request and **one deployment-create request** succeeded. The project's deployment listing contained exactly one entry. The deployment used only the already verified eight-file directory `/private/tmp/training-os-pr-s1-preview-54e2519`, inlined as exact base64 file bytes via `POST /v13/deployments`, with source/build metadata. No `gitSource`, Git autodeploy, package installation, app build command or added configuration file was used. Preparation tests and Gate 0/G2/G3 were not repeated.

## Provider target classification

The deployment request omitted `target` (the [documented default is preview](https://vercel.com/docs/rest-api/deployments/create-a-new-deployment)). Vercel nevertheless returned **`target: production`** for the first deployment of this new dedicated QA project and assigned its default QA aliases. That provider classification is preserved in the receipt. The new project is solely the isolated QA host; existing Training OS production on GitHub Pages, its workflows, domain and source were not modified. No promotion request or second deployment was made to change the classification.

Use only the unique deployment URL above for QA. The automatically assigned aliases `training-os-pr-s1-qa.vercel.app` and `training-os-pr-s1-qa-valcan.vercel.app` are mutable and must not be used as immutable acceptance evidence. No future content replacement or additional deployment is authorized.

## Delivered validation

Validation completed 2026-10-16 18:53:21.851 UTC. **12/12 HTTP checks PASS**, including **8/8 exact SHA-256/MIME comparisons**. Requests sent no Authorization header or cookies; HTTPS certificates were validated. The required route and all eight files responded directly, with no redirects. The final origin stayed on the unique Vercel host and differed from production.

| Served file | Bytes | Observed SHA-256, equal to uploaded bundle | Result |
|---|---|---|---|
| `/preview-provenance.json` | 1136 | `872b8f08d7483e9fcdc4d62f8f9d9458d0d4b5d2dcd5b68e697b00fbc8f6f936` | PASS |
| `/training-os/index.html` | 152100 | `cc3284cb5eaf41778e0f8fcda86352cf85ab1d41b816d57f7e9e0ad7efbad5b3` | PASS |
| `/training-os/manifest.webmanifest` | 708 | `6516991bc5de27d6431bc7849e772d6e02131741d458f533e214c71a38ae4162` | PASS |
| `/training-os/training-os-loop-v1-1024.png` | 866242 | `dc2a0c826857dbcfa0a2fb5942787e8ebae5174ccf647f3f56a7ba9bea7b97c8` | PASS |
| `/training-os/training-os-loop-v1-180.png` | 34324 | `8fe31c9fe94619e41ccebbbf88010bbc53571ff8e6585c03b657d0ef630bb234` | PASS |
| `/training-os/training-os-loop-v1-192.png` | 38310 | `1e985f8e487ba7a2076ec33f4388bf2ba6c1e6dbe2bab2dedb460c9f0519566c` | PASS |
| `/training-os/training-os-loop-v1-512.png` | 231912 | `00f7eda1245cc441b71d6e577a9537fb8d4937335848d08c3890fe90a1b1fb83` | PASS |
| `/training-os/version.json` | 267 | `8f318a6439aef2245c55a66e3a454dd6ac67e9020ad3db00f331fce7e2c8af74` | PASS |

- `/training-os/`: 200, `text/html`, exact candidate HTML hash; canonical manifest launch path preserved.
- `/training-os`: also 200 with the same HTML bytes; QA must use the slash-terminated URL so relative manifest/asset links resolve under `/training-os/`.
- `/training-os/does-not-exist.js` and `/training-os/sw.js`: 404, text response; no HTML fallback and no worker was published.
- Served cache policy: `public, max-age=0, must-revalidate`; responses also carried `X-Robots-Tag: noindex`. Public access was verified directly, not inferred from API `public` metadata.
- Browser smoke: Codex in-app browser displayed the default application at the exact route; `data-boot=ok`, `data-release=4.0.0-rc6.2.1`, manifest `./manifest.webmanifest?v=4.0.0-rc6.2.1`. No real data, synthetic import, workout acceptance or physical-device test was performed.

## Scope and next physical-iPhone action

Only the existing release-readiness Draft PR #3 receives these documentation/evidence updates. Main remains `b82218dbc05662124821d1d6c27369ae717dd767`; PR #2 remains Draft at C. No merge, Pages dispatch, tag, production workflow/settings/runtime change or PR-A work occurred.

Device QA should now open [https://training-os-pr-s1-nphf0td5s-valcan.vercel.app/training-os/](https://training-os-pr-s1-nphf0td5s-valcan.vercel.app/training-os/) on a physical iPhone in Safari, record the exact model/iOS build/Safari version and final origin, and import only the pinned synthetic fixture via **Progreso → Importar**. Execute D01–D10 in [PR_S1_QA_MATRIX.md](PR_S1_QA_MATRIX.md), saving raw comparisons/screenshots and a parsed downloaded backup restored in a second disposable context. Then add this same preview through Share → Add to Home Screen and repeat the relevant rows, confirming the launch origin. Do not touch production storage, caches or its installed icon. Offline cold launch is still UNKNOWN/expected fail before separately authorized PR-A. Independent N1/N2 (M2) and physical acceptance (M5) remain pending; production is NO-GO.
