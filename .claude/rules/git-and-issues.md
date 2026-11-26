# How we work: issues, branches, commits and pull requests

The same rules as Aegil and Scrib, so the repositories work alike.

## 1. Every piece of work starts with an issue

**Before you change any file, there is a GitHub issue.** A one-line fix gets a short issue. The issue is why the change exists and what "done" means.

- **Look first.** `gh issue list --search "<words>" --state open`. If one exists, use it. Do not open a duplicate.
- **Use the template** (`.github/ISSUE_TEMPLATE/work.yml`): Kind, Problem, Goal, Scope, Non-goals, Acceptance criteria, Dependencies and risks, Docs impact, Status.
- **Acceptance criteria must be testable**: each line passes or fails. "Improve the extractor" is not one. "`stroma extract` on a story with no argTypes exits non-zero and names the story" is. If you cannot write testable criteria from what you were told, create the issue as `draft`, ask for the criteria, and do not start.
- **Link the feature.** An issue that delivers a feature in `feature_list.json` names its id (`feat-005`) in the Goal.
- **Status** is `draft`, `ready` (criteria testable), or `blocked`. Only `ready` work starts.
- Close an issue only with evidence: the pull request merged and its checks passed.

### Issue titles

`type(scope): what will be true`, at most 72 characters, lower case after the colon, no full stop.

- `type`: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`.
- `scope`: the area: `dsir`, `extractor`, `enricher`, `oracle`, `emitter`, `primitives`, `adapter`, `cli`, `harness`, `ci`, `docs`.
- For a bug, the symptom and where it shows, never a guess at the cause.
- Never an issue number, "bug:", "please", or a vague word on its own (improve, update, fix, tweak, clean up, misc).

## 2. Branches

`<type>/<issue number>-<few words>`, for example `feat/5-storybook-extractor`. A hook (`.claude/hooks/require-issue-branch.sh`) refuses edits on any other branch. For a deliberate throwaway edit the user starts Claude with `STROMA_SKIP_ISSUE_CHECK=1`. Never set it yourself to get past the block.

**The one exception** is the bootstrap commit (`feat-001`): the first commit on `main`, made before the repository exists on GitHub, so before any issue can.

## 3. Commits are short

**One line:** `type(scope): what changed`.

- At most **72** characters, aim for 50. Lower case, imperative, no full stop.
- **No body**, or at most three short lines when something truly cannot wait for the pull request.
- **The detail goes in the pull request description.**
- **No attribution lines for Claude or any other agent, ever, anywhere.** Not in a commit, a pull request description, an issue or a comment: no `Co-Authored-By`, no "Generated with" tagline, no session link.
- One logical change per commit.

## 4. Pull requests

- The description uses `.github/pull_request_template.md`: **Issue** (`Closes #<n>`), **What**, **Not included**, **Testing**.
- The title has the same shape as a commit subject.
- One issue, one pull request, where you can.
- Do not push or merge unless asked to in the conversation.
- If the checks fail, say so with the output. Do not say it is done.

CI (`work rules`, `.github/scripts/work-gate.sh`) fails a pull request whose description links no issue, and any commit over 72 characters, not in the `type(scope): subject` form, with a body over 3 lines, or crediting an agent. Merge commits are ignored.
