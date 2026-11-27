# CSS-in-JS probe

**Verdict: in scope.** The whole pipeline now runs on a CSS-in-JS system's Button (Material UI, Emotion) and the oracle passes it (432 of 432 cells; [scorecard](../examples/mui/README.md)). The probe's first run found that its named tokens came out wrong rather than missing; inference now writes those colours as literals (`feat-021`, issue #41), and the DSIR holds the page colours it could not find in a token. Systems that keep their tokens in CSS custom properties (Chakra UI v3, Fluent UI v9) look like shadcn and Carbon, which already pass; that is shown below from their CSS, not by running them through the pipeline.

Written for the maintainers of Stroma, to decide what Phase 2 builds. Issue #39, `feat-019`.

## What was tried

Material UI's Button, default theme (`examples/mui/storybook`, `@mui/material` 9.6.0): 3 variants x 6 colours x 3 sizes x 2 palette modes x 4 states = 432 cells.

| Step | Result |
| --- | --- |
| Extract | Works: 432 cells. **First run recorded no CSS at all** (a bug, below) |
| Infer | A valid DSIR: 1 component, 7,308 of 7,344 values explained (99.5%); the 36 it cannot explain are the button's shadows in 36 cells, listed in `unsupported` |
| Tokens | 6 colour tokens, **all six wrong** (below) |
| Emit | Fails, loudly: `no page background token`, since the only tokens are private component variables |

```sh
node packages/extractor/bin/extract.mjs --storybook examples/mui/storybook/storybook-static --out <new dir> --root '.MuiButton-root'
node packages/infer/bin/infer.mjs --extraction <dir> --out mui.dsir.json --license MIT --report report.json
# report.json: fit (values explained) and tokenShare (colour 56%, radius 0%, spacing 0%)
```

## What the probe found

1. **The extractor lost every CSS-in-JS rule (fixed here).** Emotion inserts its rules through the CSS object model, so they have no source text, and the extractor kept a declaration only if it had source text (to skip the longhands a shorthand expands to). All of them were discarded. It now tells the two apart by the rule having a source range. shadcn's and Carbon's extractions are unchanged, and a test covers the case.
2. **A rule from the object model holds longhands.** MUI wrote `border-radius: 4px`; inference saw only `border-top-left-radius` and found no radius. It now knows the radius longhands (fixed here; the other two systems are unchanged).
3. **A token's value can depend on more than the mode (not fixed: a new feature).** MUI v9 does use custom properties, but private ones, set per component by the `color` prop: `--variant-containedBg` is `#1976d2` for `primary` and `#d32f2f` for `error`. Across the 432 cells the six variables take 2 to 12 different values within one mode. The DSIR's token model is name, then mode, then one value, so inference kept the first value seen, and every rule that uses the token would paint the first colour. Before this probe nothing flagged it, because "values explained" is measured on what the browser drew, not on what the tokens resolve to. Inference now lists each such token in `unsupported` (a test covers it); shadcn and Carbon have none.
4. **Names.** The component came out as `MuiButtonBaseRoot` (the first class on the element). DSIR overrides (`feat-018`, done) name it: `examples/mui/overrides.json` makes it `Button`.
5. **A font the page does not load is measured as whatever the machine has.** MUI does not ship Roboto. I first read that as "drawn in a fallback"; the extractor's font report (`feat-022`) shows that on the machine that extracted it Roboto is *installed*, so the text was drawn in the real Roboto, as a system font: right here, and different on a machine without it. The extraction now says so (`fonts`, `source: system`) and the DSIR's font token carries a note.

## Chakra UI v3 and Fluent UI v9

Read from their published Storybooks (a probe, not a pipeline run): the author rules that matched their Button reference custom properties.

| System | Rules | Colour, radius and padding declarations | Referencing a custom property |
| --- | --- | --- | --- |
| Chakra UI v3 | 7 | 8 | 5 (`border-radius: var(--chakra-radii-l2)`) |
| Fluent UI v9 | 1 | 4 | 4 (`background-color: var(--colorNeutralBackground1)`, `padding: 5px var(--spacingHorizontalM)`) |

So both leave the references the extractor recovers tokens from. Not shown: that the whole pipeline passes for them. Fluent's `padding: 5px var(--spacingHorizontalM)` mixes a literal and a variable, a form inference does not read yet.

## What this means for Phase 2

- CSS-in-JS systems are in scope: extraction and inference run on them once the two fixes above are in.
- Before one can be emitted, the DSIR needs tokens that vary by a variant axis, or inference must write such values as literals instead of a token (`feat-021`). The conflict list in `unsupported` is the safety net until then.
- The extractor should report a font that did not load (`feat-022`), so a machine-dependent measurement is visible.
- The next probe should be Chakra or Fluent run end to end, once the above is in, to confirm the custom-property case.

## Update: Material UI through the oracle (`feat-021`, issue #41)

The finding in "What the probe found" 3 is closed by writing a colour as the literal the browser drew where its token held several values in a mode (it is then no token: Material UI's DSIR has none). Getting the Button through emit and the oracle needed four more things, each found by a failing cell, not by reading:

1. **No page tokens.** The emitter found none, so the extractor now measures `<body>` per theme and the DSIR holds `tokens.page`; the emitter turns it into two ordinary colour tokens.
2. **No fonts.** `emit --no-fonts` (Roboto is not pinned; a system font here, see above).
3. **"No shadow" was inexpressible.** The 36 unexplained shadow values were disabled buttons saying `box-shadow: none`. A rule that says so now sets an empty shadow list where a shadow is in play; without it, Flutter painted a translucent fill over a shadow (`#888888` for Chrome's `#e0e0e0`). Inference now explains 100% of the values.
4. **A sheet is one image.** 216 cells per mode overflowed it and the last ones were never drawn (64 false background failures); a component with more than about 200 cells is split over several sheets.

shadcn's and Carbon's DSIRs, packages and oracle results are unchanged by all of it.
