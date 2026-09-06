# QA REPORT — Training OS 4.0.0-rc4

## Current release gates

### Static / artifact integrity
18 / 18 PASS

### Training-engine behavior
12 / 12 PASS

Executed against the training engine extracted from the actual RC4 `index.html`.

Covers:
- kg/lb canonical round trip
- 4-phase CPEP mapping
- standalone shoulder sequence
- superset A/B ordering
- zero-rest partner transition
- rest after completing the pair
- timestamp timer elapsed-time math
- +2.5% progression gate
- -2.5% miss/RIR0 rule
- maintain-load rule
- completion accounting
- video + tempo + Pro Tip completeness

### Release automation
PASS
- workflow YAML parses
- release.sh shell syntax
- bump_version.py syntax
- validate_release.py syntax
- test_engine.js executes against current index
- one-command release was separately simulated end-to-end against a local bare Git remote:
  version bumped, SHA recalculated, validation passed, commit created, tag created, main pushed, remote main verified, remote tag verified.

## External dependency reduction
CI validation has zero PyPI/runtime package dependencies. PNG dimensions are read directly from the PNG header.

## Browser/device limitation
A headless Chromium E2E attempt was made at a 430×932 mobile viewport, but this environment blocks browser navigation to localhost (`ERR_BLOCKED_BY_ADMINISTRATOR`). Therefore real Safari/iPhone execution remains a field acceptance gate rather than a claimed automated pass.

## Promotion gate
Do not call RC4 stable until:
1. GitHub Actions deploy is green on the real repository.
2. public `version.json` and page marker report RC4.
3. iPhone smoke: start → capture → complete → rest controls → next → close/reopen.
4. one complete real workout finishes with no P0/P1 issue.
