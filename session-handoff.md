# Session handoff

## Current objective

`feat-008`, Carbon. Slices 1 (#25) and 2 (#26, infer) are done locally and not pushed; fonts, emit and the oracle are next.

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

## Findings for the next slice (some now done)

- Carbon's tokens are `var(--cds-button-primary, #0f62fe)`: a fallback after the name. Infer must read that form, and the hover rule names a different token (`--cds-button-primary-hover`).
- Four themes (`white`, `g10`, `g90`, `g100`), where the DSIR and emitter assume `light` and `dark`.
- Infer finds components by `data-slot`; Carbon has none, so it needs the root's class (`cds--btn`) as the component name.
- Carbon's stylesheet loads IBM Plex from a CDN: pin the fonts like Inter (`tool/fetch-fonts.sh`) before any oracle run.
- The oracle's browser side comes from the shadcn enricher; Carbon's must come from the extraction itself.

## Next session startup

1. Read `AGENTS.md`, `feature_list.json`, `progress.md` and this file; run `./init.sh`.

## Recommended next step

An issue for the emitter on Carbon's DSIR: themes beyond light and dark (`DsTokens` has `light` and `dark` only), then the pinned IBM Plex fonts, then the oracle's browser side.
