# Session handoff

## Current objective

Phase 1: the render-based extractor (`feat-005`). Its input, a pinned shadcn Storybook (`feat-015`), is done.

## Completed this session

- `feat-015` (issue #13): `examples/shadcn-neutral/storybook`.
  - Storybook 10.6.9, React 19.3.1, Vite 8.3.8, Tailwind 4.3.5, all pinned exactly.
  - Components, `globals.css` and `variants.json` synced from `packages/enricher-shadcn/sources`; `pnpm run check` catches drift.
  - Stories: Button (`Default`, `IconOnly`), Badge (`Default`, `AsLink`), Card (`Full`, `WithAction`, `ContentOnly`, 360 px like the oracle).
  - `theme` global (light/dark) toggles shadcn's `dark` class.
- `packages/enricher-shadcn/globals-css.mjs`: the one `globals.css` builder for the Chrome reference and the Storybook.
- CI installs Playwright's Chromium (1.65.1); `./init.sh` scans `examples/*/storybook/`.

## Verification evidence

| Check | Command | Result | Notes |
| --- | --- | --- | --- |
| Baseline | `./init.sh` | passed | Storybook: sync check, build, 5/5 tests |
| Controls | test reads `__STORYBOOK_PREVIEW__.storyStore.loadStory(...).argTypes` | equal to the registry cva config | the same call `feat-005` will use |
| Oracle | `pnpm run reference` + `pnpm run compare` | 426/426, 36/36 | after moving `globals.css` into its own module |

## Files changed

`examples/shadcn-neutral/storybook/**`, `packages/enricher-shadcn/{globals-css,reference}.mjs`, `init.sh`, `.github/workflows/ci.yml`, `.gitignore`, `examples/shadcn-neutral/README.md`, the state files.

## Decisions

See `progress.md`: Stroma's own shadcn Storybook; synced from the pinned sources; telemetry off.

## Blockers

None. The first-ever local Storybook build failed once and passed on every rerun; watch CI for it.

## Next session startup

1. Read `AGENTS.md`, `feature_list.json`, `progress.md` and this file.
2. Run `./init.sh` (Node 20.19+, pnpm, Flutter 3.35, Playwright's Chromium).

## Recommended next step

`feat-005`, `packages/extractor`:
- Serve `storybook-static/` and read `index.json`.
- Get each story's `argTypes` through `storyStore.loadStory`.
- Render each story x variant x state x theme (`iframe.html?id=…&args=…&globals=theme:…`, hover and focus forced through the DevTools protocol).
- Record computed styles, geometry, `CSS.getMatchedStylesForNode` (with `var()` references) and ARIA attributes, written deterministically.
