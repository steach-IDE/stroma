# Using Stroma

**In one sentence:** A design-system team points Stroma at its Storybook, reviews the description Stroma extracts, and commits a generated Flutter package that CI keeps in sync with every release.

> **Planned.** None of this exists yet. This page is the design the CLI is built to (`feat-010` to `feat-012` in `feature_list.json`). Where it says "Stroma does", read "Stroma will do".

---

## Who this is for

Stroma is designed first for **the team that owns a web design system** and wants an official Flutter version of it. That team has the rights to its own design system, already publishes a Storybook, and cares most about keeping the two versions in sync, which is where a hand port fails.

App teams converting someone else's design system and tools with their own widget contract (Scrib, through `adapter-scrib`) come next. They use the same commands.

---

## Install

Three ways in, one tool. All three run the same commands, read the same `stroma.config.json`, and **produce byte-identical output from the same DSIR**.

```sh
npx @steach/stroma <command>                      # Node 20 or later
dart pub global activate stroma && stroma <command>   # Dart 3.9 or later
docker run --rm -v "$PWD:/work" ghcr.io/steach-ide/stroma <command>   # for CI
```

What each path needs, per command:

| Command | `npx @steach/stroma` | `dart pub global activate stroma` | Docker image |
| --- | --- | --- | --- |
| `init`, `review` | Node | Dart | Nothing else |
| `emit` | Node | Dart | Nothing else |
| `extract` | Node; Chromium is downloaded on first run | Dart **and** Node (it runs the same extractor) | Nothing else |
| `verify` | Node and the Flutter SDK | Dart, Node and the Flutter SDK | Nothing else |
| `update` | as `extract` + `verify` | as `extract` + `verify` | Nothing else |

Why the split: extraction drives a real browser, which Stroma does from TypeScript, and the emitter is Dart. The npm package ships the emitter compiled to JavaScript, so Node is enough for everything except `verify`, which renders Flutter goldens. The Dart package runs the emitter natively, so a Flutter developer can regenerate the package from a committed DSIR with Dart alone. That is the command they run most.

**Use the Docker image in CI.** It pins Chromium, the Flutter SDK and the fonts, so golden images come out identical on every machine. On a laptop, goldens can differ slightly from CI because fonts and anti-aliasing differ between platforms.

---

## The commands

```sh
stroma init        # asks for the Storybook and the package name, writes stroma.config.json
stroma extract     # renders every story, writes design-system/<name>.dsir.json and dsir.lock
stroma review      # opens a local report: the DSIR, every unsupported item, anything an LLM proposed
stroma emit        # writes the Flutter package from the committed DSIR
stroma verify      # renders the package's goldens, compares them with the browser, writes the scorecard
stroma update      # re-extracts a new upstream version and shows what changed in the DSIR and the scorecard
```

`emit --check` and `verify` exit non-zero when something is stale or a gate fails, so both can guard a pull request.

---

## What lands in your repository

```
stroma.config.json
design-system/
  acme.dsir.json        # the description of your design system: reviewed and committed, like code
  dsir.lock             # the source's version and content hashes, so a rebuild is reproducible
  overrides/            # your corrections to the DSIR (see Customising the output)
  scorecard.md          # what converted, what partly converted, what did not, and why
packages/acme_ui/       # the generated Flutter package
  lib/src/generated/    # owned by Stroma: never edit by hand
  lib/src/custom/       # owned by you: Stroma never writes here
```

Commit all of it. Your Flutter apps depend on `packages/acme_ui` by path, by git, or through pub.dev if your team publishes it. **Stroma never publishes your design system anywhere.**

A minimal `stroma.config.json`:

```json
{
  "source": { "storybook": "https://storybook.acme.dev", "version": "4.2.0" },
  "package": { "name": "acme_ui", "path": "packages/acme_ui" },
  "themes": { "light": {}, "dark": { "className": "dark" } },
  "handWritten": []
}
```

For a private design system, use a local `storybook build` output instead of a URL: `"source": { "storybookBuild": "./storybook-static", "version": "4.2.0" }`. Stroma needs no credentials and makes no network calls to your systems.

---

## Customising the output

Generated files are never edited by hand; `emit --check` fails if one was. Change the output in one of two ways instead:

1. **Correct the description.** Put a file in `design-system/overrides/`, such as a renamed variant, a token Stroma couldn't name, or a corrected padding. Stroma merges it into the DSIR before emitting, and the scorecard lists every override.
2. **Write a component yourself.** List it in `handWritten` and write it in `lib/src/custom/`. Stroma stops generating it, still exports it from the package, and still checks it with `verify`.

Use the first for small fixes and the second for components Stroma can't convert, such as a data grid or a command palette.

---

## Keeping in sync

When your design system releases a new version, run `stroma update` (in CI, through the Docker image). It re-extracts, then shows the DSIR diff and the scorecard diff for review. Commit both with the regenerated package. A component that stops passing its gates fails the run, so drift never reaches your apps unnoticed.

---

## Versions

| What | Version | Rule |
| --- | --- | --- |
| Stroma (npm and pub.dev) | Semantic versioning, one number for both | Both are released from the same tag |
| The DSIR format | `dsirVersion` inside the file | A newer Stroma reads an older DSIR; `update` migrates it |
| Your generated package | Yours | Stroma writes its own version and the DSIR hash into a header comment |

---

## What can go wrong

| What you see | Why | What to do |
| --- | --- | --- |
| `extract` from the Dart CLI says Node is missing | The extractor drives Chrome from TypeScript | Install Node 20, or run that command through the Docker image |
| `verify` fails on your laptop but passes in CI (or the reverse) | Fonts and anti-aliasing differ between platforms | Treat the Docker image's result as the truth |
| A component shows as "partial" on the scorecard | Something in it has no translation | Read its `unsupported` reasons; fix with an override, or mark it `handWritten` |
| `emit --check` fails | A generated file was edited by hand | Move the change into `overrides/` or `lib/src/custom/`, then run `emit` |
| `extract` refuses to run | The source's licence is unknown or forbids derivative work | Confirm you hold the rights (your own design system), or stop |

---

## Not planned

- **A hosted service** (paste a URL, get a package). Possibly after Phase 4.
- **A catalogue of converted design systems.** Each would be a derivative of someone else's work. A catalogue of `stroma.config.json` files, which contain no copied code, may come later.
