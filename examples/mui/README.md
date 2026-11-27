# Material UI (CSS-in-JS), converted

**In one sentence:** Material UI's Button, read from a pinned Storybook, described as a DSIR, emitted as a Flutter package, and checked against what Chrome drew: the probe for a system whose styles are generated at runtime.

| Path | What it is |
| --- | --- |
| `storybook/` | The pinned `@mui/material` 9.6.0 Storybook the extractor reads ([its README](storybook/README.md)) |
| `inferred/mui.dsir.json` | The DSIR `packages/infer` wrote from the extraction: one component, 100% of 7,344 values explained, no unsupported value, two modes, no colour token |
| `packages/mui_ui/` | The Flutter package `packages/emitter-flutter` writes from it (`dart run bin/emit.dart --example mui`); never edit it by hand |

MIT licence. The package has no fonts: Roboto is not pinned yet (`feat-022`).

## What is different from shadcn and Carbon

- **No colour is a token.** Material UI's colours are per-component variables whose value depends on the `color` prop, so each took several values within a mode. Inference writes each such colour as the literal the browser drew, in a rule conditioned on the variant, and lists the tokens it did that for in its report (`writtenAsLiterals`).
- **The page's colours are measured.** No token names the page background or text colour, so the extractor reads `<body>` per theme and the DSIR holds them as `tokens.page` (`#ffffff` light, `#121212` dark).
- **"No shadow" is a value.** A disabled contained button says `box-shadow: none`; the DSIR says `shadow: []`, or Flutter would paint a translucent fill over the shadow.
- **The component's name is its first class**, `MuiButtonBaseRoot`; `overrides.json` names it `Button` (`stroma-infer --overrides`).
- **432 cells make two sheets per mode**: a sheet holds about 200 cells, so a component with more is split over `name-1`, `name-2`.

## Scorecard

```sh
node packages/extractor/bin/extract.mjs --storybook examples/mui/storybook/storybook-static --out <new dir> --root '.MuiButton-root'
(cd examples/mui/packages/mui_ui && flutter test)
node packages/oracle/compare-extraction.mjs --extraction <dir> --dsir examples/mui/inferred/mui.dsir.json \
  --package examples/mui/packages/mui_ui
```

| Component | Cells | Pass |
| --- | --- | --- |
| Button (3 variants x 6 colours x 3 sizes x rest, hovered, focused, disabled x 2 modes) | 432 | 432 |

The goldens are Linux renders from the `update-goldens` workflow; a macOS render gave the same numbers. Largest difference on a gated check: height 0.5 px, padding 0 px, background dE2000 0, radius 0.19 px (36 of 108 rest cells have a measurable corner).

### What the gates do not cover

| What | Why |
| --- | --- |
| Text width and glyphs | Roboto is not loaded, so Chrome drew the machine's fallback font and Flutter its own; width is reported, not gated, and the extraction depends on the machine (`feat-022`) |
| Corner radius in 72 of 108 rest cells | The box does not stand out from the page (text and outlined buttons), so the pixel measurement has nothing to read |
| Text colour in 42 dark-mode cells | Against Chrome's image, 390 of 432 cells pass the text-colour gate (ΔE 5) and **42 do not**: all are contained buttons in dark mode, whose text is `rgba(0, 0, 0, 0.87)` on a light fill. Flutter's glyph pixel is exactly that colour composited over the fill (an info button: `#051820`, 13% of `#29b6f6`); Chrome's is a neutral `#101010`, darker, which is consistent with Chrome's text rasteriser darkening translucent dark text. The specified colour is reproduced; the difference is the engines' (worst ΔE 10.0) |
| SSIM 0.71 on average | Roboto is not loaded, so each engine draws its own fallback font (`feat-022`) |
| Ripple, elevation transitions | Not drawn by Flutter |
