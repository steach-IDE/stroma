# Progress

## Current state

- **Last updated:** 2026-11-26
- **Active feature:** none. `feat-003` is done on branch `feat/4-dsir-schema`, waiting for its pull request.
- **Code:** `packages/dsir`: the DSIR 0.2 schema, validator and 0.1 migration.

## Done

- The harness: `AGENTS.md`, `CLAUDE.md`, `feature_list.json`, `progress.md`, `session-handoff.md`, `init.sh`, `.claude/` rules and hook, `.github/` templates and CI.
- The README: purpose, design, spike evidence, planned layout, roadmap.

- `feat-001`: the repository is public with CI; issues #3, #4 and #5 are open.
- `feat-003`: `packages/dsir`, the DSIR 0.2 schema, validator (schema + cross-references) and migration, with the shadcn fixture and 10 tests.

## In progress

Nothing.

## Next

1. Merge the `feat-003` pull request (issue #4).
2. `feat-004` (issue #5): move the spike code over with its history, and migrate its DSIR with `packages/dsir/bin/migrate.mjs`.
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
| 2026-11-26 | Same working rules as Aegil and Scrib: issue first, issue-named branches, one-line commits, no agent attribution | The three repositories should work alike | — |

## Files modified

All files in the repository were created on 2026-11-26.

## Evidence of completion

| Check | Command | Result |
| --- | --- | --- |
| Harness | `./init.sh` | Green: 12 features, `packages/dsir` 10/10 tests |
| DSIR fixture | `node packages/dsir/bin/validate.mjs packages/dsir/fixtures/shadcn/shadcn.dsir.json` | `valid DSIR 0.2.0`, exit 0 |

## Notes for the next session

- The spike's code and evidence are in Scrib: `packages/scrib_ds` on branch `feat/82-ds-compiler-spike`, with the verdict in `packages/scrib_ds/SPIKE.md`.
- The project plan was drafted as a shared doc; the README carries its design, so the README is the source of truth here.
