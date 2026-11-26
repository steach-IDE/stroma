// Tailwind v4 class -> semantic style declarations for the DSIR.
// Scale values are read from the pinned tailwindcss package's theme.css, not typed in here.
// Every class becomes a rule, a noop (with why), or an unsupported entry (with why). Anything
// else throws, so a new upstream class fails ingest instead of being dropped.

import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT_PX = 16;

/** The `@theme inline` bridge a shadcn v4 project writes into globals.css. */
export const SHADCN_V4_THEME_INLINE = {
  radius: { sm: -4, md: -2, lg: 0, xl: 4 }, // calc(var(--radius) +/- Npx)
};

export function loadTailwindTheme() {
  const css = fs.readFileSync(require.resolve('tailwindcss/theme.css'), 'utf8');
  const vars = {};
  for (const m of css.matchAll(/^\s*(--[\w-]+):\s*([^;]+);/gm)) vars[m[1]] = m[2].trim();
  return vars;
}

function px(value) {
  const v = value.trim();
  let m;
  if ((m = /^(-?[\d.]+)rem$/.exec(v))) return parseFloat(m[1]) * ROOT_PX;
  if ((m = /^(-?[\d.]+)px$/.exec(v))) return parseFloat(m[1]);
  if ((m = /^calc\(([\d.]+)\s*\/\s*([\d.]+)\)$/.exec(v))) return parseFloat(m[1]) / parseFloat(m[2]);
  if (/^-?[\d.]+$/.test(v)) return parseFloat(v);
  throw new Error(`cannot resolve length: ${value}`);
}

