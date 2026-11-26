# Flutter emitter

**In one sentence:** The emitter turns a committed DSIR into a Flutter package. It's pure Dart: the same DSIR always gives byte-identical files.

```sh
dart pub get
../../tool/fetch-fonts.sh         # once: downloads and verifies the pinned Inter 4.1 into .stroma/fonts
dart run bin/emit.dart            # writes examples/shadcn-neutral/packages/shadcn_neutral_ui and copies Inter in
dart run bin/emit.dart --check    # exit 1 if the committed package differs, or holds a file no longer emitted
```

Options: `--dsir <file>`, `--mapping <file>` (a Scrib adapter mapping) or `--no-mapping`, `--package <name>`, `--out <dir>`, `--fonts <dir>` (where `Inter-{Regular,Medium,SemiBold}.ttf` are copied from; default the pinned copy in `.stroma/fonts/inter-4.1`). The defaults build the shadcn example from `examples/shadcn-neutral/inferred/shadcn.dsir.json`, the DSIR `packages/infer` wrote from the Storybook (regenerate it with `packages/extractor` then `packages/infer`). The source-derived DSIR in `design-system/` stays as the ground truth it is compared with.

| Path | What it is |
| --- | --- |
| `lib/src/emitter.dart` | DSIR → files: tokens as a `ThemeExtension`, one widget and one style resolver per component, the Scrib adapter, the oracle's cell list |
| `templates/package/` | **Hand-written** code copied verbatim into every package: `DsStyle`, `DsBox` (paints one CSS box), `DsPressable` (hover, keyboard focus, press, semantics), `DsTheme`, and the oracle and behaviour tests |
| `test/` | Determinism, error cases, and a check that the committed example matches what the emitter writes now |

Each generated style line names the rule it came from (`// hover:bg-primary/90`), so a regenerated package reads as a reviewable diff.

The primitives will move to `packages/primitives-flutter` once generated packages depend on them instead of copying them.

| What you see | Why | What to do |
| --- | --- | --- |
| `EmitException: DSIR style key "…" has no Flutter mapping` | The DSIR holds a style the emitter can't print | Teach the emitter the key, and add it to the DSIR schema in the same change |
| `stale: …` from `--check` | The committed package isn't what the emitter writes now | Run `dart run bin/emit.dart` and commit the result. Never edit generated files by hand |
| `missing …/.stroma/fonts/inter-4.1/Inter-Regular.ttf` | The pinned fonts haven't been downloaded yet | Run `tool/fetch-fonts.sh` (or `./init.sh`), or pass `--fonts <dir>` |

## Any design system's DSIR

The emitter makes no assumption about a design system's themes or components:

- **Modes.** `DsTokens` has one const set per mode in the DSIR (`white`, `g10`, `g90`, `g100`, or `light` and `dark`), a `mode` name, and `DsTokens.byMode`. Rules test `t.mode == '<mode>'`. `DsTokens.light` and `dark` always exist for the ambient theme: aliases to the lightest and darkest mode when the DSIR names others. A mode is dark when it is named `dark` or its page background is.
- **Page tokens.** The tokens that paint the page and its text are found by name (`background` or `*-background`; `foreground`, `*-text-primary` or `*-foreground`); with none, the emit fails saying so. (A `shortcut:` in `emitter.dart`.)
- **Names.** `danger--ghost` is `dangerGhost`, and `2xl` is `v2xl`, as Dart identifiers need.
- **The oracle's test.** `test/oracle/build_node.dart` and `cells.json` are generated from the DSIR's components, slots and variant axes. Only shadcn's Button, Badge and Card have hand-written cells, for the card examples.
- **Fonts.** `fontFiles(dsir)` names the files a DSIR needs: its family without spaces, then the weights its rules use (and 400): `Inter-Medium.ttf`, `IBMPlexSans-Regular.ttf`. `emit` copies them, with the licence, from `--fonts <dir>` or, for Inter and IBM Plex Sans, the pinned copy that `tool/fetch-fonts.sh` or `tool/fetch-plex.sh` keeps in `.stroma/fonts`; another family needs `--fonts`. `pubspec.yaml` lists them.
- `scrib/` and `test/pressable_test.dart` are only written when there is a Scrib mapping, and a Button.

```sh
dart run bin/emit.dart --dsir ../../examples/carbon/inferred/carbon.dsir.json --package carbon_ui --no-mapping --out <dir>
```
