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
