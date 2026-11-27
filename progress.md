# Progress

## Current state

- **Last updated:** 2026-11-26
- **Active feature:** none. Phase 1 is done: `feat-009` (issue #35) wrote the verdict, go. Phase 2 is planned (issue #37); `feat-019` (the CSS-in-JS probe, issue #39) and `feat-021` (variant-dependent colours as literals, issue #41) are done: the Material UI Button passes the oracle (432/432). `feat-016` (coverage report, issue #43) is done. Next: `feat-018` (overrides) and `feat-017` (pixel oracle), `feat-022` (fonts that did not load), then `feat-010` (the CLI); `feat-020` (layout values) beside them. `feat-010` (the CLI) is in progress: `init`, `emit` and `emit --check` run on Node alone (issue #54); `extract`, `review`, `verify` and `update` are next.
- **Code:** `packages/dsir`, `emitter-flutter`, `enricher-shadcn`, `oracle`, `adapter-scrib`, and `examples/shadcn-neutral`.

## Done

- The harness: `AGENTS.md`, `CLAUDE.md`, `feature_list.json`, `progress.md`, `session-handoff.md`, `init.sh`, `.claude/` rules and hook, `.github/` templates and CI.
- The README: purpose, design, spike evidence, planned layout, roadmap.

- `feat-001`: the repository is public with CI; issues #3, #4 and #5 are open.
- `feat-003`: `packages/dsir`, the DSIR 0.2 schema, validator (schema + cross-references) and migration, with the shadcn fixture and 10 tests.
- `feat-004`: the spike's code moved over with its 8 commits and split into packages; the enricher now writes DSIR 0.2; the oracle reproduces 426/426 and 36/36; CI installs Flutter and `./init.sh` checks the example.

- `feat-002`: Carbon, no LLM until Phase 5, pinned font downloads.
- `feat-014`: `tool/fetch-fonts.sh` (Inter 4.1, hash-checked, cached); the golden tests run in CI on Linux.

- `feat-015`: a pinned shadcn Storybook in `examples/shadcn-neutral/storybook`, the extractor's first input.

- `feat-009`: `docs/phase-1-verdict.md`: go, with the intent-loss figure (`packages/infer/bin/intent-loss.mjs`), what was not proven, and Phase 2 re-planned.
- `feat-008`: Carbon's Button, Tag and Tile pass the oracle (780/780 cells on Linux goldens) from a pinned Storybook through extract, infer, emit and verify; unsupported items are listed in `examples/carbon/README.md`.
- `feat-007`: the example package is emitted from the inferred DSIR; the oracle passes 426/426 cells and 36/36 tokens on Linux goldens.
- `feat-005`: `packages/extractor`, 822 deterministic cell files from the example Storybook.

- `feat-006`: `packages/infer` and DSIR 0.3 (anatomy). Rendering recovered every colour token and explains every measured value.

## In progress

Nothing.

## Next

1. Merge PR #16 (`feat-005`) first, then the `feat-006` PR, which GitHub retargets to `main`.
2. `feat-007`: emit Flutter from the inferred DSIR and pass the oracle. Expect emitter work: hasSlot names like `card-action`, colour tokens such as `color-white`, measured radius tokens, and no `globals`.
3. Later, not blocking: reserve the names (npm organisation `steach` for `@steach/stroma`; `stroma` on pub.dev). Deferred by the maintainer on 2026-11-26.

## Blockers and risks

- Phase 1 may show that rendering loses too much intent. The fallback is per-library enrichers as the main input.

## Decisions made

| Date | Decision | Why | Alternatives considered |
| --- | --- | --- | --- |
| 2026-11-26 | The project is called Stroma and lives in its own repository, not in Scrib | It converts any design system; Scrib becomes one consumer through `adapter-scrib` | Keep it as `packages/scrib_ds` in Scrib |
| 2026-11-26 | Render-based extraction is the main input; source parsers are optional enrichers | One extractor works for every web design system; per-library parsers break when their library refactors | One parser per library (the spike's approach) |
| 2026-11-26 | `AGENTS.md` holds the agent instructions; `CLAUDE.md` imports it | Contributors use different coding agents | Only `CLAUDE.md` |
| 2026-11-26 | The repository is public under the steach-IDE organisation | Same home as Aegil and Scrib | A personal account |
| 2026-11-26 | Licence: Apache-2.0 | Permissive, with an explicit patent grant; matches Scrib | MIT (no patent grant) |
| 2026-11-26 | First user: the team that owns a web design system | Owns the rights, already has a Storybook, gains most from staying in sync | App teams converting a third-party system; tool builders |
| 2026-11-26 | Three install paths with the same commands and byte-identical output: `npx`, `dart`, Docker for CI | Web teams have Node, Flutter teams have Dart; only a pinned image gives identical goldens | One runtime only |
| 2026-11-26 | Package names: `@steach/stroma` on npm, `stroma` on pub.dev | `stroma` is taken on npm; both are free otherwise | `stroma-cli` on npm |
| 2026-11-26 | Generated packages are committed in the team's repository; Stroma never publishes them | Reviewable, and no redistribution of anyone's design system | Stroma publishing to pub.dev |
| 2026-11-26 | Customisation through DSIR overrides and hand-written replacements, never edits to generated files | Keeps regeneration safe | Editable generated code |
| 2026-11-26 | No hosted service and no catalogue of converted output for now | Scope, and licensing of derivatives | Both, later |
| 2026-11-26 | DSIR 0.2 leaves out `anatomy`; it moves to `feat-006` (0.3) | Its shape depends on what the extractor can read from the DOM | Designing it now |
| 2026-11-26 | The validator runs the schema, then cross-reference checks (variant axes and values, colour and radius tokens) | JSON Schema can't relate one part of the file to another; a misspelt condition would pass as a variant axis | Schema only |
| 2026-11-26 | `ajv` (pinned 8.20.0) for JSON Schema 2020-12 | The standard validator for Node; no hand-rolled schema code | A hand-written checker |
| 2026-11-26 | The spike moved with `git filter-repo`, renaming each file to its final path in history | `git log --follow` works on the new paths | Copying the files (history lost); keeping the old layout |
| 2026-11-26 | The converted shadcn example lives in `examples/shadcn-neutral`, laid out like a user's repository | It is the fixture `docs/usage.md` describes, and it keeps generated output out of `packages/` | A folder inside the emitter package |
| 2026-11-26 | The primitives stay as emitter templates for now | They import generated `tokens.dart`, so they aren't a standalone package yet | `packages/primitives-flutter` now |
| 2026-11-26 | CI analyzes the generated Flutter package but skips its golden tests while Inter isn't vendored | Goldens need the exact font; how to pin it is `feat-002` | Committing the fonts now |
| 2026-11-26 | Phase 1's second design system: Carbon (IBM), Apache-2.0, Storybook https://react.carbondesignsystem.com | Furthest from shadcn (SCSS and global classes, not utility classes), the same licence as Stroma, and 668 stories keep Phase 1 to two weeks | Primer React (MIT, CSS modules); Fluent UI v9 (MIT, runtime CSS-in-JS); Chakra UI v3 (MIT, CSS-in-JS recipes) |
| 2026-11-26 | No LLM at extraction for now; LLM help becomes Phase 5 (`feat-013`) | Deterministic extraction must be good first; a model would hide where it falls short | Allowing a model to propose DSIR facts from the start |
| 2026-11-26 | CI gets the golden fonts by downloading pinned files and checking their SHA-256 (`feat-014`) | Keeps font binaries out of the repository while making goldens reproducible | Committing the OFL font files |
| 2026-11-26 | Golden images are Linux renders, compared only on Linux | macOS rasterises text differently by 1-2% of pixels even with byte-identical fonts (the diff is glyph edges only) | A pixel tolerance, which would also hide real regressions |
| 2026-11-26 | Goldens are regenerated on CI (`update-goldens` workflow), never on a laptop | Only CI's runner type gives CI's pixels; a Docker image on an arm64 Mac may still differ from x86_64 | A local Docker script |
| 2026-11-26 | Stacked pull requests: merge the lower one first, and merge any PR that carries history to keep with a merge commit | #7's squash dropped the spike history and #8 merged into a branch; fixed by #10 | — |
| 2026-11-26 | Stroma keeps its own pinned shadcn Storybook (`examples/shadcn-neutral/storybook`) | shadcn/ui publishes none (its repository has no Storybook config or stories); a local build is also the private-system path `docs/usage.md` promises | Pointing Phase 1 at Carbon first, which loses the shadcn ground truth |
| 2026-11-26 | The Storybook's components, `globals.css` and control options are generated from the enricher's pinned sources | The Storybook and the enricher can't disagree about what shadcn/ui is | Hand-copied files |
| 2026-11-26 | Storybook telemetry off in config and CI | A fixture must not send usage data | — |
| 2026-11-26 | The extractor sets cells through Storybook's preview channel, then checks the args and theme Storybook holds | Storybook ignores `args` in the iframe URL; the first run measured the default badge under every variant's name until the check caught it | URL args |
| 2026-11-26 | Cells record author rules as written plus each referenced variable's computed value | Tailwind v4 inlines theme variables (`var(--primary)`, not `var(--color-primary)`); recording the value resolves any CSS-variable system without reading `:root` | Recording computed values only |
| 2026-11-26 | The component root is the first element marked `data-slot`, `data-part` or `data-scope` | shadcn, Ark and Chakra mark parts this way; a story without one fails loudly | A layout heuristic |
| 2026-11-26 | Only the current DSIR version validates; older files are migrated (`migrate()` chains 0.1 -> 0.2 -> 0.3) | One format to reason about | Validating every version |
| 2026-11-26 | Rule values come from cells where unwritable conditions (not hovered, no icon) are at rest, and rules are judged on those cells | A DSIR can only add positive conditions; choosing otherwise left values that no rule could fix | Plain majority |
| 2026-11-26 | Mining is followed by pruning and re-mining until stable | Greedy order kept rules a later rule made wrong | Single greedy pass |
| 2026-11-26 | Every story must be extracted together | A component left out is read as a part of another (the card footer's button) | Guessing components from names |
| 2026-11-26 | The Storybook gets a `WithIcon` badge story | The extractor can only describe what a story draws; without it the inferred Badge had no icon slot | Guessing an icon slot from the layout |
| 2026-11-26 | A colour token measured in one mode only is emitted with the other mode's value and a comment | No cell used it in the other mode, so no rule reads it there | Failing the emit; inventing a value |
| 2026-11-26 | `examples/shadcn-neutral` is emitted from the inferred DSIR (`inferred/shadcn.dsir.json`); `design-system/` keeps the source-derived one as ground truth | The gate must run on what the extractor measured; CI then guards it | Keeping the example source-derived |
| 2026-11-26 | Carbon is read from a local Storybook built from pinned `@carbon/react`, not the hosted one; the extractor takes `--root` for it | The hosted site can't be pinned; Carbon marks no `data-slot`/`data-part` | Extracting the hosted site |
| 2026-11-26 | A DSIR condition `mode` is any theme name, not only light and dark | Carbon has four themes; the validator still checks that rules only name modes as strings | A 0.4 schema; mapping Carbon's themes onto two modes, which loses information |
| 2026-11-26 | A root with no marker is a component named by its block class; a token's value is its `var()` fallback when no theme defines it | Carbon marks no parts and defines shared tokens only as fallbacks | An override table of component names |
| 2026-11-26 | `DsTokens` has one set per DSIR mode and `t.mode` conditions; the page background and foreground tokens are found by name | Carbon has four themes; a DSIR does not name its page tokens yet | Two modes only; explicit page roles in the DSIR (later, if names stop working) |
| 2026-11-26 | The oracle's node builder and cells are generated from the DSIR, except shadcn's card examples | A hand-written builder named Button, Badge and Card | Writing one per design system |
| 2026-11-26 | IBM Plex Sans comes from the `@ibm/plex-sans` 1.1.0 release: its woff2 (npm, lockfile-pinned) for the Storybook, its TTFs (a hash-checked download, `tool/fetch-plex.sh`) for Flutter | The npm package has no TTF and Flutter needs one; both are the same release | Converting woff2 to TTF; the CDN |
| 2026-11-26 | The extractor aborts every request outside the Storybook and lists them in `index.json` | A CDN font would change a measurement silently | Trusting the network |
| 2026-11-26 | The oracle compares Carbon with its extraction (Chrome's computed styles), not a Chrome reference sheet | The extraction already holds what Chrome drew per cell; a sheet would measure the same thing a second way | Rendering a Chrome sheet for every design system |
| 2026-11-26 | `tool/pin-fonts.sh <package>` picks the pinned font from the package's pubspec | `init.sh` and `update-goldens` ran the Inter script for every package | One script per family called by name |
| 2026-11-26 | Phase 1 verdict: go. Phase 2 starts with a CSS-in-JS probe and three conditions (a coverage report, a pixel comparison for every system, a DSIR override file for names) beside the CLI | Both systems passed; what rendering lost is names and semantics, not values; the unproven part is systems with no `var()` references | Going on to the CLI only |
| 2026-11-26 | CSS-in-JS systems are in scope for Phase 2, once tokens can vary by variant (`feat-021`); inference lists a token whose value depends on more than the mode in `unsupported` | The probe (Material UI) produced a DSIR whose 6 colour tokens all had several values per mode and would have painted the first | Excluding CSS-in-JS; keeping the first value quietly |
| 2026-11-26 | A colour whose token takes several values within a mode is written as a literal, not as a token with a value per variant; the page colours are measured into `tokens.page` when no token names them | Needs no new DSIR construct and loses nothing (the literal is in the rule); Material UI has no token to name the page | A per-variant token value; failing the inference |
| 2026-11-26 | Names are overrides applied by `stroma-infer --overrides`, kept in `examples/<system>/overrides.json` beside the DSIR; they rename and annotate and never change a value or a condition | A person wants the design system's names, and hand-editing the inferred file is undone by the next inference | Editing the DSIR by hand; naming in the emitter |
| 2026-11-26 | The oracle compares text colour (gated at dE 5) and SSIM (reported) against Chrome's own image of each cell, saved by the extractor; no Chrome reference sheet per design system | The Carbon and Material UI oracles only compared Flutter with the numbers the rules were mined from | A reference sheet per system |
| 2026-11-27 | The CLI runs the emitter compiled to JavaScript (`dart compile js`, built once) and its tests compare it with the committed packages the native Dart emitter wrote | `docs/usage.md` promises Node alone; byte-identity is what lets the npm and Dart paths produce the same output | Shelling out to `dart`; a second emitter in JavaScript |
| 2026-11-26 | Same working rules as Aegil and Scrib: issue first, issue-named branches, one-line commits, no agent attribution | The three repositories should work alike | — |

## Files modified

All files in the repository were created on 2026-11-26.

## Evidence of completion

| Check | Command | Result |
| --- | --- | --- |
| Harness | `./init.sh` | Green: 12 features, `packages/dsir` 10/10 tests |
| Oracle (spike parity) | `pnpm run reference` (enricher-shadcn), then `pnpm run compare` (oracle) | 426/426 cells, 36/36 tokens |
| DSIR fixture | `node packages/dsir/bin/validate.mjs packages/dsir/fixtures/shadcn/shadcn.dsir.json` | `valid DSIR 0.2.0`, exit 0 |

## Notes for the next session

- The spike's code and evidence are in Scrib: `packages/scrib_ds` on branch `feat/82-ds-compiler-spike`, with the verdict in `packages/scrib_ds/SPIKE.md`.
- The project plan was drafted as a shared doc; the README carries its design, so the README is the source of truth here.
