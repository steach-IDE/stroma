# Progress

## Current state

- **Last updated:** 2026-11-26
- **Active feature:** `feat-001` (bootstrap the repository): the repository is public at https://github.com/steach-IDE/stroma; the first issues are still to open.
- **Code:** none yet. This repository holds the README, the agent harness and the working rules.

## Done

- The harness: `AGENTS.md`, `CLAUDE.md`, `feature_list.json`, `progress.md`, `session-handoff.md`, `init.sh`, `.claude/` rules and hook, `.github/` templates and CI.
- The README: purpose, design, spike evidence, planned layout, roadmap.

## In progress

Nothing.

## Next

1. Finish `feat-001`: open issues for `feat-002`, `feat-003` and `feat-004`, then record the evidence.
2. Agree how people will install and use Stroma; that shapes `packages/cli` and the README's quick start.

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
| 2026-11-26 | Same working rules as Aegil and Scrib: issue first, issue-named branches, one-line commits, no agent attribution | The three repositories should work alike | — |

## Files modified

All files in the repository were created on 2026-11-26.

## Evidence of completion

| Check | Command | Result |
| --- | --- | --- |
| Harness | `./init.sh` | See `session-handoff.md` |

## Notes for the next session

- The spike's code and evidence are in Scrib: `packages/scrib_ds` on branch `feat/82-ds-compiler-spike`, with the verdict in `packages/scrib_ds/SPIKE.md`.
- The project plan was drafted as a shared doc; the README carries its design, so the README is the source of truth here.
