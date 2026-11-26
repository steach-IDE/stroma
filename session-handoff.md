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

`feat-010`, the CLI: `npx @steach/stroma` running init, extract, review, emit and verify as `docs/usage.md` describes, exposing what Phase 2 added (the coverage report, the font report, overrides, the pixel comparison). Then `feat-011` (the Dart CLI) and `feat-012` (the Docker image). `feat-024` (stacked inset rings and outlines: the focused Carbon button and tile) and `feat-020` (layout values) are the oracle's remaining findings. **The branch stack is long** (#47, #49, #51 and this one are all open and stacked): merge them in order before starting `feat-010`. Open the issue first; run `.github/scripts/work-gate.sh` before pushing.
