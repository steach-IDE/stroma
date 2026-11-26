// One measured element -> DSIR style values. Only properties an author rule declares are kept, and colour,
// radius and spacing values keep the token their winning declaration refers to.

/** DSIR style key -> the authored property names that declare it (shorthands included). */
const DECLARED_BY = {
  h: ['height', 'block-size'],
  w: ['width', 'inline-size'],
  px: ['padding', 'padding-inline', 'padding-left', 'padding-right'],
  py: ['padding', 'padding-block', 'padding-top', 'padding-bottom'],
  gap: ['gap', 'column-gap', 'row-gap'],
  radius: ['border-radius'],
  bg: ['background-color', 'background'],
  fg: ['color'],
  borderWidth: ['border', 'border-width', 'border-top-width'],
  borderColor: ['border-color', 'border-top-color'],
  fontSize: ['font-size', 'font'],
  lineHeightFactor: ['line-height', 'font'],
  fontWeight: ['font-weight', 'font'],
  opacity: ['opacity'],
  underline: ['text-decoration-line', 'text-decoration'],
  maxLines: ['white-space'],
  clip: ['overflow', 'overflow-x', 'overflow-y'],
  layout: ['display', 'flex-direction'],
  crossAlign: ['align-items'],
  mainAlign: ['justify-content'],
  columns: ['grid-template-columns'],
  transitionMs: ['transition', 'transition-duration', 'transition-property'],
  transitionCurve: ['transition', 'transition-timing-function'],
};
const SHADOW_DECLS = ['box-shadow', '--tw-shadow', '--tw-ring-shadow'];
const RING_COLOR_DECLS = ['--tw-ring-color'];
const SPACING_KEYS = ['h', 'w', 'px', 'py', 'gap'];

const px = (v) => (v.endsWith('px') ? Number.parseFloat(v) : null);
const round = (n) => Math.round(n * 10000) / 10000;

/** The last declaration of any of `names` in cascade order: the one that wins. */
function winning(rules, names) {
  let found = null;
  for (const r of rules) for (const [n, v] of r.decls) if (names.includes(n)) found = v;
  return found;
}

/** A colour declaration -> a DSIR colour reference, or null when it isn't a token reference. */
export function colorRef(value) {
  if (value == null) return null;
  const v = value.trim();
  if (v === 'transparent' || v === '#0000') return { transparent: true };
  let m = /^var\(\s*--([\w-]+)\s*\)$/.exec(v);
  if (m) return { token: m[1], alpha: 1 };
  m = /^color-mix\(in oklab,\s*var\(\s*--([\w-]+)\s*\)\s+([\d.]+)%,\s*transparent\)$/.exec(v);
  if (m) return { token: m[1], alpha: round(Number.parseFloat(m[2]) / 100) };
  return null;
}

/** Splits a computed box-shadow list into a ring (spread only, no offset or blur) and real shadows. */
function shadows(computed) {
  if (!computed || computed === 'none') return { ring: null, shadow: [] };
  let ring = null;
  const shadow = [];
  for (const p of computed.split(/,(?![^(]*\))/).map((s) => s.trim())) {
    const color = /^(\S+\([^)]*\)|#\w+|\w+)/.exec(p)?.[1] ?? '';
    const [x, y, blur, spread] = [...p.slice(color.length).trim().split(/\s+/).filter((t) => t && t !== 'inset').map(px), 0, 0, 0, 0];
    if (x === 0 && y === 0 && blur === 0 && spread === 0) continue; // Tailwind's empty shadow layers
    if (x === 0 && y === 0 && blur === 0 && spread > 0) ring = { width: spread, color };
    else shadow.push({ x, y, blur, spread, color });
  }
  return { ring, shadow };
}

/**
 * The DSIR values one element shows in one cell. Returns { values, tokenized }; `tokenized` says, for colour,
 * radius and spacing keys, whether the winning declaration named a token (for the report).
 * `literalColor(css)` turns a computed colour into { hex, alpha }.
 */
