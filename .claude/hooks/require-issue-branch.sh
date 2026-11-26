#!/usr/bin/env bash
# Claude Code PreToolUse hook: refuse an edit unless the file's repo is on a branch named after an issue.
#
#   <type>/<issue number>-<few words>      type: feat, fix, chore, docs, refactor, test, style
#
# Why: every piece of work starts with an issue (.claude/rules/git-and-issues.md). This stops an edit on develop, main, master or an
# unnumbered branch before it happens, instead of at the pull request.
#
# The repo checked is the file's own, not the folder Claude was started in. A file outside any git repo (a plan, a scratch file, or a
# local checkout before `git init`) is always allowed. To make a deliberate throwaway edit, start Claude with STROMA_SKIP_ISSUE_CHECK=1.
#
# Exit 0 allows the edit. Exit 2 blocks it and shows the message on stderr to Claude.
set -u

[[ "${STROMA_SKIP_ISSUE_CHECK:-}" == "1" ]] && exit 0

input="$(cat)"
file="$(printf '%s' "$input" | python3 -c '
import json, sys
try:
    tool_input = json.load(sys.stdin).get("tool_input", {})
except Exception:
    tool_input = {}
print(tool_input.get("file_path") or tool_input.get("notebook_path") or "")
' 2>/dev/null)"
[[ -z "$file" ]] && exit 0

# The nearest folder that exists, so a file Claude is about to create still finds its repo.
dir="$(dirname "$file")"
while [[ ! -d "$dir" && "$dir" != "/" ]]; do dir="$(dirname "$dir")"; done

root="$(git -C "$dir" rev-parse --show-toplevel 2>/dev/null)" || exit 0

branch="$(git -C "$root" symbolic-ref --short -q HEAD 2>/dev/null || true)"
if [[ "$branch" =~ ^(feat|fix|chore|docs|refactor|test|style)/[0-9]+- ]]; then
  exit 0
fi

repo="$(basename "$root")"
{
  echo "Blocked: ${repo} is on '${branch:-a detached HEAD}', which is not an issue branch."
  echo "Every piece of work starts with a GitHub issue, and its branch is named <type>/<issue number>-<few words>"
  echo "(for example feat/5-storybook-extractor)."
  echo "Create the issue (gh issue create), then branch: git checkout -b <type>/<issue number>-<few words>."
  echo "For a deliberate throwaway edit, the user can start Claude with STROMA_SKIP_ISSUE_CHECK=1."
} >&2
exit 2
