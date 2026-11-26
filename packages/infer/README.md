# Infer

**In one sentence:** Turns an extraction (every Storybook cell, measured by `packages/extractor`) into a DSIR: style rules mined from what the browser drew, tokens from the `var()` references the CSS kept, and anatomy from the DOM.

```sh
node bin/infer.mjs --extraction .stroma/extract --out shadcn.inferred.dsir.json --license MIT \
  --report report.json --compare ../../examples/shadcn-neutral/design-system/shadcn.dsir.json
# inferred 9 components from 834 cells: 100% of values explained
```

`--license` is required: Stroma records the licence of every design system it reads. `--compare` adds a comparison with a source-derived DSIR to the report.

## How it works

1. **Parts.** Every element marked `data-slot` (or `data-part`, `data-scope`) is a part, and each part slot becomes a component (`card-header` → `CardHeader`). A part that is the root of some story is a component of its own (the button in a card's footer), never part of the card. So extract **every** story, or a left-out component is read as a part of another.
2. **Conditions per cell:** the story's variant args, the theme (`mode`), the state, and three facts from the DOM: `hasIcon` (an `svg` child), `interactive` (the part is a link), `hasSlot` (which child parts are present).
3. **Values.** Only properties an author rule declares count, mapped to DSIR style keys. Once any cell declares a property, its computed value counts in every cell, except width and height, which are layout results where nobody declared them. Colours keep their token: `color-mix(in oklab, var(--primary) 90%, transparent)` → `{ token: primary, alpha: 0.9 }`.
4. **Rules** (`src/mine.mjs`), per style key:
   - Try the base value, then single conditions, pairs, and so on, keeping a rule when it fixes cells. A DSIR can only say "hovered" or "has an icon", never "not hovered", so a rule's value is the one shown where those conditions are at rest, and rules are judged on those cells.
   - Then drop every rule the predictions don't need, and mine again until nothing changes.
   - Every cell is checked against the result. What no rule explains goes in the component's `unsupported`, with an example.
5. **Tokens:** colours are read from the recorded variables (light and dark); radii are relative to `--radius` (`radius-minus2`).

## On the example

Full extraction of `examples/shadcn-neutral/storybook`, compared with the DSIR read from shadcn's source:

| | |
| --- | --- |
| Values explained by the rules | 22,708 of 22,708 (100%) |
| Colour tokens the source uses, recovered | all of them, for every component |
| Variants and defaults | match for every component |
| Rules | about half the source's (Button 36 vs 68), since one measured rule can stand for several classes |
| Colour values written as tokens | 82% (the rest are literal colours such as shadows) |
| Radius values written as tokens | 93% |
| Spacing values on the `--spacing` scale | 69% |

What rendering can't recover: radius names (`radius-md` is measured as "`--radius` minus 2px", named `radius-minus2`), and anything the browser never draws in a story.
