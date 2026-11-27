# Stroma CLI

**In one sentence:** `stroma` turns a committed DSIR into a Flutter package, running the Dart emitter compiled to JavaScript, so **Node alone** is enough: no Dart, no Flutter.

```sh
pnpm install && pnpm run build     # once, with the Dart SDK on PATH: compiles the emitter into dist/
node bin/stroma.mjs init --storybook <url or build folder> --name acme_ui
node bin/stroma.mjs emit           # writes the package from design-system/acme_ui.dsir.json
node bin/stroma.mjs emit --check   # exit 1, naming the file, if a generated file is stale
```

(Published as `@steach/stroma` it is `npx @steach/stroma <command>`; it is not published yet.)

## What works in this version

| Command | Status |
| --- | --- |
| `init` | Writes `stroma.config.json` from flags, or from prompts on a terminal. Refuses to overwrite without `--force` |
| `emit` | Writes the Flutter package from the DSIR; removes files the emitter no longer writes; says which font files the package needs |
| `emit --check` | Exits 1 naming each stale file (edited, missing, or no longer emitted); the guard for a pull request |
| `extract`, `review`, `verify`, `update` | **Not in this version**: they exit 2 saying so (`feat-010`, later slices) |

## `stroma.config.json`

```json
{
  "source": { "storybookBuild": "storybook/storybook-static" },
  "package": { "name": "carbon_ui", "path": "packages/carbon_ui" },
  "dsir": "inferred/carbon.dsir.json",
  "handWritten": []
}
```

Paths are relative to the config file. `dsir` defaults to `design-system/<package name>.dsir.json`; `package.fonts: false` writes a package with no fonts; `scribMapping` adds the Scrib adapter. The three examples (`examples/*/stroma.config.json`) are working configs.

## How the JavaScript emitter is built, and why it can be trusted

`packages/emitter-flutter/web/emit_js.dart` is a small entry point (JSON in, JSON out) that `dart compile js` turns into `dist/emit.js` (about 870 KB, `dart_style` included). dart2js's runtime expects a browser's `self` and `location`, so `src/emitter.mjs` defines both before loading it. The test suite runs `emit --check` in each example, with no Dart on the `PATH`, against the packages the **native Dart emitter** wrote (shadcn 16 files, Carbon 14, Material UI 12): byte-identical, so the two cannot drift unnoticed.

| What you see | Why | What to do |
| --- | --- | --- |
| `the emitter is not built` | `dist/` is a build output, not committed | `pnpm run build` (needs the Dart SDK once) |
| `no stroma.config.json` | Not run from the project folder | `stroma init`, or `--config <file>` |
| `the DSIR … does not exist` | `extract` is not in this version | Put the DSIR at the path the message names, or set `"dsir"` |
| `DSIR style key "…" has no Flutter mapping` | The DSIR holds a style the emitter cannot print | Teach the emitter the key (see `packages/emitter-flutter`) |
