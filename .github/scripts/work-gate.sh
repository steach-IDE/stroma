#!/usr/bin/env bash
# The work rules, for pull requests:
#
#  1. The description links the issue the work started from:   Closes #12   (also Fixes, Resolves, Refs, Part of)
#     or says there is none:                                   Issue: none, <the reason, a short sentence>
#  2. Every commit has a short subject in the form  type(scope): what changed,  and almost no body. The detail belongs in the
#     pull request description, not the commit.
#       - subject at most 72 characters; type is feat, fix, chore, style, test, docs or refactor; scope optional
#       - body at most 3 non-empty lines
#       - no Co-Authored-By line crediting Claude, and no Claude tagline or session link (also checked in the PR description)
#
# Merge commits and bot pull requests are skipped.
# Inputs (environment): EVENT_NAME, BASE_SHA, HEAD_SHA, PR_BODY, PR_HEAD_REF, PR_BASE_REF, PR_AUTHOR.
set -uo pipefail

summary="${GITHUB_STEP_SUMMARY:-/dev/null}"
say() { echo "$*" | tee -a "$summary"; }
failed=0

if [[ "${EVENT_NAME:-}" != "pull_request" ]]; then
  say "Not a pull request: the work rules are checked on pull requests."
  exit 0
fi
if [[ "${PR_AUTHOR:-}" == *"[bot]" ]]; then
  say "Bot pull request: skipped."
  exit 0
fi
# release-please may open its PR with a person's token (so CI runs on it); it is still a bot PR.
if [[ "${PR_HEAD_REF:-}" == release-please--* ]]; then
  say "Release PR from release-please: skipped."
  exit 0
fi

# 1. The issue.
body="$(echo "${PR_BODY:-}" | tr -d '\r')"
link_re='(close[sd]?|fix(e[sd])?|resolve[sd]?|refs?|part of|related to|issue:?)[[:space:]:]+([A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+)?#[0-9]+'
none_re='^[[:space:]]*issue:[[:space:]]*none[[:space:]]*[,:;—–-]+[[:space:]]*.{15,}'
if echo "$body" | grep -qiE "$link_re"; then
  say "Issue: linked."
elif echo "$body" | grep -qiE "$none_re"; then
  say "Issue: none, accepted. (A reviewer must agree.)"
else
  failed=1
  say "FAILED: the description does not link an issue."
  say "  Start work from an issue, then write one line in the description:  Closes #<number>"
  say "  or, if there truly is no issue:  Issue: none, <the reason in a sentence>"
fi

# 2. The commits. And no Claude tagline or session link in the description or a commit.
credit_re='(generated (with|by) \[?claude)|claude\.ai/code'
if echo "$body" | grep -qiE "$credit_re"; then
  failed=1
  say "FAILED: the description has a Claude tagline or session link. Take it out (no attribution lines for Claude, anywhere)."
fi
type_re='^(feat|fix|chore|style|test|docs|refactor)(\([^)]+\))?!?: .+'
bad=0
while IFS= read -r -d $'\x1e' record; do
  record="${record#$'\n'}"
  [[ -z "$record" ]] && continue
  sha="${record%%$'\x1f'*}"; rest="${record#*$'\x1f'}"
  subject="${rest%%$'\x1f'*}"; msg_body="${rest#*$'\x1f'}"
  short="${sha:0:7}"
  if [[ ${#subject} -gt 72 ]]; then say "FAILED $short: subject is ${#subject} characters (the limit is 72): $subject"; bad=1; fi
  if ! [[ "$subject" =~ $type_re ]]; then say "FAILED $short: subject must look like 'type(scope): what changed' (types: feat, fix, chore, style, test, docs, refactor): $subject"; bad=1; fi
  lines="$(echo "$msg_body" | grep -cv '^[[:space:]]*$' || true)"
  if [[ "$lines" -gt 3 ]]; then say "FAILED $short: the message has a $lines-line body (the limit is 3). Put the detail in the pull request description."; bad=1; fi
  if echo "$msg_body" | grep -qiE '^co-authored-by:.*claude'; then say "FAILED $short: remove the Co-Authored-By line that credits Claude."; bad=1; fi
  if echo "$msg_body" | grep -qiE "$credit_re"; then say "FAILED $short: remove the Claude tagline or session link from the message."; bad=1; fi
done < <(git log --no-merges --format='%H%x1f%s%x1f%b%x1e' "${BASE_SHA}..${HEAD_SHA}")
if [[ $bad -eq 1 ]]; then failed=1; else say "Commits: short subjects, no long bodies."; fi

[[ $failed -eq 0 ]] || { say ""; say "How we work: .claude/rules/git-and-issues.md"; exit 1; }