export function valuesOf(el, literalColor, force = new Set()) {
  const s = el.style;
  // A key some cell declares is in play: its computed value counts everywhere, declared here or not.
  const authored = (key) => winning(el.rules, DECLARED_BY[key]) != null;
  // Width and height are only style where declared; elsewhere they're layout results (content size), not values.
  const declared = (key) => authored(key) || (force.has(key) && key !== 'h' && key !== 'w');
  const values = {};
  const tokenized = {};
  const set = (key, value, isToken) => {
    if (value === null || value === undefined) return;
    values[key] = value;
    if (isToken !== undefined) tokenized[key] = isToken;
  };

  const PROP = { h: 'height', w: 'width', px: 'padding-left', py: 'padding-top', gap: 'column-gap' };
  for (const key of SPACING_KEYS) {
    if (!declared(key)) continue;
    const v = s[PROP[key]] === 'normal' ? 0 : px(s[PROP[key]]);
    set(key, v === null ? null : round(v), /var\(--spacing\)/.test(winning(el.rules, DECLARED_BY[key]) ?? ''));
  }
  if (declared('py') && s['padding-bottom'] !== s['padding-top']) {
    set('pt', px(s['padding-top']));
    set('pb', px(s['padding-bottom']));
    delete values.py;
    delete tokenized.py;
  }

  if (declared('radius')) {
    const decl = (winning(el.rules, DECLARED_BY.radius) ?? '').replace(/\+\s*-/, '- ');
    const off = /^calc\(var\(--radius\)\s*([+-])\s*([\d.]+)px\)$/.exec(decl);
    if (/infinity/.test(decl)) set('radius', { full: true }, true);
    else if (decl.trim() === 'var(--radius)') set('radius', { token: 'radius-base' }, true);
    else if (off) set('radius', { token: `radius-${off[1] === '-' ? 'minus' : 'plus'}${Number.parseFloat(off[2])}` }, true);
    else set('radius', px(s['border-top-left-radius']), false);
  }

  for (const [key, prop] of [['bg', 'background-color'], ['fg', 'color'], ['borderColor', 'border-top-color']]) {
    if (!declared(key)) continue;
    const ref = colorRef(winning(el.rules, DECLARED_BY[key]));
    set(key, ref ?? literalColor(s[prop]), Boolean(ref?.token));
  }
  if (declared('borderWidth')) set('borderWidth', px(s['border-top-width']));

  if (winning(el.rules, SHADOW_DECLS) != null || force.has('ringWidth') || force.has('shadow')) {
    const { ring, shadow } = shadows(s['box-shadow']);
    if (ring) {
      set('ringWidth', ring.width);
      const ref = colorRef(winning(el.rules, RING_COLOR_DECLS));
      set('ringColor', ref ?? literalColor(ring.color), Boolean(ref?.token));
    }
    if (shadow.length) {
      set('shadow', shadow.map((sh) => {
        const c = literalColor(sh.color);
        const rgb = [1, 3, 5].map((i) => Number.parseInt(c.hex.slice(i, i + 2), 16));
        return { x: sh.x, y: sh.y, blur: sh.blur, spread: sh.spread, color: { rgb, alpha: c.alpha } };
      }));
    }
  }

  if (declared('fontSize')) set('fontSize', px(s['font-size']));
  if (declared('lineHeightFactor') && s['line-height'] !== 'normal') set('lineHeightFactor', round(px(s['line-height']) / px(s['font-size'])));
  if (declared('fontWeight')) set('fontWeight', Number.parseInt(s['font-weight'], 10));
  if (declared('opacity')) set('opacity', round(Number.parseFloat(s.opacity)));
  if (declared('underline')) set('underline', s['text-decoration-line'].includes('underline'));
  if (declared('maxLines') && s['white-space'] === 'nowrap') set('maxLines', 1);
  if (declared('clip')) set('clip', s['overflow-x'] === 'hidden' || s['overflow-y'] === 'hidden');

  if (declared('layout')) {
    const d = s.display;
    const column = s['flex-direction'].startsWith('column');
    set('layout', d === 'grid' ? 'grid' : d === 'flex' ? (column ? 'column' : 'row')
      : d === 'inline-flex' ? (column ? 'column' : 'inlineRow') : d === 'block' ? 'block' : null);
  }
  const align = (v) => ({ center: 'center', start: 'start', 'flex-start': 'start', end: 'end', 'flex-end': 'end' })[v] ?? null;
  if (declared('crossAlign')) set('crossAlign', align(s['align-items']));
  if (declared('mainAlign')) set('mainAlign', align(s['justify-content']));
  if (declared('columns')) {
    const decl = winning(el.rules, DECLARED_BY.columns);
    if (decl && decl !== 'none') set('columns', decl.split(/\s+/));
  }
  if (declared('transitionMs')) {
    const d = s['transition-duration'];
    const ms = Number.parseFloat(d) * (d.endsWith('ms') ? 1 : 1000);
    if (ms > 0) {
      set('transitionMs', round(ms));
      set('transitionCurve', s['transition-timing-function']);
    }
  }
  return { values, tokenized };
}
