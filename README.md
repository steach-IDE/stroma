# Stroma

**In one sentence:** Stroma compiles a web design system into a native Flutter package. It renders every component in a browser, measures what it draws, emits Flutter widgets from those measurements, and proves the widgets match.

> **Status: pre-alpha. There is nothing to install yet.** The approach has been tested once, in a spike that converted three shadcn/ui components (see [What exists today](#what-exists-today)). This repository is being set up for Phase 1, which tests the general idea. Read [the roadmap](#roadmap) before you plan around Stroma.

In biology, the stroma is the supporting tissue an organ's working cells sit in. Stroma is the layer that lets a design system work in a framework it was never written for.

---

## Why Stroma exists

Teams with a mature web design system (shadcn/ui, MUI, Mantine, Chakra, Carbon, or their own) that want a Flutter app have two options today:

1. **Port it by hand.** That takes months, and from the day it ships the two versions drift apart.
2. **Translate the source.** Existing tools convert JSX syntax or style props. They don't carry over how a component looks in every state, how it lays out, or how it behaves, so the result needs the same hand work.

A converter written per library does not scale either. Every design system styles components differently (Tailwind classes, CSS-in-JS recipes, CSS modules, SCSS), and each converter breaks when its library refactors.

What every web design system has in common is the browser: it ends up as DOM and computed CSS. Stroma starts there.

---

## How Stroma works

```
 Design system           Extractor                 DSIR                 Flutter emitter
 (Storybook or    ──►    renders each story   ──►  committed,      ──►  pure: the same DSIR
  npm package)           in headless Chrome,       reviewed like        gives byte-identical
                         forces hover/focus,       code                 output, every run
        ▲                measures, diffs                ▲                       │
        │                       │                       │                       ▼
   Enrichers (optional)         │              Primitives (hand-written,   Flutter package
   read the source for          │              keyed by WAI-ARIA pattern)  widgets, tokens,
   real names and intent        │                                          fonts, goldens
                                ▼                                                │
                             Oracle  ◄───────────── goldens ────────────────────┘
                             browser render vs Flutter: ±1 px, ΔE under 2
                                │
                                ▼
                             Scorecard: converted, partial, unsupported (with the reason)
```

1. **Extract.** The extractor reads a Storybook's stories and their controls (the variant axes: variant, size, disabled). It renders each one in headless Chrome, forces hover and focus through the DevTools protocol, and records computed styles, geometry, and the CSS rules that matched. The `var(--primary)` references in those rules turn raw colours back into named tokens.
2. **Describe.** The result is a **DSIR** (design-system intermediate representation): versioned JSON holding tokens, ordered style rules, anatomy, and a behaviour pattern per component. A person reviews it and commits it.
3. **Emit.** The emitter turns the committed DSIR into a Flutter package. It is pure code with no model in the loop, so the same DSIR always gives the same bytes. Styles are generated. Behaviour (keyboard, focus, overlays, semantics) comes from hand-written primitives, one per WAI-ARIA pattern, shared by every design system.
4. **Verify.** The oracle renders the Flutter goldens for the same cells and compares them with the browser. A design system counts as converted when its scorecard passes, not when it compiles.

---

## Core ideas

### 1. Ingest what teams already have
A published Storybook or package. Stroma never asks a team to re-describe its design system in a new format.

### 2. The browser is the ground truth
What a component renders to is the specification, whatever styling technology produced it. Source parsers (**enrichers**) can add names and intent, but the render decides what is correct.

### 3. Nothing is dropped silently
Every style, state or behaviour Stroma can't translate is listed in the DSIR's `unsupported` array with a reason, and shows on the scorecard.

### 4. Extraction may be fuzzy; emission is pure
Extraction, and an LLM if one is used, only proposes a DSIR. A person reviews and commits it. From a committed DSIR, output is deterministic.

### 5. Style is generated, behaviour is hand-written
Interaction patterns are written once, tested with real keyboard and pointer input, and reused by every design system.

### 6. Output looks hand-written
Readable widgets with no runtime dependencies. Each generated style line names the rule it came from.

---

## Using Stroma (planned)

Three ways in, the same commands and byte-identical output:

```sh
npx @steach/stroma init                 # Node 20+
dart pub global activate stroma         # Dart 3.9+; then: stroma init
docker run --rm -v "$PWD:/work" ghcr.io/steach-ide/stroma verify   # CI: everything pinned
```

A team runs `init`, `extract`, `review`, `emit` and `verify`, then commits the DSIR, the scorecard and the generated package. [`docs/usage.md`](docs/usage.md) has the full design: what each install path needs, what lands in your repository, how to customise the output, and how to stay in sync.

---

## What exists today

The spike ran inside [Scrib](https://github.com/steach-IDE/scrib) (`packages/scrib_ds`, issue #82). It parsed shadcn/ui's source directly, which is the part Stroma replaces with rendering.

| Area | Result |
| --- | --- |
| Tokens (OKLCH to sRGB, DTCG files) | 36/36 within ΔE 0.70 of Chrome's own pixels |
| Button, Badge, Card | 426/426 rendered cells within ±1 px and ΔE under 2, light and dark |
| Determinism | Two runs of ingest and emit gave byte-identical output |
| Integration | Scrib's Bolt example ran on the generated widgets at 320, 390 and 1280 px |
| Behaviour (dialogs, menus, focus traps) | Not tested |
| Layout under pressure (an input in a row, scroll axes) | Not tested |

That code now lives here, with its history (see [Repository layout](#repository-layout)); the oracle reproduces the same 426/426 and 36/36. Its shadcn parser is the first enricher.

---

## Repository layout

| Path | Language | What it does | Status |
| --- | --- | --- | --- |
| `packages/dsir` | JSON Schema, JavaScript | The DSIR format, its validator and migrations | Exists |
| `packages/emitter-flutter` | Dart | DSIR → Flutter package, with the hand-written primitives as templates | Exists (from the spike) |
| `packages/enricher-shadcn` | JavaScript | Reads shadcn/ui source into a DSIR; renders its reference markup | Exists (from the spike) |
| `packages/oracle` | JavaScript | Compares browser renders with Flutter goldens; writes the scorecard | Exists (from the spike) |
| `packages/adapter-scrib` | JSON, shell | Maps a generated package onto Scrib's widget contract | Exists (from the spike) |
| `examples/shadcn-neutral` | — | shadcn/ui Button, Badge and Card, converted: the DSIR and the generated package | Exists |
| `packages/extractor` | TypeScript, Playwright | Renders Storybook stories and measures them | Planned (`feat-005`) |
| `packages/primitives-flutter` | Dart (Flutter) | The primitives as a package generated code depends on | Planned |
| `packages/cli` | TypeScript (+ a Dart CLI) | `stroma init`, `extract`, `emit`, `verify` | Planned (`feat-010`, `feat-011`) |

---

## Roadmap

Durations are estimates for one engineer, based on the spike.

| Phase | What | About | Gate to pass before the next phase |
| --- | --- | --- | --- |
| 0 · Bootstrap | Repository, licence, CI, DSIR 0.2 schema, spike code moved | 1 week | Spike code moved with its history; CI green |
| 1 · Prove it | Render-based extraction on shadcn/ui and one other design system | 2 weeks | Extracted shadcn passes the spike's gates; how much intent rendering loses is measured |
| 2 · Style | Style-only components, layout linter, the CLI (`npx`, `dart`, Docker) | 3 weeks | 15+ components per system pass; the linter flags an input in a row |
| 3 · Behaviour | P1 patterns: tabs, dialog, checkbox, switch, disclosure | 5 weeks | Real-input tests pass on both systems |
| 4 · Third system | P2 patterns (menus, popovers, select) and a contributor-led port | 5 weeks | A third design system ported with no core changes |

If Phase 1's gate fails, the fallback is per-library enrichers as the main input, and the roadmap is re-planned.

---

## Working on Stroma

Humans and coding agents follow the same path:

1. Read [`AGENTS.md`](AGENTS.md): the startup routine, the rules, and what "done" means.
2. Run `./init.sh`. It checks the harness and every package that exists. If it fails, fix that first.
3. Pick **one** feature from `feature_list.json` whose dependencies are done.
4. Every piece of work starts with a GitHub issue. See [`.claude/rules/git-and-issues.md`](.claude/rules/git-and-issues.md).

---

## Licence

Stroma is licensed under the [Apache License 2.0](LICENSE).

Stroma converts design systems; it does not redistribute them. Packages you generate carry the source design system's licence obligations, and never its name or marks as if official.