function parseShadow(value) {
  // "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)"
  return value.split(/,(?![^(]*\))/).map((part) => {
    const m = /^\s*(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+rgb\((\d+) (\d+) (\d+) \/ ([\d.]+)\)\s*$/.exec(part);
    if (!m) throw new Error(`cannot parse shadow: ${part}`);
    return {
      x: px(m[1]), y: px(m[2]), blur: px(m[3]), spread: px(m[4]),
      color: { rgb: [+m[5], +m[6], +m[7]], alpha: +m[8] },
    };
  });
}

/** Variant prefixes we understand: what each one conditions, and its CSS specificity. */
const VARIANTS = {
  'hover': { when: { state: 'hovered' }, spec: [0, 1, 0] },
  'focus-visible': { when: { state: 'focused' }, spec: [0, 1, 0] },
  'disabled': { when: { state: 'disabled' }, spec: [0, 1, 0] },
  'aria-invalid': { when: { state: 'error' }, spec: [0, 1, 0] },
  'dark': { when: { mode: 'dark' }, spec: [0, 1, 0] },
  'has-[>svg]': { when: { hasIcon: true }, spec: [0, 0, 1] },
  'has-data-[slot=card-action]': { when: { hasSlot: 'action' }, spec: [0, 1, 0] },
  // `a.badge`: only when the badge is rendered as a link, which in Flutter means it is pressable.
  '[a&]': { when: { interactive: true }, spec: [0, 0, 1] },
  '[&_svg]': { target: 'icon' },
  '[&>svg]': { target: 'icon' },
  "[&_svg:not([class*='size-'])]": { target: 'icon' },
};

const UNSUPPORTED_VARIANTS = {
  '[.border-b]': 'applies only when a consumer adds a border-b class; DSIR components take no class overrides',
  '[.border-t]': 'applies only when a consumer adds a border-t class; DSIR components take no class overrides',
};

const NOOPS = {
  'outline-ring/50': 'styles only the browser focus outline; components without outline-none list it as unsupported',
  'outline-none': 'Flutter draws no focus outline by default, so there is nothing to remove',
  'pointer-events-none': 'disabled widgets get no onPressed, and icons never take pointer events in Flutter',
  'shrink-0': 'Flutter flex children never shrink unless wrapped in Flexible; the parent decides',
  'w-fit': 'Flutter rows built here are MainAxisSize.min, which is fit-content',
  'grid-rows-[auto_auto]': 'rows are stacked by content height, which a Column does by default',
  'auto-rows-min': 'rows are stacked by content height, which a Column does by default',
  '@container/card-header': 'declares a container-query name that no shipped rule uses',
  'row-start-1': 'placement is handled by the header-with-action layout pattern',
  'col-start-2': 'placement is handled by the header-with-action layout pattern',
  'row-span-2': 'placement is handled by the header-with-action layout pattern',
  'justify-self-end': 'placement is handled by the header-with-action layout pattern',
  'self-start': 'placement is handled by the header-with-action layout pattern',
};

const UNSUPPORTED = {
  'underline-offset-4': {
    why: 'Flutter TextDecoration has no underline offset',
    fallback: 'default underline position',
  },
};

const TEXT_SIZES = new Set(['xs', 'sm', 'base', 'lg', 'xl']);

function colorRef(name, tokens) {
  const [base, alpha] = name.split('/');
  const a = alpha === undefined ? 1 : parseFloat(alpha) / 100;
  if (base === 'white') return { hex: '#ffffff', alpha: a };
  if (base === 'transparent') return { transparent: true };
  if (!tokens.has(base)) return null;
  return { token: base, alpha: a };
}

/** Maps one utility (no variant prefix) to declarations, or null if unknown. */
function utility(u, theme, tokens) {
  const sp = (n) => parseFloat(n) * px(theme['--spacing']);
  let m;
  switch (u) {
    case 'inline-flex': return { layout: 'inlineRow' };
    case 'flex': return { layout: 'row' };
    case 'flex-col': return { layout: 'column' };
    case 'grid': return { layout: 'grid' };
    case 'items-center': return { crossAlign: 'center' };
    case 'items-start': return { crossAlign: 'start' };
    case 'justify-center': return { mainAlign: 'center' };
    case 'whitespace-nowrap': return { maxLines: 1 };
    case 'overflow-hidden': return { clip: true };
    case 'border': return { borderWidth: 1 };
    case 'underline': return { underline: true };
    case 'leading-none': return { lineHeightFactor: 1 };
    case 'transition-all':
    case 'transition-[color,box-shadow]':
      return {
        transitionMs: parseFloat(theme['--default-transition-duration']),
        transitionCurve: theme['--default-transition-timing-function'],
      };
    case 'grid-cols-[1fr_auto]': return { columns: ['1fr', 'auto'] };
  }
  if ((m = /^(h|w|size|px|py|p|gap|pb|pt)-([\d.]+)$/.exec(u))) {
    const v = sp(m[2]);
    return { h: { h: v }, w: { w: v }, size: { h: v, w: v }, px: { px: v }, py: { py: v },
      p: { px: v, py: v }, gap: { gap: v }, pb: { pb: v }, pt: { pt: v } }[m[1]];
  }
  if ((m = /^rounded-(sm|md|lg|xl|full)$/.exec(u))) {
    return { radius: m[1] === 'full' ? { full: true } : { token: `radius-${m[1]}` } };
  }
  if ((m = /^text-(\w+)$/.exec(u)) && TEXT_SIZES.has(m[1])) {
    const size = px(theme[`--text-${m[1]}`]);
    // CSS line-height is a unitless factor here, inherited like Flutter's TextStyle.height.
    return { fontSize: size, lineHeightFactor: px(theme[`--text-${m[1]}--line-height`]) };
  }
  if ((m = /^font-(medium|semibold|bold|normal)$/.exec(u))) {
    return { fontWeight: parseInt(theme[`--font-weight-${m[1]}`], 10) };
  }
  if ((m = /^shadow-(xs|sm|md)$/.exec(u))) return { shadow: parseShadow(theme[`--shadow-${m[1]}`]) };
  if ((m = /^opacity-(\d+)$/.exec(u))) return { opacity: parseInt(m[1], 10) / 100 };
  if ((m = /^ring-\[(\d+)px\]$/.exec(u))) return { ringWidth: parseInt(m[1], 10) };
  for (const [prefix, key] of [['bg-', 'bg'], ['text-', 'fg'], ['border-', 'borderColor'], ['ring-', 'ringColor']]) {
    if (u.startsWith(prefix)) {
      const c = colorRef(u.slice(prefix.length), tokens);
      if (c) return { [key]: c };
    }
  }
  return null;
}

/** Splits `dark:hover:bg-x/50` into variants and utility, respecting brackets. */
export function splitVariants(cls) {
  const parts = [];
  let depth = 0;
  let cur = '';
  for (const ch of cls) {
    if (ch === '[') depth++;
    if (ch === ']') depth--;
    if (ch === ':' && depth === 0) { parts.push(cur); cur = ''; } else cur += ch;
  }
  parts.push(cur);
  return { variants: parts.slice(0, -1), utility: parts[parts.length - 1] };
}

/**
 * Maps a class list (one cva part) to rules. `base` holds conditions the caller adds
 * (variant/size selection). Returns { rules, noops, unsupported }.
 */
export function mapClasses(classString, { theme, tokens, base = {}, order }) {
  const out = { rules: [], noops: [], unsupported: [] };
  for (const cls of classString.split(/\s+/).filter(Boolean)) {
    const { variants, utility: u } = splitVariants(cls);
    const unsupportedVariant = variants.find((v) => UNSUPPORTED_VARIANTS[v]);
    if (unsupportedVariant) {
      out.unsupported.push({ what: cls, why: UNSUPPORTED_VARIANTS[unsupportedVariant], fallback: 'ignored' });
      continue;
    }
    if (NOOPS[u]) { out.noops.push({ class: cls, why: NOOPS[u] }); continue; }
    if (UNSUPPORTED[u]) { out.unsupported.push({ what: cls, ...UNSUPPORTED[u] }); continue; }

    const when = { ...base, states: [] };
    let target = 'root';
    const spec = [0, 1, 0];
    for (const v of variants) {
      const def = VARIANTS[v];
      if (!def) throw new Error(`unmapped Tailwind variant "${v}" in "${cls}"`);
      if (def.target) { target = def.target; continue; }
      def.spec.forEach((s, i) => (spec[i] += s));
      if (def.when.state) when.states.push(def.when.state);
      else Object.assign(when, def.when);
    }
    const set = utility(u, theme, tokens);
    if (!set) throw new Error(`unmapped Tailwind class "${cls}"`);
    when.states.sort();
    if (when.states.length === 0) delete when.states;
    const o = order.get(cls);
    if (o === undefined || o === null) throw new Error(`Tailwind does not know class "${cls}"`);
    out.rules.push({ when, target, set, from: cls, spec, order: o });
  }
  return out;
}

/** CSS cascade: lower specificity first, then Tailwind's stylesheet order. Later rules win. */
export function cascadeSort(rules) {
  const cmp = (a, b) => {
    for (let i = 0; i < 3; i++) if (a.spec[i] !== b.spec[i]) return a.spec[i] - b.spec[i];
    return a.order < b.order ? -1 : a.order > b.order ? 1 : 0;
  };
  return [...rules].sort(cmp).map(({ order, ...rule }) => rule);
}
