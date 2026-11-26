# scrib_ds (spike)

Compiles a design system from another ecosystem into a Flutter widget package and a Scrib adapter.
The spike covers shadcn/ui's Button, Badge and Card (issue #82). The verdict is in [SPIKE.md](SPIKE.md).

```
ingest/sources/*.json ──ingest (Node)──► dsir/ ──bin/emit.dart (Dart)──► generated/shadcn_neutral_ui/
 (pinned registry items)                 (committed,                      (widgets, tokens, goldens,
                                          reviewable)                      scrib/scrib_adapter.dart)
```

| Path | What it is |
|---|---|
| `ingest/sources/` | Pinned snapshots of the shadcn registry items (new-york-v4 Button, Badge, Card; neutral base colours; the style's base layer). Hashes in `dsir/dsir.lock`. |
| `ingest/ingest.mjs` | Parses the TSX with the TypeScript compiler, runs cva and tailwind-merge, maps every Tailwind class (`tailwind.mjs`), and writes the DSIR. An unknown class fails ingest. |
| `ingest/oklch.mjs` | OKLCH to sRGB with CSS Color 4 gamut mapping. |
| `dsir/` | The Design System IR: `shadcn.dsir.json`, DTCG tokens per mode plus a resolver file, and `dsir.lock`. |
| `lib/src/emitter.dart`, `bin/emit.dart` | DSIR to Flutter. Pure and formatted with the pinned dart_style, so the output is byte-identical. |
| `templates/package/` | Hand-written primitives copied verbatim into the output: `DsStyle`, `DsBox` (paints one CSS box), `DsPressable` (hover, focus-visible, press, keyboard, semantics), `DsTheme`, and the oracle test harness. |
| `mappings/shadcn.scrib.json` | How the Scrib adapter contract maps onto the generated components, with every judgment call written down. |
| `ingest/oracle/` | The visual oracle: `reference.mjs` renders the real markup in Chrome, and `compare.mjs` scores each cell against the Flutter goldens. |
| `tool/bolt_check.sh` | Compiles `bolt.tsp`, swaps in the generated adapter, then analyzes and renders every route at 320, 390 and 1280 px. |

## Run it

Node 20 (`ingest/.nvmrc`), Flutter 3.35, and Inter installed (macOS: `/Library/Fonts`).

```sh
cd ingest && pnpm install && pnpm test && pnpm run check   # DSIR tests; dsir/ is up to date
cd .. && dart pub get && dart test                         # emitter tests
dart run bin/emit.dart                                     # writes generated/, copies Inter in
(cd generated/shadcn_neutral_ui && flutter analyze && flutter test)   # goldens match
(cd ingest && pnpm run oracle)                             # Chrome vs Flutter -> build/oracle/report/index.html
tool/bolt_check.sh --baseline && tool/bolt_check.sh        # bolt.tsp before and after the swap
```

To change what is generated, change the source, the mapper or a template, then rerun ingest and emit. Never edit `dsir/` or `generated/` by hand. `pnpm run check` and `dart run bin/emit.dart --check` fail when they are stale.
