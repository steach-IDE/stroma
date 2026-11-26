// An extraction (packages/extractor) -> a DSIR. Each marked part (data-slot, data-part, data-scope) becomes a
// component; a part that is itself the root of some story is a component of its own, never a part of another.
// Rules are mined per style key over every cell (see mine.mjs) and every cell is checked against them:
// what no rule explains goes in `unsupported`, never smoothed over.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { valuesOf } from './values.mjs';
import { mine } from './mine.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const { oklchToSrgb, hex } = await import(path.join(here, '..', '..', 'enricher-shadcn', 'oklch.mjs'));
const { validate } = await import(path.join(here, '..', '..', 'dsir', 'src', 'validate.mjs'));

const COLOR_KEYS = ['bg', 'fg', 'borderColor', 'ringColor'];
const SPACING_KEYS = ['h', 'w', 'px', 'py', 'pt', 'pb', 'gap'];
const slotOf = (e) => e.attrs['data-slot'] ?? e.attrs['data-part'] ?? e.attrs['data-scope'] ?? null;
const pascal = (slot) => slot.split(/[-_]/).map((w) => w[0].toUpperCase() + w.slice(1)).join('');
const round = (n) => Math.round(n * 1000) / 1000;

/** A computed CSS colour -> { hex, alpha }. Throws on a format it doesn't know, never guesses. */
export function literalColor(css) {
  const v = css.trim();
  let m = /^oklch\((.+)\)$/.exec(v);
  if (m) {
    const c = oklchToSrgb(v);
    return { hex: hex(c), alpha: c.alpha };
  }
  m = /^oklab\(\s*([^\s]+)\s+([^\s]+)\s+([^\s/]+)\s*(?:\/\s*([^\s)]+))?\s*\)$/.exec(v);
  if (m) {
    const L = m[1].endsWith('%') ? Number.parseFloat(m[1]) / 100 : Number.parseFloat(m[1]);
    const [a, b] = [Number.parseFloat(m[2]), Number.parseFloat(m[3])];
    const h = ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360;
    return literalColor(`oklch(${L} ${Math.hypot(a, b)} ${h}${m[4] ? ` / ${m[4]}` : ''})`);
  }
  m = /^rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\s*\)$/.exec(v);
  if (m) return { hex: hex({ r: +m[1], g: +m[2], b: +m[3] }), alpha: m[4] === undefined ? 1 : round(+m[4]) };
  m = /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(v);
  if (m) {
    const x = m[1].length <= 4 ? [...m[1]].map((ch) => ch + ch).join('') : m[1];
    return { hex: `#${x.slice(0, 6).toLowerCase()}`, alpha: x.length === 8 ? round(Number.parseInt(x.slice(6), 16) / 255) : 1 };
  }
  throw new Error(`a colour Stroma can't read yet: ${css}`);
}

/** Splits one cell's elements into parts: { slot, el, index }, skipping nested components and their insides. */
function partsOf(elements, componentSlots) {
  const skip = new Set();
  const parts = [];
  elements.forEach((el, i) => {
    if (el.parent >= 0 && skip.has(el.parent)) { skip.add(i); return; }
    const slot = slotOf(el);
    if (i > 0 && slot && componentSlots.has(slot)) { skip.add(i); return; }
    if (slot) parts.push({ slot, el, index: i });
  });
  return { parts, skip };
}

/** The nearest part ancestor's index for every element (or -1), following `parent`. */
function partParent(elements, index, partIndices) {
  let p = elements[index].parent;
  while (p >= 0 && !partIndices.has(p)) p = elements[p].parent;
  return p;
}

