# Session handoff

## Current objective

Phase 1. Phase 0 and `feat-014` are done; next is `feat-005`, the render-based extractor.

## Completed this session

- Restored the spike history and the Phase 1 decisions on `main` (issue #9, PR #10, merged with a merge commit).
- Turned on "delete branch on merge" for the repository.
- `feat-014` (issue #11, PR #12):
  - `tool/fetch-fonts.sh` downloads Inter 4.1 once into `.stroma/fonts`, checks the hashes in `tool/fonts.sha256`, and copies the fonts.
  - The emitter defaults to that copy; `./init.sh` fetches the fonts and runs the golden tests; CI caches the fonts.
  - Goldens are Linux renders from CI, compared on Linux only; the `update-goldens` workflow regenerates them.

## Verification evidence

| Check | Command | Result | Notes |
| --- | --- | --- | --- |
| CI | PR #12 checks | baseline, work rules, all green pass | Clean runner downloaded the fonts and ran the goldens |
| Wrong hash | append a byte to the cached Inter-Medium.ttf, run `tool/fetch-fonts.sh` | exit 1, names the file | Restored afterwards |
| Oracle | `pnpm run reference` + `pnpm run compare` | 426/426 cells, 36/36 tokens | Against the Linux goldens |
| Baseline | `./init.sh` | passed | On macOS the golden image comparison is skipped by design |

## Files changed

`tool/fetch-fonts.sh`, `tool/fonts.sha256`, `packages/emitter-flutter/bin/emit.dart`, the oracle test template (+ the example's copy), the 6 goldens, `init.sh`, `.github/workflows/{ci,update-goldens}.yml`, `AGENTS.md`, READMEs, the state files.

## Decisions

See `progress.md`: Linux goldens; regenerate on CI only; how to merge stacked pull requests.

## Blockers

None.

## Next session startup

1. Read `AGENTS.md`, `feature_list.json`, `progress.md` and this file.
2. Run `./init.sh` (Node 20, pnpm, Flutter 3.35; the first run downloads about 34 MB of fonts).

## Recommended next step

`feat-005`: the render-based extractor (Storybook index + argTypes, render each story x state x theme, record computed styles, geometry, matched CSS rules with `var()` references, and ARIA roles). Start against shadcn's Storybook, so `feat-006` can compare its DSIR with the source-derived one.
