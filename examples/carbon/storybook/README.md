# Carbon Storybook (pinned)

**In one sentence:** A Storybook of IBM Carbon's Button, Tag and Tile, built from a pinned `@carbon/react`, so Stroma's extractor can read a second design system (SCSS and CSS-variable tokens, not Tailwind) with no network.

Carbon's hosted Storybook (react.carbondesignsystem.com) can't be pinned, so Stroma keeps this one, as it keeps the shadcn one. The stories have the same axes as Carbon's own.

```sh
pnpm install                 # Node 20.19+
pnpm run build-storybook     # writes storybook-static/
pnpm test                    # builds, then checks the index, the controls and a render
node ../../../packages/extractor/bin/extract.mjs --storybook storybook-static --out <new dir> \
  --root '.cds--btn, .cds--tag, .cds--tile'
# extracted 784 cells from 4 stories
```

Carbon marks no part with `data-slot`, `data-part` or `data-scope`, so the extractor needs `--root`: a selector for the component's root.

| Path | What it is |
| --- | --- |
| `src/*.stories.tsx` | Button (`kind` x `size`, `disabled`), Tag (`type` x `size`), Tile and ClickableTile, written by hand |
| `.storybook/preview.tsx` | Carbon's precompiled stylesheet and a `theme` toolbar global over its four themes (`white`, `g10`, `g90`, `g100`) |
| `LICENSE-carbon` | Carbon's Apache-2.0 licence |

Pinned: `@carbon/react` 1.121.0 and `@carbon/styles` 1.120.0 (the version it resolves to). Storybook telemetry is off.

## What the first extraction shows

- Four themes, not light and dark: 784 cells (Button 672, Tag 96, Tile 16).
- Tokens arrive with a fallback, `var(--cds-button-primary, #0f62fe)`; `packages/infer` reads that form.
- The preview wraps stories in `Theme`, not `GlobalTheme`: the latter only sets React context, so all four themes rendered the same until a test caught it (`each theme changes how a tile looks`).
- Fonts: Carbon's stylesheet asks for IBM Plex from a CDN. The pinned fonts for the oracle are not done yet, so measurements here depend on the font that loads.

| What you see | Why | What to do |
| --- | --- | --- |
| `no component root … nothing matches` | `--root` matches nothing in that story | Fix the selector, or the story |
| `run pnpm run build-storybook first` | The tests read the static build | Build first, or run `pnpm test` |