export function infer({ extraction, license, source }) {
  const indexText = fs.readFileSync(path.join(extraction, 'index.json'), 'utf8');
  const index = JSON.parse(indexText);
  const cells = index.cells.map((c) => ({ ...c, data: JSON.parse(fs.readFileSync(path.join(extraction, c.file), 'utf8')) }));
  const componentSlots = new Set(cells.map((c) => slotOf(c.data.elements[0])));

  // Pass 1: which keys some cell declares, per part (and per part's icon).
  const inPlay = new Map();
  for (const cell of cells) {
    const els = cell.data.elements;
    for (const part of partsOf(els, componentSlots).parts) {
      const slot = inPlay.get(part.slot) ?? { root: new Set(), icon: new Set() };
      Object.keys(valuesOf(part.el, literalColor).values).forEach((k) => slot.root.add(k));
      const svg = els.findIndex((e, i) => e.tag === 'svg' && e.parent === part.index && i > part.index);
      if (svg >= 0) Object.keys(valuesOf(els[svg], literalColor).values).forEach((k) => slot.icon.add(k));
      inPlay.set(part.slot, slot);
    }
  }

  // Pass 2, observations per part slot: one per cell the part appears in.
  const observed = new Map(); // slot -> { role counts, story root?, obs: [{ when, values, tokenized, icon, children }] }
  const tokenValues = {}; // token name -> mode -> literal
  let radiusBase = null;
  let fontFamily = null;
  for (const cell of cells) {
    const els = cell.data.elements;
    const { parts } = partsOf(els, componentSlots);
    const partIndices = new Set(parts.map((p) => p.index));
    const rootSlot = parts[0].slot;
    for (const part of parts) {
      const childSlots = parts.filter((q) => partParent(els, q.index, partIndices) === part.index).map((q) => q.slot);
      const svg = els.findIndex((e, i) => e.tag === 'svg' && e.parent === part.index && i > part.index);
      const when = {
        ...Object.fromEntries(Object.entries(part.slot === rootSlot ? cell.args : {}).map(([k, v]) => [k, String(v)])),
        ...(cell.theme ? { mode: cell.theme } : {}),
        state: cell.state,
        hasIcon: String(svg >= 0),
        interactive: String(part.el.role === 'link'),
        ...Object.fromEntries(childSlots.map((s) => [`hasSlot:${s}`, 'true'])),
      };
      const { values, tokenized } = valuesOf(part.el, literalColor, inPlay.get(part.slot).root);
      const icon = svg >= 0 ? valuesOf(els[svg], literalColor, inPlay.get(part.slot).icon).values : null;
      if (!observed.has(part.slot)) observed.set(part.slot, { roles: new Map(), isRoot: false, story: null, obs: [] });
      const o = observed.get(part.slot);
      o.roles.set(part.el.role, (o.roles.get(part.el.role) ?? 0) + 1);
      if (part.slot === rootSlot) { o.isRoot = true; o.story ??= cell.story; }
      o.obs.push({ when, values, tokenized, icon, children: childSlots });
      for (const [name, value] of Object.entries(part.el.vars)) {
        if (name === '--radius') radiusBase ??= value;
        (tokenValues[name.slice(2)] ??= {})[cell.theme ?? 'light'] ??= value;
      }
      fontFamily ??= part.el.style['font-family'].split(',')[0].replace(/["']/g, '').trim();
    }
  }

  const usedColorTokens = new Set();
  const usedRadii = new Set();
  const components = [];
  const fit = { values: 0, explained: 0 };
  const share = { colour: [0, 0], radius: [0, 0], spacing: [0, 0] }; // [tokenized, all]
  for (const [slot, o] of [...observed.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
    // Fill in absent boolean conditions, so every cell has every dimension.
    const dims = [...new Set(o.obs.flatMap((x) => Object.keys(x.when)))];
    for (const x of o.obs) for (const d of dims) x.when[d] ??= d.startsWith('hasSlot:') ? 'false' : x.when[d];
    const order = ['mode', 'state', 'hasIcon', 'interactive'];
    dims.sort((a, b) => {
      const ia = order.indexOf(a) < 0 ? (a.startsWith('hasSlot:') ? 90 : -1) : order.indexOf(a);
      const ib = order.indexOf(b) < 0 ? (b.startsWith('hasSlot:') ? 90 : -1) : order.indexOf(b);
      return ia - ib || (a < b ? -1 : 1);
    });
    const expressible = (d, v) => (d === 'state' ? v !== 'rest' : d === 'mode' ? true
      : d === 'hasIcon' || d === 'interactive' || d.startsWith('hasSlot:') ? v === 'true' : true);

    const mined = []; // { target, key, rule, rank }
    const unsupported = [];
    for (const target of ['root', 'icon']) {
      const obs = target === 'root' ? o.obs : o.obs.filter((x) => x.icon);
      const keys = [...new Set(obs.flatMap((x) => Object.keys(target === 'root' ? x.values : x.icon)))].sort();
      for (const key of keys) {
        const series = obs.map((x) => ({ when: x.when, value: (target === 'root' ? x.values : x.icon)[key] ?? null }));
        const { rules, wrong } = mine(series, dims, expressible);
        fit.values += series.length;
        fit.explained += series.length - wrong.length;
        for (const rule of rules) mined.push({ target, key, rule });
        if (wrong.length) {
          const w = wrong[0];
          unsupported.push({
            what: `${target === 'icon' ? 'icon ' : ''}${key} in ${wrong.length} of ${series.length} cells`,
            why: `no ordered set of rules explains it; e.g. ${JSON.stringify(w.when)} measured ${JSON.stringify(w.value)}, rules give ${JSON.stringify(w.predicted)}`,
          });
        }
      }
    }
    for (const x of o.obs) {
      for (const [k, t] of Object.entries(x.tokenized)) {
        const cat = COLOR_KEYS.includes(k) ? 'colour' : k === 'radius' ? 'radius' : SPACING_KEYS.includes(k) ? 'spacing' : null;
        if (cat) { share[cat][1]++; if (t) share[cat][0]++; }
      }
    }

    // Cascade order: fewer conditions first; within a key, mining order. Merge rules with identical conditions.
    // mine() gives each rule its place in its own loop (specificity, condition set, group); every key uses the
    // same dims, so sorting by that place keeps each key's verified order and lines equal conditions up.
    const cmp = (x, y) => (x < y ? -1 : x > y ? 1 : 0);
    mined.sort((a, b) => cmp(a.rule.order[0], b.rule.order[0]) || cmp(a.rule.order[1], b.rule.order[1])
      || cmp(a.rule.order[2], b.rule.order[2]) || cmp(a.target, b.target) || cmp(a.key, b.key));
    const rules = [];
    for (const m of mined) {
      const when = {};
      let ok = true;
      for (const [d, v] of Object.entries(m.rule.when)) {
        if (d === 'mode') when.mode = v;
        else if (d === 'state') when.states = [v];
        else if (d === 'hasIcon' || d === 'interactive') when[d] = true;
        else if (d.startsWith('hasSlot:')) { if (when.hasSlot) ok = false; when.hasSlot = d.slice(8); }
        else when[d] = v;
      }
      if (!ok) { unsupported.push({ what: `${m.key} under two slot conditions`, why: 'a DSIR rule holds one hasSlot condition' }); continue; }
      const v = m.rule.value;
      if (COLOR_KEYS.includes(m.key) && v?.token) usedColorTokens.add(v.token);
      if (m.key === 'radius' && v?.token) usedRadii.add(v.token);
      const last = rules.at(-1);
      if (last && last.target === m.target && JSON.stringify(last.when) === JSON.stringify(when) && !(m.key in last.set)) {
        last.set[m.key] = v;
      } else {
        rules.push({ when, target: m.target, set: { [m.key]: v }, from: `measured: ${Object.entries(m.rule.when).map(([d, x]) => `${d}=${x}`).join(', ') || 'every cell'}`, provenance: 'measured' });
      }
    }

    const story = o.isRoot ? index.stories[o.story] : null;
    const roles = [...o.roles.entries()].sort((a, b) => b[1] - a[1]);
    // Child slots in one order consistent with every cell's DOM order (first seen breaks ties).
    const firstSeen = [...new Set(o.obs.flatMap((x) => x.children))];
    const before = new Map(firstSeen.map((c) => [c, new Set()]));
    for (const x of o.obs) x.children.forEach((c, i) => x.children.slice(0, i).forEach((b) => before.get(c).add(b)));
    const children = [];
    while (children.length < firstSeen.length) {
      const next = firstSeen.find((c) => !children.includes(c) && [...before.get(c)].every((b) => children.includes(b)));
      if (!next) throw new Error(`${slot}: its parts appear in conflicting orders`);
      children.push(next);
    }
    const layout = rules.find((r) => r.target === 'root' && r.set.layout && Object.keys(r.when).length === 0)?.set.layout;
    const hasIconRules = rules.some((r) => r.target === 'icon');
    const optional = children.filter((c) => o.obs.some((x) => !x.children.includes(c)));
    components.push({
      name: pascal(slot),
      slot,
      role: roles[0][0],
      behaviour: roles[0][0] === 'button' ? 'button' : null,
      variants: story ? Object.fromEntries(Object.entries(story.axes).map(([k, v]) => [k, v])) : {},
      defaultVariants: story ? story.defaults : {},
      slots: [
        ...(hasIconRules ? [{ name: 'icon', kind: 'leading', optional: true }] : []),
        { name: layout && layout !== 'block' && !hasIconRules ? 'children' : 'child', kind: 'content' },
        ...optional.map((c) => ({ name: c.replace(/-(.)/g, (_, ch) => ch.toUpperCase()), kind: 'content', optional: true, dataSlot: c })),
      ],
      ...(children.length ? { anatomy: { children } } : {}),
      rules,
      noops: [],
      unsupported,
    });
  }

  const color = {};
  for (const name of [...usedColorTokens].sort()) {
    const modes = tokenValues[name];
    if (!modes) throw new Error(`token --${name} is used but its value was never recorded`);
    color[name] = Object.fromEntries(Object.keys(modes).sort().map((m) => [m, literalColor(modes[m])]));
  }
  const remToPx = (v) => (v?.endsWith('rem') ? Number.parseFloat(v) * 16 : Number.parseFloat(v));
  const derived = Object.fromEntries([...usedRadii].filter((t) => t !== 'radius-base').sort().map((t) => {
    const m = /^radius-(minus|plus)([\d.]+)$/.exec(t);
    return [`${m[1]}${m[2]}`, Number.parseFloat(m[2]) * (m[1] === 'minus' ? -1 : 1)];
  }));
  if (usedRadii.has('radius-base')) derived.base = 0;
  const dsir = {
    dsirVersion: '0.3.0',
    source: { kind: 'storybook', url: source, license, hash: `sha256:${crypto.createHash('sha256').update(indexText).digest('hex')}` },
    tokens: {
      color,
      ...(radiusBase ? { radius: { base: remToPx(radiusBase), derived } } : {}),
      ...(fontFamily ? { font: { sans: { family: fontFamily } } } : {}),
    },
    globals: {},
    components,
  };
  const errors = validate(dsir);
  if (errors.length) throw new Error(`inferred an invalid DSIR:\n${errors.map((e) => `${e.path}: ${e.message}`).join('\n')}`);
  const pct = ([a, b]) => (b ? round((100 * a) / b) : null);
  return {
    dsir,
    report: {
      cells: cells.length,
      fit: { ...fit, percent: pct([fit.explained, fit.values]) },
      tokenShare: Object.fromEntries(Object.entries(share).map(([k, v]) => [k, { tokenized: v[0], of: v[1], percent: pct(v) }])),
    },
  };
}
