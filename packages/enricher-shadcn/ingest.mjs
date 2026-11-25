// Ingest: pinned shadcn registry snapshots (sources/) -> DSIR (../dsir/).
// Reads only committed files, so a rerun gives byte-identical output offline.
//   node ingest.mjs            write ../dsir
//   node ingest.mjs --check    fail if ../dsir is not what ingest would write

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import * as tailwind from 'tailwindcss';
import { cva as runCva } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';
import { oklchToSrgb, hex } from './oklch.mjs';
import { loadTailwindTheme, mapClasses, cascadeSort, SHADCN_V4_THEME_INLINE } from './tailwind.mjs';

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const SOURCES = path.join(here, 'sources');
const OUT = path.join(here, '..', 'dsir');
const COMPONENT_SOURCES = ['button.json', 'badge.json', 'card.json'];
const THEME_SOURCE = 'colors-neutral.json';
const STYLE_SOURCE = 'index.json';

const read = (f) => fs.readFileSync(path.join(SOURCES, f), 'utf8');
const sha256 = (s) => 'sha256:' + crypto.createHash('sha256').update(s).digest('hex');
const json = (v) => JSON.stringify(v, null, 2) + '\n';
const pkgVersion = (name) =>
  JSON.parse(fs.readFileSync(path.join(here, 'node_modules', name, 'package.json'), 'utf8')).version;

// ---------- tokens ----------

export function buildTokens() {
  const { cssVarsV4 } = JSON.parse(read(THEME_SOURCE));
  const colors = {};
  const dtcg = { light: { color: {} }, dark: { color: {} } };
  const clamped = [];
  for (const mode of ['light', 'dark']) {
    for (const [name, value] of Object.entries(cssVarsV4[mode])) {
      if (!value.startsWith('oklch(')) continue;
      if (name.startsWith('sidebar') || name.startsWith('chart')) continue; // not used by the spike's components
      const rgb = oklchToSrgb(value);
      if (rgb.clamped) clamped.push(`${mode}.${name}`);
      const [l, c, h] = value.replace(/^oklch\(|\)$/g, '').split('/')[0].trim().split(/\s+/).map(Number);
      dtcg[mode].color[name] = {
        $type: 'color',
        $value: { colorSpace: 'oklch', components: [l, c, h], alpha: rgb.alpha, hex: hex(rgb) },
      };
      (colors[name] ??= {})[mode] = { hex: hex(rgb), alpha: rgb.alpha };
    }
  }
  const radiusRem = parseFloat(cssVarsV4.light.radius);
  const resolver = {
    name: 'shadcn-neutral',
    version: '2025.10',
    sets: [{ name: 'base', sources: [] }],
    modifiers: [{
      name: 'mode',
      default: 'light',
      contexts: { light: [{ $ref: 'light.tokens.json' }], dark: [{ $ref: 'dark.tokens.json' }] },
    }],
    resolutionOrder: ['base', 'mode'],
  };
  return {
    dtcg,
    resolver,
    dsirTokens: {
      color: colors,
      radius: { base: radiusRem * 16, derived: SHADCN_V4_THEME_INLINE.radius },
      font: { sans: { family: 'Inter', note: 'pinned for the oracle; shadcn ships no font in the registry' } },
      gamutClamped: clamped,
    },
  };
}

// ---------- TSX ----------

function literal(node) {
  if (ts.isStringLiteralLike(node)) return node.text;
  if (ts.isObjectLiteralExpression(node)) {
    const o = {};
    for (const p of node.properties) {
      const key = p.name.text ?? p.name.getText();
      o[key] = literal(p.initializer);
    }
    return o;
  }
  throw new Error(`unsupported literal: ${node.getText()}`);
}

