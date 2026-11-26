# Carbon (IBM), converted

**In one sentence:** IBM Carbon's Button, Tag and Tile, read from a pinned Storybook, described as a DSIR, emitted as a Flutter package, and checked against what Chrome drew.

| Path | What it is |
| --- | --- |
| `storybook/` | The pinned `@carbon/react` 1.121.0 Storybook the extractor reads ([its README](storybook/README.md)) |
| `inferred/carbon.dsir.json` | The DSIR `packages/infer` wrote from the extraction: 3 components, 100% of 14,304 values explained, four modes |
| `packages/carbon_ui/` | The Flutter package `packages/emitter-flutter` writes from it (`dart run bin/emit.dart --example carbon`); never edit it by hand |

Carbon is Apache-2.0; IBM Plex Sans is SIL OFL 1.1 (the pinned font, `tool/fetch-plex.sh`).

## Scorecard

Chrome's side is the extraction (its computed styles for each cell); Flutter's is the generated package's geometry and golden. Gates as for shadcn: height, padding and corner radius within 1 px, background within dE2000 2.

```sh
node packages/extractor/bin/extract.mjs --storybook examples/carbon/storybook/storybook-static --out <new dir> \
  --root '.cds--btn, .cds--tag, .cds--tile'
(cd examples/carbon/packages/carbon_ui && flutter test)
node packages/oracle/compare-extraction.mjs --extraction <dir> --dsir examples/carbon/inferred/carbon.dsir.json \
  --package examples/carbon/packages/carbon_ui
```

| Component | Cells | Pass |
| --- | --- | --- |
| Btn (7 kinds x 6 sizes x rest, hovered, focused, disabled x 4 themes) | 672 | 672 |
| Tag (8 types x 3 sizes x 4 themes) | 96 | 96 |
| Tile (rest, hovered, focused x 4 themes) | 12 | 12 |

Largest difference on a gated check: height 0 px, padding 0 px, background dE2000 0.32, radius 0.35 px. A negative control (one Flutter height damaged by 3 px) fails that cell alone, 779 of 780.

**Which run.** The goldens are Linux renders from the `update-goldens` workflow (the platform CI compares on); Flutter's geometry is from `flutter test` on the same package. A macOS render of the goldens gave the same numbers.

### What the gates do not cover (`unsupported`, with the reason)

| What | Why |
| --- | --- |
| Tile's width: Chrome 1216 px, Flutter 55 px | A block-level box fills its container in Chrome. The DSIR has no "fill the width" value, so Flutter sizes to its content. Width is reported, not gated, for every design system |
| Corner radius in 111 of 268 rest cells | The box does not stand out from the page (ghost and outline buttons and tags, a tile in its own colour), so the pixel measurement has nothing to read. Where it can be measured (157 cells) it passes |
| ClickableTile at rest (4 cells) | The DSIR holds Tile and ClickableTile as one component; the Flutter cells for it at rest are the plain tile's, so the clickable story is matched at hovered and focused only |
| Text colour, SSIM, glyph shapes | Not compared: there is no Chrome image of the extraction. The two engines rasterise text differently anyway |
| Carbon's other components, sizes in `rem` as a scale, spacing tokens | Out of scope: Button, Tag and Tile only. Carbon's sizes are `rem` literals, so none of them is recovered as a spacing token (0%) |
