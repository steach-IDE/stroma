# Scrib adapter

**In one sentence:** Maps a generated package onto [Scrib](https://github.com/steach-IDE/scrib)'s `Scrib*` widget contract, so a Scrib sketch can render with a converted design system.

```sh
SCRIB_DIR=~/scrib tool/bolt_check.sh --baseline   # Scrib's Bolt example, unchanged
SCRIB_DIR=~/scrib tool/bolt_check.sh              # the same with the generated adapter swapped in
```

| Path | What it is |
| --- | --- |
| `mappings/shadcn.scrib.json` | Which Scrib variant maps to which shadcn variant. Every judgment call (accent → default, status badges as outline plus a dot, circle buttons delegated) is written down here |
| `tool/bolt_check.sh` | Compiles Scrib's `bolt.tsp`, swaps in the adapter, runs `flutter analyze`, and renders every route at 320, 390 and 1280 px |

The emitter reads the mapping and writes the adapter into the generated package's `scrib/` folder. A Scrib app copies it in as `lib/design_system/adapter.dart`, with Scrib's own Shadcn adapter beside it as `shadcn_adapter.dart`.

Two known gaps, both on the Scrib side:

- The adapter must be copied into the app, because Scrib's contract types are generated inside each app. A published Scrib contract package would remove the copy.
- The base adapter's icon lookup is private. The bolt check appends a public alias to its copy (marked `shortcut:` in the script).
