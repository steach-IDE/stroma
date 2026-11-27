# Phase 1 verdict

**Go.** Render-based extraction works on the two design systems tried: a Storybook goes in, a Flutter package comes out, and the oracle (a browser against Flutter) passes every cell of every component tried, with no per-library parser. It is a go for Phase 2, with the conditions and the unproven parts below.

Written for the maintainers of Stroma, who decide what Phase 2 is.

## What was tried

| | shadcn/ui | IBM Carbon |
| --- | --- | --- |
| Styling | Tailwind v4 utility classes | SCSS, global classes, CSS custom properties |
| Input | A pinned Storybook (`examples/shadcn-neutral/storybook`) | A pinned Storybook (`examples/carbon/storybook`, `@carbon/react` 1.121.0) |
| Components | Button, Badge, Card (9 components with its parts) | Button, Tag, Tile |
| Cells measured | 834 (8 stories) | 784 (4 stories, 4 themes) |
| Values the mined rules explain | 22,708 of 22,708 | 14,416 of 14,416 |
| Oracle | 426/426 cells, 36/36 tokens | 780/780 cells |
| Largest difference at a gate | height 0 px, padding 0.01 px, background dE2000 0.37, radius 0.75 px | height 0 px, padding 0 px, background dE2000 0.32, radius 0.35 px |

The gates are the spike's: height, padding and corner radius within 1 px, background within dE2000 2. Both runs use Linux goldens from CI.

The shadcn oracle compares Flutter with a Chrome page rendered from the component's own source markup, a different route to the browser than the extraction, so it is independent of what was mined. The Carbon oracle compares Flutter with the extraction itself (Chrome's computed styles), which is the data the rules were mined from: it shows the emitted code reproduces the measurements, not that the measurements are right. See "Not proven".

Scorecards: [shadcn](../packages/oracle/README.md) (`pnpm run reference` then `compare`), [Carbon](../examples/carbon/README.md#scorecard) (with its `unsupported` list). To reproduce either from a clean checkout, follow the commands in those two files; both end in `./init.sh`, which is what CI runs.

## What rendering lost: the intent-loss figure

Measured by `packages/infer/bin/intent-loss.mjs`, which compares the DSIR inferred from shadcn's renders with the DSIR read from shadcn's source (the only system that has both):

```sh
node packages/infer/bin/intent-loss.mjs \
  --inferred examples/shadcn-neutral/inferred/shadcn.dsir.json \
  --source examples/shadcn-neutral/design-system/shadcn.dsir.json
```

| Fact in the source-derived DSIR | Recovered from renders |
| --- | --- |
| Colour tokens a component uses (by name) | 23 of 23 (100%) |
| Radius references, same pixel value | 6 of 6 (100%) |
| Radius references, same token name | 0 of 6 (0%): `radius-md` is measured as "`--radius` minus 2", named `radius-minus2` |
| Variant axes and options | 9 of 9 (100%) |
| Component roles | 7 of 9 (78%): a badge reads as a `link`, a card as no role |
| Slot kinds | 7 of 9 (78%) |
| The class behind a rule (`hover:bg-primary/90`) | 0%: 131 source rules, 65 inferred; one measured rule can stand for several classes |

Colour and radius values written as named tokens: shadcn 82% and 93%, Carbon 64% and none (Carbon has no radius scale and its sizes are `rem` literals, so none of its spacing is a token either).

In short: **values and colour tokens survive rendering; names and semantics do not** (and an overrides file, `stroma-infer --overrides`, gives them back: with shadcn's 3-component, 2-radius-step file the same script reports radius names 6 of 6 and roles 9 of 9 on the committed DSIR; the 0 of 6 and 7 of 9 above are from renders alone). What is lost is what a person would write in a review ("this is the `md` radius", "this is a status"), not what a user would see. That loss is acceptable for an emitter whose output is checked against the browser, and it is exactly what Phase 2's overrides and Phase 5's reviewed proposals are for.

## Conditions on the go

1. **The Storybook decides what can be seen.** The extractor describes what a story draws: shadcn's Badge had no icon slot until a story drew an icon, and Carbon's ClickableTile is only visible through its own story. Phase 2 needs a coverage report (which axes, slots and states no story exercises), not a silent gap.
2. **A real second source for the oracle.** The Carbon oracle was circular in the sense above. This is done (`feat-017`): the extractor saves a Chrome image per cell, and every system is compared with pixels (text colour gated, SSIM reported), which found a defect the gates could not see (`feat-023`).
3. **Names need a home.** Component names came from class names (`cds--btn` is `Btn`) and radius names are relative. The DSIR's override file has to exist before a team is asked to commit a DSIR.

## Not proven

- **Two systems, six components, all style-only.** Behaviour (focus, keyboard, overlays) comes from hand-written primitives and was not extracted. Compound components were hand-specified for the oracle: shadcn's card examples are written by hand.
- **Only CSS custom properties.** Tailwind and SCSS both leave `var()` references in the matched rules. A system whose styles are generated at runtime (Chakra, Fluent: CSS-in-JS) may leave none, and token recovery would then depend on something else. This is the largest open question.
- **Fit by construction.** "100% of values explained" means the mined rules reproduce the cells they were mined from; the cells are every combination of every axis, so there is no unseen cell inside a story, but a design system's cells outside its stories are not tested.
- **What the gates do not see.** Text colour, glyph shapes, shadows and focus rings are compared by neither oracle (SSIM is reported for shadcn, not gated). Width is reported, not gated; Carbon's tile fills its container in Chrome and the DSIR cannot say so (Flutter: 55 px against 1216 px).
- **Radius is only measurable where the box stands out from the page** (45 of 426 cells for shadcn, 157 of 268 rest cells for Carbon).
- **Linux only.** Goldens are Linux renders; macOS differs by 1 to 2% of pixels.

## Phase 2, re-planned

The roadmap's Phase 2 ("Style: style-only components, layout linter, the CLI") stands, with the findings put first:

1. **Packaging the path that works:** `npx @steach/stroma` (and the Dart CLI) running extract, infer, emit and verify as one pipeline: `feat-010`, `feat-011`.
2. **Close the three conditions:** a coverage report; a Chrome crop per cell and a pixel comparison for every system; the DSIR override file for names.
3. **Probe the open question early:** extract one CSS-in-JS system (Chakra UI v3 or Fluent UI v9) before building more on `var()` recovery. If it fails, the fallback in the README (per-library enrichers) applies to that class of system only.
4. **Broaden within the proven approach:** 15 or more style-only components per system, and "fill the width" (and the other layout values the Carbon tile showed) in the DSIR.
5. **The layout linter** as planned.

Phases 3 to 5 are unchanged until Phase 2's probe says whether CSS-in-JS systems are in scope.
