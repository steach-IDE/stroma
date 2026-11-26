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

Roboto is not loaded (MUI does not ship it and the extractor blocks the network), so text is measured in the machine's fallback font: **a measurement here depends on the machine**. Pinning it is feat-022.
