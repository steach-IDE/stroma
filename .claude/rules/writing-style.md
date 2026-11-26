---
paths:
  - "README.md"
  - "docs/**"
  - "packages/*/README.md"
---

# How to write a page

The readers are design-system maintainers and Flutter developers converting a design system, and the coding agents they work with. Not compiler authors.

1. **First line: `**In one sentence:** ...`** The point of the page in plain words.
2. **Show a real command, DSIR fragment or generated widget first,** then explain the rules.
3. **Claim only what the code does today.** A planned feature says "planned" and links its id in `feature_list.json`. A number comes from a run you can repeat, with the command beside it.
4. **Say what can go wrong** in a table: `What you see | Why | What to do`.
5. **Short sentences, everyday words.** Explain a term (DSIR, oracle, enricher) the first time a page uses it.
