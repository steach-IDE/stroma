# shadcn/ui Storybook (pinned)

**In one sentence:** A Storybook of the same shadcn/ui Button, Badge and Card the enricher reads, built to a static site so Stroma's extractor can read it with no network, as it would read a design-system team's own Storybook.

shadcn/ui publishes no Storybook, so Stroma keeps this one. It's what a design system's own repository holds, and its static build is what `docs/usage.md` calls `storybookBuild`.

```sh
pnpm install                 # Node 20.19+
pnpm run check               # the components, globals.css and variants.json match the pinned registry sources
pnpm run build-storybook     # fetches the pinned Inter, writes storybook-static/
pnpm test                    # builds, then checks the index, the controls and a render in both themes
pnpm run dev                 # http://localhost:6006
```

| Path | What it is | Written by |
| --- | --- | --- |
| `src/components/ui/*.tsx` | The registry's Button, Badge and Card, **byte for byte** | `scripts/sync.mjs`, from `packages/enricher-shadcn/sources` |
| `src/globals.css` | shadcn v4's theme and base layer | `scripts/sync.mjs`, with the same builder the oracle's Chrome reference uses |
| `src/variants.json` | Each component's cva variant axes and options | `scripts/sync.mjs`; the stories' controls import it, so they can't drift from cva |
| `src/*.stories.tsx` | Stories: a `Default` per component, icon-only buttons, the badge as a link, and the oracle's three cards | By hand |
| `.storybook/` | Storybook 10 with Vite and Tailwind 4; a `theme` toolbar global toggles shadcn's `dark` class | By hand |

Never edit the synced files; change the pinned sources and run `pnpm run sync`. Storybook telemetry is off (`core.disableTelemetry`).

The components are shadcn/ui's, under the MIT licence (`LICENSE-shadcn.md`).

| What you see | Why | What to do |
| --- | --- | --- |
| `stale: src/components/ui/…` | A synced file was edited, or the pinned sources changed | `pnpm run sync` |
| `run pnpm run build-storybook first` | The tests read the static build | Build first, or run `pnpm test`, which builds |
| `Executable doesn't exist` (Playwright) | Chromium isn't installed | `npx playwright@1.65.1 install chromium` |
