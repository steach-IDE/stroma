# Session handoff

## Current objective

`feat-008`, Carbon. Slices 1 to 4 (#25 to #28: Storybook, infer, emit, fonts) are done locally and not pushed; the oracle is next.

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

## Findings for the next slice (some now done)

- Carbon's tokens are `var(--cds-button-primary, #0f62fe)`: a fallback after the name. Infer must read that form, and the hover rule names a different token (`--cds-button-primary-hover`).
- Four themes (`white`, `g10`, `g90`, `g100`), where the DSIR and emitter assume `light` and `dark`.
- Infer finds components by `data-slot`; Carbon has none, so it needs the root's class (`cds--btn`) as the component name.
- Carbon's stylesheet loads IBM Plex from a CDN: pin the fonts like Inter (`tool/fetch-fonts.sh`) before any oracle run.
- The oracle's browser side comes from the shadcn enricher; Carbon's must come from the extraction itself.

## Next session startup

1. Read `AGENTS.md`, `feature_list.json`, `progress.md` and this file; run `./init.sh`.

## Recommended next step

The oracle's browser side for Carbon: the extraction (`.stroma/carbon-*`) already holds each cell's box and style, so compare Flutter's geometry (`build/oracle/flutter/*.json`, cell ids like `btn.primary.lg.rest.white`) with it instead of a Chrome reference page, at the same gates (1 px, dE2000 under 2). Colour needs a pixel from a Chrome screenshot or the computed colour. Then CI goldens, then the scorecard and the `unsupported` list.
