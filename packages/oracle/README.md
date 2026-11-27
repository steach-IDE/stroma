# Oracle

**In one sentence:** Compares each browser render with the Flutter golden of the same cell, gates on geometry and colour, and writes the scorecard.

```sh
pnpm install                                   # Node 20
(cd ../enricher-shadcn && pnpm run reference)  # browser side -> .stroma/oracle/chrome
(cd ../../examples/shadcn-neutral/packages/shadcn_neutral_ui && flutter test)   # Flutter side
pnpm run compare                               # -> .stroma/oracle/report/index.html, exit 1 if a gate fails
```

**Gates per cell:** height, padding and corner radius within ±1 px; background colour within ΔE2000 < 2. Width, text colour and SSIM are reported, not gated, because Chrome and Flutter anti-alias text differently. The token check compares every colour token with culori's conversion and with Chrome's own pixel (ΔE < 1).

Today it reproduces the spike: **426/426 cells and 36/36 tokens** for shadcn's Button, Badge and Card, light and dark.

Corner radius is read from anti-aliasing along the corner's diagonal, so it is only measured where the box stands out from the page (45 of 426 cells).

The token check still reads shadcn's source theme (marked `shortcut:` in `compare.mjs`); it becomes generic when the extractor measures tokens (`feat-005`).

| What you see | Why | What to do |
| --- | --- | --- |
| `flutter has no cell …` | The Flutter geometry is older than the cell list | Run `flutter test` in the example package first |
| Low SSIM on focused badges | Chrome draws its own focus outline on links; Flutter has none | Expected, and listed in the DSIR's `unsupported` |

## Comparing with an extraction

Where there is no Chrome reference sheet (Carbon), `compare-extraction.mjs` reads the extractor's output instead: the extraction holds Chrome's computed styles and box for every cell.

```sh
node compare-extraction.mjs --extraction <dir> --dsir <dsir.json> --package <generated package> [--out summary.json]
```

Same gates as above: height, padding (border plus padding, from the extraction's style) and corner radius within ±1 px, background within ΔE2000 < 2 (a transparent background is composited over the page token, as the Flutter sheet paints it). Width is reported only. Cells match by id (`btn.primary.lg.rest.white`) and mode; a component that holds two stories (Tile and ClickableTile) matches each by whether the story is interactive. A cell that fails is listed in the summary's `failures`, grouped by component and check, with its worst case; the exit code is 1.

Where the extraction holds `<cell>.png` (the extractor saves one per cell), the comparator also reads **pixels**, so it no longer compares Flutter only with the numbers the rules were mined from:

| Check | How | |
| --- | --- | --- |
| Text colour | The glyph pixel furthest from the background, in Chrome's image and in Flutter's golden, ΔE2000 | **Gated at 5**: thin glyphs antialias differently in the two engines, so the tolerance is wider than the 2 for a flat fill |
| SSIM | Mean SSIM of the two images over the root's box plus a 6 px margin, on luma | Reported, per cell and per component |

A Flutter cell is matched to the story that draws the same thing (a cell with an icon to a story whose root has one), so shadcn's Button and Badge go through the same path as Carbon and Material UI. A damaged golden is caught: with one cell's text painted red, 779 of 780 Carbon cells passed and that cell alone failed (white against red, ΔE 45.8).

`pixels.mjs` holds the pixel helpers both comparators use.