export function parseComponentFile(source) {
  const sf = ts.createSourceFile('c.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const cva = [];
  const functions = [];
  const visit = (node) => {
    if (ts.isCallExpression(node) && node.expression.getText() === 'cva') {
      cva.push({ base: literal(node.arguments[0]), config: literal(node.arguments[1]) });
    }
    if (ts.isFunctionDeclaration(node) && node.name) {
      const fn = { name: node.name.text, slot: null, className: null, element: null };
      const inner = (n) => {
        if (ts.isJsxSelfClosingElement(n)) {
          fn.element = n.tagName.getText();
          for (const a of n.attributes.properties) {
            if (!ts.isJsxAttribute(a)) continue;
            const name = a.name.getText();
            if (name === 'data-slot' && ts.isStringLiteral(a.initializer)) fn.slot = a.initializer.text;
            if (name === 'className' && a.initializer && ts.isJsxExpression(a.initializer)) {
              const call = a.initializer.expression;
              const first = call.arguments?.[0];
              if (first && ts.isStringLiteralLike(first)) fn.className = first.text;
            }
          }
        }
        ts.forEachChild(n, inner);
      };
      inner(node);
      functions.push(fn);
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return { cva, functions };
}

// ---------- components ----------

const ROLES = { Button: 'button', Badge: 'status', Card: 'group' };

/**
 * An svg rule means an icon slot plus one label child (Button, Badge). Otherwise a flex or grid
 * box takes children and a block box takes one child.
 */
function slotsFor(rules, extra = []) {
  const flex = rules.some((r) => r.target === 'root' && r.set.layout);
  const icon = rules.some((r) => r.target === 'icon');
  return [
    ...(icon ? [{ name: 'icon', kind: 'leading', optional: true }] : []),
    { name: flex && !icon ? 'children' : 'child', kind: 'content' },
    ...extra,
  ];
}

/** `* { @apply ... }` and `body { @apply ... }` from the style's base layer. */
function globalsFrom(indexItem, ctx) {
  const layer = indexItem.css['@layer base'];
  const out = {};
  for (const [selector, body] of Object.entries(layer)) {
    const apply = Object.keys(body)[0].replace(/^@apply\s+/, '');
    out[selector] = mapClasses(apply, ctx);
  }
  return out;
}

/** Every combination of cva axis values, e.g. [{ variant: 'default', size: 'sm' }, ...]. */
function combinations(variants) {
  return Object.entries(variants).reduce(
    (acc, [axis, options]) => acc.flatMap((c) => Object.keys(options).map((o) => ({ ...c, [axis]: o }))),
    [{}],
  );
}

/**
 * shadcn's cn() runs tailwind-merge before the browser sees the classes, so a variant's
 * class removes a conflicting base class (focus-visible:ring-destructive/20 removes
 * focus-visible:ring-ring/50). Run the real cva and twMerge per combination and record,
 * on each rule, the combinations where it was merged away.
 */
function applyTailwindMerge(rules, base, config) {
  const fn = runCva(base, config);
  const combos = combinations(config.variants);
  const survivors = combos.map((c) => new Set(twMerge(fn(c)).split(/\s+/)));
  const axes = Object.keys(config.variants);
  for (const rule of rules) {
    const applies = combos.map((c) => axes.every((a) => rule.when[a] === undefined || rule.when[a] === c[a]));
    const removed = combos.filter((c, i) => applies[i] && !survivors[i].has(rule.from));
    if (removed.length === 0) continue;
    // Collapse to whole axis values where every combination with that value was removed.
    const except = [];
    const covered = new Set();
    for (const axis of axes) {
      for (const value of Object.keys(config.variants[axis])) {
        const all = combos.filter((c, i) => applies[i] && c[axis] === value);
        if (all.length && all.every((c) => removed.includes(c))) {
          except.push({ [axis]: value });
          all.forEach((c) => covered.add(c));
        }
      }
    }
    for (const c of removed) if (!covered.has(c)) except.push(c);
    rule.except = except;
  }
  return rules;
}

function componentFromCva(name, slot, { base, config }, ctx) {
  const all = { rules: [], noops: [], unsupported: [] };
  const add = (r) => { for (const k of Object.keys(all)) all[k].push(...r[k]); };
  add(mapClasses(base, ctx));
  for (const [axis, options] of Object.entries(config.variants)) {
    for (const [option, classes] of Object.entries(options)) {
      add(mapClasses(classes, { ...ctx, base: { [axis]: option } }));
    }
  }
  applyTailwindMerge(all.rules, base, config);
  // `* { outline-ring/50 }` only styles the browser's own focus outline, which a focusable element
  // shows unless it sets outline-none. Flutter has no such outline (found by the visual oracle).
  if (!base.split(/\s+/).includes('outline-none')) {
    all.unsupported.push({
      what: 'browser focus outline (outline-ring/50 from the base layer, no outline-none)',
      why: 'a focused <a> or <button> also gets the browser\'s own outline (outline-style: auto); Flutter has none',
      fallback: 'the focus-visible ring only',
    });
  }
  return {
    name,
    slot,
    role: ROLES[name],
    behaviour: null,
    variants: Object.fromEntries(Object.entries(config.variants).map(([a, o]) => [a, Object.keys(o)])),
    defaultVariants: config.defaultVariants,
    slots: slotsFor(all.rules),
    rules: cascadeSort(all.rules),
    noops: all.noops,
    unsupported: all.unsupported,
  };
}

function componentFromClassName(fn, ctx) {
  const r = mapClasses(fn.className, ctx);
  return {
    name: fn.name,
    slot: fn.slot,
    role: ROLES[fn.name] ?? null,
    behaviour: null,
    variants: {},
    defaultVariants: {},
    // has-data-[slot=card-action] names a child by its data-slot, which becomes a named slot here.
    slots: slotsFor(r.rules, r.rules.some((x) => x.when.hasSlot === 'action')
      ? [{ name: 'action', kind: 'trailing', optional: true, dataSlot: 'card-action' }]
      : []),
    rules: cascadeSort(r.rules),
    noops: r.noops,
    unsupported: r.unsupported,
  };
}

async function classOrder(tokenNames, classes) {
  const inline = [
    ...tokenNames.map((t) => `--color-${t}: var(--${t});`),
    ...Object.entries(SHADCN_V4_THEME_INLINE.radius).map(([k, d]) => `--radius-${k}: calc(var(--radius) + ${d}px);`),
  ].join(' ');
  const css = `@import "tailwindcss"; @custom-variant dark (&:is(.dark *)); @theme inline { ${inline} }`;
  const ds = await tailwind.__unstable__loadDesignSystem(css, {
    base: here,
    loadStylesheet: async (id, base) => ({
      path: id,
      base,
      content: fs.readFileSync(require.resolve(id === 'tailwindcss' ? 'tailwindcss/index.css' : id), 'utf8'),
    }),
  });
  return new Map(ds.getClassOrder(classes));
}

export async function ingest() {
  const tokens = buildTokens();
  const theme = loadTailwindTheme();
  const tokenNames = Object.keys(tokens.dsirTokens.color);
  const files = COMPONENT_SOURCES.map((f) => ({ file: f, item: JSON.parse(read(f)) }));
  const parsed = files.map(({ file, item }) => ({ file, item, ...parseComponentFile(item.files[0].content) }));

  const allClasses = new Set();
  for (const p of parsed) {
    for (const c of p.cva) {
      c.base.split(/\s+/).forEach((x) => allClasses.add(x));
      for (const o of Object.values(c.config.variants)) for (const v of Object.values(o)) v.split(/\s+/).forEach((x) => allClasses.add(x));
    }
    for (const f of p.functions) f.className?.split(/\s+/).forEach((x) => allClasses.add(x));
  }
  const styleLayer = JSON.parse(read(STYLE_SOURCE)).css['@layer base'];
  for (const body of Object.values(styleLayer)) Object.keys(body)[0].replace(/^@apply\s+/, '').split(/\s+/).forEach((x) => allClasses.add(x));
  allClasses.delete('');
  const order = await classOrder(tokenNames, [...allClasses].sort());
  const ctx = { theme, tokens: new Set(tokenNames), order };
  const globals = globalsFrom(JSON.parse(read(STYLE_SOURCE)), ctx);

  const components = [];
  for (const p of parsed) {
    if (p.cva.length) {
      const fn = p.functions[0];
      components.push(componentFromCva(fn.name, fn.slot, p.cva[0], ctx));
    } else {
      for (const fn of p.functions) components.push(componentFromClassName(fn, ctx));
    }
  }

  const tailwindVersion = pkgVersion('tailwindcss');
  const lock = {
    sources: Object.fromEntries([...COMPONENT_SOURCES, THEME_SOURCE, STYLE_SOURCE].map((f) => [f, sha256(read(f))])),
    'tailwind-merge': pkgVersion('tailwind-merge'),
    'class-variance-authority': pkgVersion('class-variance-authority'),
    tailwindcss: { version: tailwindVersion, themeCss: sha256(fs.readFileSync(require.resolve('tailwindcss/theme.css'), 'utf8')) },
  };
  const dsir = {
    dsirVersion: '0.1.0',
    source: {
      kind: 'shadcn-registry',
      style: 'new-york-v4',
      url: 'https://ui.shadcn.com/r/styles/new-york-v4',
      license: 'MIT',
      hash: sha256(json(lock.sources)),
    },
    tokens: tokens.dsirTokens,
    globals: Object.fromEntries(Object.entries(globals).map(([k, v]) => [k, { rules: cascadeSort(v.rules), noops: v.noops }])),
    components,
  };
  return {
    'shadcn.dsir.json': json(dsir),
    'dsir.lock': json(lock),
    'tokens/light.tokens.json': json(tokens.dtcg.light),
    'tokens/dark.tokens.json': json(tokens.dtcg.dark),
    'tokens/shadcn.resolver.json': json(tokens.resolver),
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const out = await ingest();
  const check = process.argv.includes('--check');
  let stale = 0;
  for (const [rel, content] of Object.entries(out)) {
    const p = path.join(OUT, rel);
    if (check) {
      if (!fs.existsSync(p) || fs.readFileSync(p, 'utf8') !== content) { console.error(`stale: dsir/${rel}`); stale++; }
    } else {
      fs.mkdirSync(path.dirname(p), { recursive: true });
      fs.writeFileSync(p, content);
    }
  }
  if (stale) process.exit(1);
  console.log(check ? 'dsir is up to date' : `wrote ${Object.keys(out).length} files to dsir/`);
}
