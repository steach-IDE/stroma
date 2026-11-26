# Session handoff

## Current objective

Phase 0: done except `feat-002` (decisions). Next is Phase 1.

## Completed this session

- `feat-004` (issue #5): the spike's code and its 8 commits are in Stroma, renamed to their final paths with `git filter-repo`.
  - `packages/emitter-flutter` (renamed `stroma_emitter`): the CLI takes `--dsir`, `--mapping`, `--out`, `--fonts`.
  - `packages/enricher-shadcn`: now writes DSIR 0.2, validated by `packages/dsir`.
  - `packages/oracle`, `packages/adapter-scrib` (the bolt check needs `SCRIB_DIR`).
  - `examples/shadcn-neutral`: the DSIR and the generated package.
- `./init.sh` also checks `examples/*/packages/*`. CI installs Flutter 3.35.4.

## Verification evidence

| Check | Command | Result | Notes |
| --- | --- | --- | --- |
| Baseline | `./init.sh` | passed | dsir 10/10, emitter 5/5, enricher 5/5, example: analyze + 9/9 |
| Parity | re-emit from the 0.2 DSIR | generated package unchanged | `git status` clean under it |
| Oracle | `pnpm run reference` then `pnpm run compare` | 426/426 cells, 36/36 tokens | worst token dE 0.7015, as in the spike |
| No fonts | `./init.sh` with `fonts/` moved out of the repo | green; tests skipped with a message | what CI sees |

## Files changed

`packages/{emitter-flutter,enricher-shadcn,oracle,adapter-scrib}/**`, `examples/shadcn-neutral/**`, `docs/spike/**`, `init.sh`, `.github/workflows/ci.yml`, `.gitignore`, `README.md`, the state files.

## Decisions

See `progress.md`: filter-repo with renames; `examples/shadcn-neutral`; primitives stay as templates; CI skips goldens until fonts are pinned.

## Blockers

None. `feat-002` needs the maintainer's choices.

## Next session startup

1. Read `AGENTS.md`, `feature_list.json`, `progress.md` and this file.
2. Run `./init.sh` (Node 20, pnpm, Flutter 3.35 on PATH; Inter in `/Library/Fonts` for the goldens).

## Recommended next step

`feat-002` (issue #3) so CI can run the goldens and `feat-008` has its second design system. Then `feat-005`, the render-based extractor.
