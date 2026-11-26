# Session handoff

## Current objective

Phase 1 is done. Phase 2: `feat-019` and `feat-021` (issues #39, #41) are done; the Material UI Button passes the oracle (432/432).

## Completed this session

- `feat-007` to `feat-009`: shadcn from the inferred DSIR (oracle 426/426, 36/36), Carbon through extract, infer, emit and verify (780/780), and the verdict (go).
- `packages/infer/bin/intent-loss.mjs` prints what rendering lost, against a source-derived DSIR.

## Verification evidence

| Check | Command | Result |
| --- | --- | --- |
| Baseline | `./init.sh` | green |
| Intent loss | `node packages/infer/bin/intent-loss.mjs --inferred examples/shadcn-neutral/inferred/shadcn.dsir.json --source examples/shadcn-neutral/design-system/shadcn.dsir.json` | colour tokens 23/23, radius values 6/6, radius names 0/6, roles 7/9 |

## Blockers

None.

## Next session startup

1. Read `AGENTS.md`, `feature_list.json`, `progress.md`, `docs/phase-1-verdict.md` and this file; run `./init.sh` (Node 20.19+ on PATH).

## Recommended next step

`feat-018`, DSIR overrides for names (`MuiButtonBaseRoot` to `Button`, `Btn` to `Button`, `radius-minus2` to `radius-md`, roles and slot kinds), kept when re-inferred; an override naming something that does not exist must fail naming it. Then `feat-017` (a Chrome crop per cell), `feat-022` (fonts that did not load) and `feat-010` (the CLI). Open each issue first, and run `.github/scripts/work-gate.sh` before pushing: CI rejects a commit subject over 72 characters.
