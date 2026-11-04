# WOD Lab backlog

Updated: 2026-11-04 UTC. Scope: isolated WOD pilot only.

## Parked by owner

- **Priority Normal / High / Low**: backlog only. No priority fields, controls, ordering or migration were implemented in V0.2.

## Separate authorization or future work

- Physical iPhone Safari/Home Screen acceptance, native storage after device/app closure and real background suspension. Chromium results do not establish these.
- QA Preview or production deployment, domain/origin selection and HTTPS migration acceptance. No deployment is authorized by the V0.2 implementation task.
- Conflict-resolution UI for different active sessions or same-ID edited records; current import safely rejects conflicts and retains both exports.
- Historical V0.1.1 incomplete phase ledgers: retained unchanged; missing time cannot be reconstructed reliably.
- Offline installation/worker support for the WOD pilot. Production offline regression tests cover the unchanged FV application, not this pilot.
