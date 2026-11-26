# Material UI Storybook (pinned)

**In one sentence:** A Storybook of Material UI's Button, built from pinned `@mui/material`, as the probe for a CSS-in-JS system: its styles are generated at runtime by Emotion, so there is no stylesheet for a design token to be read from.

```sh
pnpm install                 # Node 20.19+
pnpm run build-storybook     # writes storybook-static/
node ../../../packages/extractor/bin/extract.mjs --storybook storybook-static --out <new dir> --root '.MuiButton-root'
# extracted 432 cells from 1 stories
```

Pinned: `@mui/material` 9.6.0, `@emotion/react` 11.14.0, `@emotion/styled` 11.14.1. MIT licence. Storybook telemetry is off.

| Path | What it is |
| --- | --- |
| `src/button.stories.tsx` | Button with MUI's own axes: `variant` (3), `color` (6), `size` (3), `disabled` |
| `.storybook/preview.tsx` | MUI's default theme, in a `theme` toolbar global with `light` and `dark` palette modes |

The results, and what they mean for Phase 2, are in [`docs/css-in-js-probe.md`](../../../docs/css-in-js-probe.md).

MUI does not ship Roboto and the extractor blocks the network, so the page does not load it: text is drawn in the Roboto installed on the machine that extracts, a system font, and **a measurement here depends on the machine having it**. The extraction says so (`fonts`, `source: system`), and so does the DSIR's font token.
