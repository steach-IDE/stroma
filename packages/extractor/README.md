# Extractor

**In one sentence:** The extractor renders every cell of a Storybook (story × variant × state × theme) in headless Chromium and records what the browser drew: computed styles, geometry, the CSS rules that matched with their `var()` tokens, and ARIA semantics.

```sh
pnpm install   # Node 20.19+, Playwright's Chromium (npx playwright@1.65.1 install chromium)
node bin/extract.mjs --storybook ../../examples/shadcn-neutral/storybook/storybook-static --out .stroma/extract
# extracted 834 cells from 8 stories into .stroma/extract
```

Options: `--story <id>` (repeatable) to extract some stories, `--where <arg>=<value>` (repeatable) to keep some variant combinations, and `--root <css selector>` for a design system that marks no parts (Carbon: `--root '.cds--btn, .cds--tag, .cds--tile'`). The output folder must be empty or absent; the extractor never deletes anything.

## What it reads

Nothing here knows about any particular design system. Everything comes from the Storybook and the DOM:

| What | Where it comes from |
| --- | --- |
| Stories | The build's `index.json` |
| Variant axes | Each story's `argTypes` that have `options`, read through Storybook's own story store |
| Themes | The items of a `theme` global's toolbar (none: one unthemed pass) |
| States | `rest`; `hovered` and `focused` (forced through the DevTools protocol) when the root is interactive; `disabled` when the story has a `disabled` control |
| The component's root | The first element in the story marked `data-slot`, `data-part` or `data-scope` (shadcn, Ark and Chakra mark their parts this way), or the first match of `--root` |

Cells are set through Storybook's preview channel (`updateStoryArgs`, `updateGlobals`), the way its own UI does: **Storybook ignores `args` in the iframe URL.** After each render the extractor checks the args and theme Storybook actually holds, and stops if they differ, so a cell is never measured under the wrong label.

## What it writes

`<out>/<story id>/<theme=…,axis=…,state=…>.json`, one per cell, and `<out>/index.json` listing them. A cell, trimmed:

```json
{
  "story": "button--default", "theme": "light", "args": { "size": "default", "variant": "default" }, "state": "rest",
  "elements": [{
    "tag": "button", "role": "button", "text": "Button",
    "attrs": { "data-size": "default", "data-slot": "button", "data-variant": "default" },
    "box": { "x": 0, "y": 0, "w": 75.844, "h": 36 },
    "style": { "height": "36px", "padding-left": "16px", "border-top-left-radius": "8px", "background-color": "oklch(0.205 0 0)" },
    "rules": [
      { "selector": ".h-9", "at": ["@layer utilities"], "decls": [["height", "calc(var(--spacing) * 9)"]] },
      { "selector": ".bg-primary", "at": ["@layer utilities"], "decls": [["background-color", "var(--primary)"]] }
    ],
    "vars": { "--primary": "oklch(20.5% 0 0)", "--spacing": "0.25rem" }
  }]
}
```

- `elements` is the root and every element under it, in document order. `box` is relative to the root.
- `style` holds a fixed list of computed properties (`src/measure.mjs`).
- `rules` holds the **author** rules that matched, in cascade order, with declarations as written, so `var(--primary)` survives. Browser defaults are left out; they're already in the computed style.
- `vars` gives the computed value of every custom property those rules reference, following `var()` inside values. That's how a raw colour gets its token name back.

Output is deterministic: sorted keys, numbers rounded to 0.001, no timestamps or paths, and CSS transitions finished through the DevTools Animation domain rather than by waiting. Two runs over the same build give byte-identical files.

## What can go wrong

| What you see | Why | What to do |
| --- | --- | --- |
| `<story>: no component root in #storybook-root …` | Nothing in the story is marked `data-slot`, `data-part` or `data-scope` | Mark the component's root part (or extend `ROOT_SELECTOR` for your design system's convention) |
| `<story>: Storybook rendered variant=…, not …` | Storybook refused an arg value | Check the story's `argTypes` options |
| `… is not empty; use a fresh directory` | The output folder already holds files | Pass a new `--out` |
| `Executable doesn't exist` | Playwright's Chromium isn't installed | `npx playwright@1.65.1 install chromium` |

Not covered yet: pseudo-elements (`::before`, `::after`) and stories that render into portals outside `#storybook-root`.
