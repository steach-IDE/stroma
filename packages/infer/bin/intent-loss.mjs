#!/usr/bin/env node
// stroma-intent-loss --inferred <dsir> --source <dsir>
// What rendering kept and what it lost: the facts a source-derived DSIR holds (named tokens, class names, roles,
// slots) against what the DSIR inferred from the same design system's renders holds. Prints one table.
import fs from 'node:fs';

const arg = (n) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : null; };
const [inferredPath, sourcePath] = [arg('inferred'), arg('source')];
if (!inferredPath || !sourcePath) {
  console.error('usage: stroma-intent-loss --inferred <dsir> --source <dsir>');
  process.exit(2);
}
const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const [inf, src] = [read(inferredPath), read(sourcePath)];
const byName = new Map(inf.components.map((c) => [c.name, c]));

const COLOR_KEYS = ['bg', 'fg', 'borderColor', 'ringColor'];
const colourTokens = (c) => new Set(c.rules.flatMap((r) => COLOR_KEYS.map((k) => r.set[k]?.token).filter(Boolean)));
/** A radius token's offset from --radius, in px: `radius-md` -> -2 via the DSIR's own scale. */
const offsetOf = (dsir, token) => {
  const name = token.replace(/^radius-/, '');
  if (name === 'base') return 0;
  const m = /^(minus|plus)([\d.]+)$/.exec(name);
  return m ? (m[1] === 'minus' ? -1 : 1) * Number.parseFloat(m[2]) : dsir.tokens.radius.derived?.[name];
};
const radiusRefs = (dsir, c) => c.rules.map((r) => r.set.radius?.token).filter(Boolean).map((t) => ({ name: t, px: offsetOf(dsir, t) }));

const rows = { colour: [0, 0], radiusValue: [0, 0], radiusName: [0, 0], role: [0, 0], slots: [0, 0], axes: [0, 0] };
const add = (k, hit, total = 1) => { rows[k][0] += hit; rows[k][1] += total; };
for (const s of src.components) {
  const i = byName.get(s.name);
  if (!i) { add('role', 0); add('slots', 0); add('axes', 0); continue; }
  const [a, b] = [colourTokens(s), colourTokens(i)];
  add('colour', [...a].filter((t) => b.has(t)).length, a.size);
  const sr = radiusRefs(src, s);
  const ir = new Set(radiusRefs(inf, i).map((r) => r.px));
  const iNames = new Set(radiusRefs(inf, i).map((r) => r.name));
  for (const r of sr) { add('radiusValue', ir.has(r.px) ? 1 : 0); add('radiusName', iNames.has(r.name) ? 1 : 0); }
  add('role', s.role === i.role ? 1 : 0);
  add('slots', JSON.stringify(s.slots.map((x) => x.kind).sort()) === JSON.stringify(i.slots.map((x) => x.kind).sort()) ? 1 : 0);
  add('axes', JSON.stringify(Object.entries(s.variants).sort()) === JSON.stringify(Object.entries(i.variants).sort()) ? 1 : 0);
}
const pct = ([h, t]) => (t ? `${h}/${t} (${Math.round((100 * h) / t)}%)` : 'n/a');
const sourceRules = src.components.reduce((n, c) => n + c.rules.length, 0);
const inferredRules = inf.components.reduce((n, c) => n + c.rules.length, 0);
console.log([
  `colour tokens a component uses, recovered by name   ${pct(rows.colour)}`,
  `radius references, same value in px                  ${pct(rows.radiusValue)}`,
  `radius references, same token name                   ${pct(rows.radiusName)}`,
  `variant axes and options identical                   ${pct(rows.axes)}`,
  `component roles identical                            ${pct(rows.role)}`,
  `slot kinds identical                                 ${pct(rows.slots)}`,
  `rules: source ${sourceRules}, inferred ${inferredRules}; every source rule names its class (\`from\`), no inferred rule can`,
].join('\n'));
