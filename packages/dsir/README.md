# DSIR

**In one sentence:** The DSIR (design-system intermediate representation) is the JSON file that describes a design system to Stroma's emitter, and this package holds its schema, a validator, and the migration from older versions.

```sh
node bin/validate.mjs fixtures/shadcn/shadcn.dsir.json
# fixtures/shadcn/shadcn.dsir.json: valid DSIR 0.3.0
```

A broken file exits 1 and names the path of every problem:

```
broken.dsir.json: /components/0/rules/7/set: unknown key "mixBlend"
broken.dsir.json: /components/0/rules/7/when/size: "huge" is not an option of "size"
```

The first line comes from the schema check, the second from the cross-reference check. The cross-reference check runs only once the schema passes, so fix schema errors first.

Needs Node 20 or later. Run `pnpm install` once, then `pnpm test`.

## What a DSIR holds

| Part | What it is |
| --- | --- |
| `source` | Where the design system came from: kind, URL, version, licence (SPDX id), content hash |
| `tokens` | Colours per mode (sRGB, with alpha), the radius scale, fonts |
| `globals` | Rules every component starts from, by selector (`*`, `body`) |
| `components[]` | Per component: variant axes and defaults, slots, `behaviour`, and an ordered list of `rules` |
| `rules[]` | `when` (conditions) → `set` (style values), in CSS cascade order: **a later rule wins** |
| `noops`, `unsupported` | What was deliberately not translated, and why. Nothing is dropped silently. |

New in 0.2:

- **`behaviour`**: the WAI-ARIA pattern a component implements (`button`, `dialog`, `tabs`, …), or `null` for a static box. The emitter picks the hand-written primitive from it.
- **`provenance`** on every rule: `measured` (from a render), `enricher` (from source code), `llm` (reserved for Phase 5: nothing writes it until LLM help is added), or `human`.

## What the validator checks

1. **The schema** (`schema/dsir-0.3.schema.json`, JSON Schema 2020-12). Only the current version validates; migrate older files first. It's closed: an unknown key anywhere, including a style key in `set`, is an error.
2. **Cross-references a schema can't express:**
   - each `when` and `except` key is a variant axis of its component, and each value is one of its options;
   - each colour and radius token a rule uses exists in `tokens`;
   - no two components share a name;
   - each `anatomy.children` entry is the slot of some component.

## Migrating

To bring any older DSIR (0.1, the Scrib spike's format, or 0.2) to the current 0.3:

```sh
node bin/migrate.mjs old.dsir.json new.dsir.json
```

0.1 → 0.2 marks every rule `provenance: "enricher"` (0.1 rules were read from source, never measured) and sets `behaviour: "button"` for components whose role is `button`. 0.2 → 0.3 only changes the version, since `anatomy` is optional. The result is validated before it's written.

## The fixture

`fixtures/shadcn/shadcn.dsir.json` is the spike's shadcn/ui Button, Badge and Card, migrated to 0.3. It's derived from shadcn/ui, so shadcn/ui's MIT licence sits next to it (`fixtures/shadcn/LICENSE.md`).

## What can go wrong

| What you see | Why | What to do |
| --- | --- | --- |
| `must match pattern "^0\.3\.\d+$"` at `/dsirVersion` | The file is an older DSIR | Run `bin/migrate.mjs` |
| `unknown key "…"` under `set` | A style value the emitter can't print | Fix the producer. If the emitter gains the key, add it to the schema in the same change |
| `"…" is not a variant axis of this component` | A misspelt condition (`mdoe`), or an axis missing from `variants` | Fix the spelling or declare the axis |
| `unknown colour token "…"` | A rule refers to a token that `tokens.color` doesn't define | Add the token, or fix the reference |

## New in 0.3

`anatomy.children`: the slots of the parts that appear directly inside a component, in DOM order (Card → `card-header`, `card-content`, `card-footer`). The inferrer (`packages/infer`) reads it from the rendered DOM.
