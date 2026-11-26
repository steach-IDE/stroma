# Stroma: instructions for agents

Stroma compiles a web design system into a native Flutter package: render each component in a browser, measure it, emit Flutter from a committed DSIR, and prove the output matches. The README explains the design; this file is the routine and the rules.

## Start of every session

1. Confirm `pwd` is the repository root.
2. Read this file, then `README.md` (the design) and `progress.md` (where the last session stopped).
3. Run `./init.sh`. **If it fails, repairing it is the task.** Don't start new work on a broken baseline.
4. Read `feature_list.json` and `session-handoff.md`.
5. Run `git log --oneline -5` and `git status`.

## Working rules

1. **One feature at a time.** Pick one whose `dependencies` are all `done`. Set it to `in-progress`. Only one feature may be `in-progress`.
2. **Every piece of work starts with a GitHub issue**, and its branch is `<type>/<issue number>-<few words>`. Read `.claude/rules/git-and-issues.md`. The only exception is the bootstrap commit (`feat-001`).
3. **Stay in scope.** Work the feature's `done_when` and nothing more. Something else you notice goes in `progress.md` under Next.
4. **No "done" without evidence.** Run the feature's verification, then paste the command and its result into `evidence`.
5. **Leave it restartable.** Before you stop, `./init.sh` must pass, or `progress.md` must say why it doesn't.

## Hard rules for the code

These come from the design. Breaking one needs a decision recorded in `progress.md`.

1. **Never edit generated output by hand.** Change the DSIR, the emitter or a primitive, then regenerate.
2. **Emission is pure.** The same DSIR gives byte-identical output. No timestamps, no unseeded randomness, no network calls, no model calls in the emitter.
3. **Nothing is dropped silently.** Anything not translated goes in `unsupported` with a reason. An unknown input fails loudly.
4. **Behaviour is hand-written and tested with real input** (keyboard, pointer, semantics), never with states forced on.
5. **Licences are checked, not assumed.** Never commit another project's design system output, fonts or icons unless its licence allows it. Never use another project's name or marks in a generated package.
6. **No secrets** in code, fixtures or logs.

## Definition of done

A feature is done when all four hold:

- The behaviour in `done_when` exists.
- Its verification ran in this session, and passed.
- The command and its output are recorded in `feature_list.json` (`evidence`) and in `progress.md`.
- `./init.sh` passes.

## End of every session

1. Update `progress.md`: what changed, decisions, blockers, the next step.
2. Update the feature's `status` and `evidence` in `feature_list.json`.
3. Rewrite `session-handoff.md` for the next session.
4. Commit once `./init.sh` passes, in the commit format below. Don't push or merge unless the user asks.

## Verification

| Command | What it checks |
| --- | --- |
| `./init.sh` | The harness (required files, `feature_list.json` integrity, shell syntax) and every package that exists: Node packages (`check`, `lint`, `test`, `build` scripts), Dart packages (`analyze`, `test`) and the generated example packages (`flutter analyze`, `flutter test`). The first run downloads the pinned fonts the goldens need (`tool/fetch-fonts.sh`, about 34 MB, then cached in `.stroma/fonts`) |

Each package adds its own checks to `init.sh` in the feature that creates it.

## Commits

One line, `type(scope): what changed`: at most 72 characters, lower case, imperative. Types are `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`. The detail goes in the pull request. **No attribution lines for Claude or any other agent, anywhere.**

## When to stop and ask

| Situation | What to do |
| --- | --- |
| The requirement is unclear, or the change touches the architecture or the DSIR format | Check `README.md` and `progress.md` (Decisions). If they don't settle it, ask the user. |
| The same check fails three times in a row | Stop. Record the failure and what you tried in `progress.md`, and flag it for a person. |
| A design system's licence is unknown or forbids derivative work | Stop work on that system and ask. |
