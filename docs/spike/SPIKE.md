# Spike: shadcn Button, Badge and Card to Flutter (#82)

## Verdict

**Proceed.** Styling compiled mechanically: 131 cascade rules from three real shadcn components, with no per-component hand tuning. All 426 rendered cells match Chrome within the gates (±1 px geometry, ΔE < 2 background), and so do all 36 token conversions (ΔE ≤ 0.70 against Chrome's own pixels). The generated adapter drops into `bolt.tsp` with no new analyzer issues, and every route renders at 320, 390 and 1280 px.

What the spike does **not** prove is the hard part named in the brief. These three components are static boxes. Neither behaviour (overlays, menus, focus traps) nor layout under pressure (TextField in a Row, scroll axes) was exercised. The cost of the next phase sits there, not in styling.

## Acceptance criteria

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | Tokens: OKLCH cssVars to DTCG to `ThemeExtension`, ΔE < 1, byte-identical reruns | **Pass** | 36/36 tokens. Worst ΔE2000 0.094 against culori and 0.70 against Chrome's rendered pixel. Two ingest+emit runs hash to `66c826cb…2160` both times. `pnpm test` and `emit --check` cover it. |
| 2 | Button: 6 variants × sizes × {rest, hover, focus, disabled}, ±1 px, ΔE < 2, per-cell score | **Pass** | 384 cells (upstream has **8** sizes, not 4; all are covered), light and dark. 384/384 pass. Mean SSIM 0.976 light and 0.962 dark. |
| 3 | Badge and Card | **Pass** | Badge: 36/36 (6 variants × rest/hover/focus × 2 modes). Card: 6/6 (full, with action, content only), SSIM ≥ 0.989. |
| 4 | Unsupported listed, nothing dropped silently | **Pass, with a correction** | `ring-offset` is **not** in shadcn v4, so it doesn't appear. The real entries are `underline-offset-4`, the browser's own focus outline on Badge (found by the oracle, see below), and two consumer-class conditions (`[.border-b]:pb-6`, `[.border-t]:pt-6`). Ingest throws on any class it neither maps nor lists, and 16 no-ops carry a reason. |
| 5 | Generated `scrib_adapter.dart`; bolt analyzes with 0 errors; routes render at 3 widths | **Pass for the adapter; one error predates it** | `lib/` has 0 errors. The whole project has 1 error, also present on the unmodified baseline: the compiler's own `test/widget_test.dart` pumps `ScribApp` (#79 already tracks this). 18/18 route renders pass, plus a test asserting bolt-home renders the generated `Button` and `Card`. |
| 6 | Written verdict | This file | |

Reproduce with the commands in [README.md](README.md). The oracle writes `build/oracle/report/index.html`, which shows Chrome, Flutter and a diff heatmap for every cell, plus each check and its SSIM.

## What was mechanical

- **Tokens.** OKLCH to sRGB with CSS Color 4 gamut mapping (both destructive reds are out of gamut and flagged). Alpha tokens (`oklch(1 0 0 / 10%)`) keep their alpha. The radius scale is derived from `--radius`.
- **The cascade.** Variants, sizes, `hover:`, `focus-visible:`, `disabled:`, `aria-invalid:`, `dark:` and `has-[>svg]:` all become conditions on one ordered list of rules. Order is CSS specificity, then Tailwind's own `getClassOrder`. Two things made it faithful, and both are now encoded:
  - **tailwind-merge runs before CSS.** shadcn's `cn()` removes conflicting classes, so `focus-visible:ring-destructive/20` deletes the base `ring-ring/50`. The ingest runs the real cva and tailwind-merge for every variant × size and records `except` on the rules they remove. Without this, destructive buttons get the wrong focus ring.
  - **Upstream quirks are reproduced, not fixed.** In dark mode `dark:bg-destructive/60` comes later than `hover:bg-destructive/90`, so the destructive button has no hover change in dark mode. That's true in shadcn itself, and the Flutter output matches it.
- **Box painting.** Border-box sizing, padding, border, shadows (CSS blur converted to Flutter sigma), opacity, the ring as an outside stroke (a `BoxShadow` would fill under transparent buttons), unitless line heights with even leading distribution, and font weights.

Each generated cascade line names the Tailwind class it came from, for example `if (variant == ButtonVariant.destructive && states.contains(WidgetState.focused)) { ... } // focus-visible:ring-destructive/20`, so a diff after an upstream change is reviewable.

## What needed hand-written primitives

All of it lives in `templates/package/lib/src/` (382 lines), written once and shared by every generated component:

- `DsBox` paints one CSS box: decoration, ring, opacity, inherited text and icon style, and flex/grid layout.
- `DsPressable` handles hover, keyboard-only focus (`:focus-visible`), press, Enter/Space activation, disabled, `aria-invalid` as `WidgetState.error`, and button semantics.
- `DsTheme` and `DsTokens` lookup.

The next 45 components need many more of these (section 6.4 of the brief): Dialog, Popover, Menu, Select, Tabs, Tooltip and so on. Each is behaviour, so each is hand-written.

## What needed judgment

Every item here is written down in code or data, not hidden:

- **Scrib mapping** (`mappings/shadcn.scrib.json`): `accent` maps to `default`. `success` and `warning` badges become `outline` plus a coloured dot. `hero` on Card is ignored. Circle buttons delegate to the base adapter, because shadcn has no round button.
- **Layout patterns.** CardHeader's `grid-cols-[1fr_auto]` with a spanning action became a Row of Expanded and trailing. That's a named pattern, not a general CSS grid. Any other grid fails the emitter.
- **Deliberate divergence from CSS** (layout rule 2): a button's label is `Flexible` with an ellipsis, so it shrinks instead of overflowing as CSS would.
- `[a&]:hover` (the badge rendered as a link) maps to "the badge has `onPressed`".
- **Slot shapes** derive from layout: an svg rule gives an `icon` slot plus one `child`, flex gives `children`, block gives `child`. `default` becomes `regular`, because `default` is a Dart keyword.

## Findings the oracle caught

1. **The browser focus outline on Badge.** Badge has no `outline-none`, so a focused link badge in Chrome also gets the browser's own two-tone outline inside the ring. Flutter has none. The low SSIM on focused badges (0.45 to 0.76) is exactly that outline, and every other measured value is equal. It's now an `unsupported` entry; the ingest had wrongly called it a no-op.
2. Three harness bugs, all fixed:
   - `matchesGoldenFile` on a finder captures at 1x.
   - Preflight's border-box shrank the card cell.
   - Alpha tokens were composited over the wrong page colour.

   Worth knowing: an oracle needs its own tests.

## Limits of this evidence

- **Radius** can be read from pixels only where the box contrasts with the page: 45 cells, worst 0.82 px. Outline, ghost, link and light secondary aren't measurable this way. They come from the same `rounded-md` rule through the same resolver, so they're covered by construction, not by measurement.
- **One machine.** Goldens and Chrome references come from macOS arm64 with Flutter 3.35.4 and Chromium 159. CI on Linux will need its own goldens or a tolerance.
- **Font.** Inter, from `/Library/Fonts`, is used on both sides and is gitignored, not vendored. shadcn's registry ships no font (its site uses Geist). Goldens (900 KB) are committed.
- **Icons.** The base adapter's icon lookup is private. `tool/bolt_check.sh` appends a public alias to the app's copy, which is a shortcut. The contract should export icon resolution.
- **The DSIR shape differs from the brief's draft.** Styles are an ordered list of conditional rules, not a `styles` map keyed by variant. A map can't express the cascade (specificity, `dark:` against `hover:`, tailwind-merge removals); a rule list can.
- **Layout risk is untested.** Bolt passed at 320 px, but the WhatsApp crash (TextField in a Row) sits in `ScribInput`, which still comes from the base adapter.

## Estimate for the remaining ~45 shadcn components

These are rough numbers. The spike measured styling, not behaviour.

| Group | Components | Work | Estimate |
|---|---|---|---|
| Style only (like these three) | alert, input, textarea, label, separator, skeleton, table, kbd, breadcrumb, button-group, input-group, field, item, empty, spinner, aspect-ratio | Grow the mapper and add layout patterns. Oracle per component. | 2–3 weeks |
| Needs a behaviour primitive | dialog, alert-dialog, sheet, drawer, popover, hover-card, tooltip, dropdown-menu, context-menu, menubar, navigation-menu, select, tabs, accordion, collapsible, checkbox, switch, radio-group, slider, toggle, toggle-group, scroll-area, progress, avatar, pagination | A hand-written, tested primitive per behaviour (keyboard, focus, overlay, semantics), with generated style on top | 7–10 weeks |
| Hand port or `unsupported` | command, form, resizable, calendar, carousel, chart, sonner, input-otp, sidebar, data-table | No automatic translation (section 6.4) | Out of scope, or 1–2 weeks each by hand |

That comes to **about 10–13 engineer-weeks** for the first two groups. The layout linter (section 6.3) and a Linux CI oracle add about 2 more.

## Decisions needed before going further (section 9)

1. **Product and package names.** `scrib_ds` and `shadcn_neutral_ui` are placeholders.
2. **Own widgets or map onto existing ports.** The spike generated its own widgets with zero dependencies, and matched Chrome. I recommend keeping that, since mapping onto `shadcn_ui` brings back the drift we already saw.
3. **Mix or plain Flutter.** Plain Flutter worked with 382 lines of primitives and no version floor beyond 3.35. I recommend staying plain.
4. **Vendoring fonts.** Commit Inter or Geist (OFL) so CI can produce goldens.
5. **Where the Scrib contract types live.** The adapter must be copied into the app because `ScribButtonVariant` and the other contract types are app-local. A small shared `scrib_contract` package would let the generated package ship its adapter directly.
6. Licensing, LLM-at-ingest, private design systems, and the next source: no change from the brief. Nothing here forces an answer yet.
