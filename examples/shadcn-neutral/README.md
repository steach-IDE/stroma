# Example: shadcn/ui (neutral theme)

**In one sentence:** shadcn/ui's Button, Badge and Card, converted by Stroma, laid out exactly as `docs/usage.md` says a user's repository will be.

```
design-system/                 # the DSIR (0.2), DTCG tokens per mode, dsir.lock
packages/shadcn_neutral_ui/    # the generated Flutter package: never edit by hand
```

To rebuild it:

```sh
(cd packages/enricher-shadcn && pnpm run ingest)   # from the repository root
(cd packages/emitter-flutter && dart run bin/emit.dart)
```

`./init.sh` fails if either is stale. The generated package's tests (goldens and real-input behaviour) need the exact Inter 4.1 files the goldens were rendered with. `./init.sh` fetches them with `tool/fetch-fonts.sh`, which downloads the official release once, checks each file's SHA-256 against `tool/fonts.sha256`, and copies them into `packages/shadcn_neutral_ui/fonts` (gitignored; Inter is OFL and is never committed).

The source is shadcn/ui, under the MIT licence (`packages/dsir/fixtures/shadcn/LICENSE.md`). This example is a test fixture, not an official shadcn/ui package.
