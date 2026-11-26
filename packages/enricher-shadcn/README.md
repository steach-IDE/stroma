# shadcn/ui enricher

**In one sentence:** Reads shadcn/ui's registry source (cva variants, Tailwind classes, theme variables) into a DSIR, and renders the same components in Chrome as the oracle's reference.

```sh
pnpm install          # Node 20
pnpm run ingest       # sources/ -> examples/shadcn-neutral/design-system (DSIR 0.2, DTCG tokens, lock)
pnpm run check        # exit 1 if that folder is not what ingest writes now
pnpm run reference    # renders every oracle cell in headless Chrome -> .stroma/oracle/chrome
pnpm test
```

This is the spike's ingest, written before render-based extraction existed. In Stroma's design it becomes an **enricher**: it adds names and intent from source code, while the render (`packages/extractor`, Phase 1) decides what is correct.

| Path | What it is |
| --- | --- |
| `sources/` | Pinned snapshots of the shadcn registry items. Their hashes are in the example's `dsir.lock` |
| `ingest.mjs` | Parses the TSX, runs the real cva and tailwind-merge, maps each class, writes the DSIR. An unknown class fails |
| `tailwind.mjs` | Tailwind class → DSIR style values. Scale values come from the pinned `tailwindcss` theme |
| `oklch.mjs` | OKLCH → sRGB with CSS Color 4 gamut mapping |
| `reference.mjs` | Builds the real shadcn markup and CSS for each oracle cell and renders it with Playwright |

| What you see | Why | What to do |
| --- | --- | --- |
| `unmapped Tailwind class "…"` | shadcn uses a class the mapper doesn't know | Map it in `tailwind.mjs`, or list it as a no-op or unsupported, with a reason |
| `ingest built an invalid DSIR` | The output fails `packages/dsir`'s validator | Fix the mapper; the message names the path |
| `Playwright requires Node.js 20` | An older Node is first on `PATH` | `nvm use 20` |
