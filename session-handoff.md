# Session handoff

## Current objective

`feat-008`, Carbon. Slices 1 to 5 (#25 to #29) are done locally and not pushed. Carbon passes 780/780 on macOS goldens; the Linux run is what is left.

## Completed this session

- `examples/carbon/storybook`: pinned `@carbon/react` 1.121.0 and `@carbon/styles` 1.120.0; Button, Tag, Tile and ClickableTile stories with Carbon's own axes; four themes.
- The extractor takes `--root <css selector>`; the shadcn extraction is unchanged.

## Verification evidence

| Check | Command | Result |
| --- | --- | --- |
| Extraction | `extract.mjs --storybook examples/carbon/storybook/storybook-static --out <dir> --root '.cds--btn, .cds--tag, .cds--tile'` | 784 cells, 4 stories, 83 s |
| Determinism | two runs, `diff -r` | identical |
| No match | `--root '.cds--nothing'` | exit 1, names the story |
| Baseline | `./init.sh` | see the PR |

## Slice 2 (issue #26)

- `stroma-infer` on the Carbon extraction: valid DSIR, 3 components, 100% of 14,304 values explained, modes `white`/`g10`/`g90`/`g100`.
- The extractor now records the root's `class`; the schema's `mode` is any string; `py` stays set when only the bottom padding differs (`pb` overrides).
- Slice 1's preview did not switch themes (`GlobalTheme` is context only); fixed with `Theme` and a test.

## Slice 3 (issue #27)

- The emitter writes a package for the Carbon DSIR (`examples/carbon/inferred/carbon.dsir.json`): four token sets, `t.mode` rules, generated oracle builder and 780 cells; `flutter analyze` clean.
- shadcn re-emitted: analyze clean, oracle 426/426 and 36/36. CI's Linux goldens are the real check of that.
- Not done: IBM Plex fonts (the Carbon package has none, and its text falls back), and the oracle run itself.

## Slice 4 (issue #28)

- Plex pinned: `tool/fetch-plex.sh` (TTF from the 1.1.0 release, hashes in `tool/fonts.sha256`); the Storybook declares the same release's woff2.
- The extractor blocks outside requests and lists them (`blocked`). The Carbon extraction is byte-identical with the CDN reachable and without it.
- The emitter copies the DSIR family's font files and licence; the generated oracle test now names components under `$component` (Carbon's Tag has an axis called `type`).
- The Carbon package's 12 sheets (`btn`, `tag`, `tile` x 4 themes) run under `flutter test` and write `build/oracle/flutter/*.json`.

## Slice 5 (issue #29)

- `packages/oracle/compare-extraction.mjs` (+ `pixels.mjs`): Carbon's Flutter cells vs the extraction. 780/780; negative control fails one damaged cell alone.
- `emit --example carbon` writes the committed `examples/carbon/packages/carbon_ui`; `tool/pin-fonts.sh` pins its font.
- Two causes found by the first run (0/780): `min-block-size` heights were not counted by inference; `children` slots ignored a cell's text in the generated builder.
- Scorecard and `unsupported`: `examples/carbon/README.md`.
- **Open:** the Carbon package has no Linux goldens, so CI's `flutter test` on Linux fails until the `update-goldens` workflow has run on the pushed branch (push needs the user's go-ahead; the classifier denied it earlier).

## Findings for the next slice (some now done)

- Carbon's tokens are `var(--cds-button-primary, #0f62fe)`: a fallback after the name. Infer must read that form, and the hover rule names a different token (`--cds-button-primary-hover`).
- Four themes (`white`, `g10`, `g90`, `g100`), where the DSIR and emitter assume `light` and `dark`.
- Infer finds components by `data-slot`; Carbon has none, so it needs the root's class (`cds--btn`) as the component name.
- Carbon's stylesheet loads IBM Plex from a CDN: pin the fonts like Inter (`tool/fetch-fonts.sh`) before any oracle run.
- The oracle's browser side comes from the shadcn enricher; Carbon's must come from the extraction itself.

## Next session startup

1. Read `AGENTS.md`, `feature_list.json`, `progress.md` and this file; run `./init.sh`.

## Recommended next step

With the user's go-ahead, push `feat/25` to `feat/29`, open the PRs in order, run `gh workflow run update-goldens.yml --ref <branch>` on the last one, pull the goldens, re-run `compare-extraction.mjs`, and mark `feat-008` done. Then `feat-009`, the Phase 1 verdict.
