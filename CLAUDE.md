@AGENTS.md

## Claude Code specifics

- `.claude/rules/` holds the working rules (`git-and-issues.md`) and the writing rules for docs (`writing-style.md`). Read them before you commit or write docs.
- A hook (`.claude/hooks/require-issue-branch.sh`) refuses edits unless the branch is named after an issue. For a deliberate throwaway edit, the user starts Claude with `STROMA_SKIP_ISSUE_CHECK=1`. Never set it yourself.
