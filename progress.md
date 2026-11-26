# Progress

## Current state

- **Last updated:** 2026-11-26
- **Active feature:** none. `feat-014` is done on branch `feat/11-pinned-fonts` (PR #12).
- **Code:** `packages/dsir`, `emitter-flutter`, `enricher-shadcn`, `oracle`, `adapter-scrib`, and `examples/shadcn-neutral`.

## Done

- The harness: `AGENTS.md`, `CLAUDE.md`, `feature_list.json`, `progress.md`, `session-handoff.md`, `init.sh`, `.claude/` rules and hook, `.github/` templates and CI.
- The README: purpose, design, spike evidence, planned layout, roadmap.

- `feat-001`: the repository is public with CI; issues #3, #4 and #5 are open.
- `feat-003`: `packages/dsir`, the DSIR 0.2 schema, validator (schema + cross-references) and migration, with the shadcn fixture and 10 tests.
- `feat-004`: the spike's code moved over with its 8 commits and split into packages; the enricher now writes DSIR 0.2; the oracle reproduces 426/426 and 36/36; CI installs Flutter and `./init.sh` checks the example.

- `feat-002`: Carbon, no LLM until Phase 5, pinned font downloads.
- `feat-014`: `tool/fetch-fonts.sh` (Inter 4.1, hash-checked, cached); the golden tests run in CI on Linux.

## In progress

Nothing.

## Next

1. Merge PR #12 (`feat-014`) with a merge commit or a squash; it carries no history worth keeping.
2. Phase 1: `feat-005`, the render-based extractor, on shadcn's Storybook first.
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
