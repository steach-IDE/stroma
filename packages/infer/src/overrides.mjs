// Overrides: a hand-written file that renames and annotates an inferred DSIR. Inference names what the browser shows
// it (`Btn` from `cds--btn`, `radius-minus2`); a person wants the design system's own names, and the inferred file can't
// be edited by hand because re-inferring would write the old names back. Overrides rename and annotate; they never
// change a measured value or a rule's condition.
//
//   {
//     "components": { "Btn": { "name": "Button", "role": "button", "slots": { "children": { "kind": "content" } } } },
//     "tokens": { "color": { "cds-background": "background" }, "radius": { "radius-minus2": "radius-md" } }
//   }
//
// Anything an override names that does not exist, a rename onto a name that is taken, and any key it does not know
// fail, naming it.
const COLOR_KEYS = ['bg', 'fg', 'borderColor', 'ringColor'];

export function applyOverrides(dsir, overrides) {
  const doc = structuredClone(dsir);
  const fail = (message) => { throw new Error(`overrides: ${message}`); };
  const known = (obj, keys, where) => { for (const k of Object.keys(obj)) if (!keys.includes(k)) fail(`${where} has an unknown key "${k}" (known: ${keys.join(', ')})`); };
  known(overrides, ['components', 'tokens'], 'the file');
  known(overrides.tokens ?? {}, ['color', 'radius'], 'tokens');

  // Colour tokens: renamed in the token table and in every rule that uses them.
  const colour = overrides.tokens?.color ?? {};
  for (const [from, to] of Object.entries(colour)) {
    if (!(from in doc.tokens.color)) fail(`colour token "${from}" does not exist (have: ${Object.keys(doc.tokens.color).join(', ') || 'none'})`);
    if (to !== from && (to in doc.tokens.color || Object.values(colour).filter((t) => t === to).length > 1)) fail(`cannot rename colour token "${from}" to "${to}": that name is taken`);
  }
  doc.tokens.color = Object.fromEntries(Object.entries(doc.tokens.color).map(([k, v]) => [colour[k] ?? k, v]));
  for (const c of doc.components) {
    for (const r of c.rules) for (const key of COLOR_KEYS) if (r.set[key]?.token in colour) r.set[key].token = colour[r.set[key].token];
  }

  // Radius steps: the derived table's key and every `radius` rule use it, named with their `radius-` prefix.
  const radius = overrides.tokens?.radius ?? {};
  const derived = doc.tokens.radius?.derived ?? {};
  const step = (token, what) => {
    if (!token.startsWith('radius-')) fail(`radius token "${token}" must be written with its radius- prefix`);
    if (token === 'radius-base') fail('the base radius token cannot be renamed');
    return token.slice('radius-'.length);
  };
  for (const [from, to] of Object.entries(radius)) {
    const [a, b] = [step(from), step(to)];
    if (!(a in derived)) fail(`radius token "${from}" does not exist (have: ${Object.keys(derived).map((k) => `radius-${k}`).join(', ') || 'none'})`);
    if (b !== a && (b in derived || Object.keys(radius).filter((f) => radius[f] === to).length > 1)) fail(`cannot rename radius token "${from}" to "${to}": that name is taken`);
  }
  if (Object.keys(radius).length) {
    const map = Object.fromEntries(Object.entries(radius).map(([f, t]) => [step(f), step(t)]));
    doc.tokens.radius.derived = Object.fromEntries(Object.entries(derived).map(([k, v]) => [map[k] ?? k, v]));
    for (const c of doc.components) for (const r of c.rules) {
      const token = r.set.radius?.token;
      if (token?.startsWith('radius-') && token.slice(7) in map) r.set.radius.token = `radius-${map[token.slice(7)]}`;
    }
  }

  // Components: rename, set the role, set a slot's kind.
  const comps = overrides.components ?? {};
  for (const [name, spec] of Object.entries(comps)) {
    const c = doc.components.find((x) => x.name === name);
    if (!c) fail(`component "${name}" does not exist (have: ${doc.components.map((x) => x.name).join(', ')})`);
    known(spec, ['name', 'role', 'slots'], `component "${name}"`);
    for (const [slot, s] of Object.entries(spec.slots ?? {})) {
      const target = c.slots.find((x) => x.name === slot);
      if (!target) fail(`component "${name}" has no slot "${slot}" (have: ${c.slots.map((x) => x.name).join(', ')})`);
      known(s, ['kind'], `slot "${slot}" of "${name}"`);
      if (s.kind) target.kind = s.kind;
    }
    if ('role' in spec) c.role = spec.role;
  }
  // Renames last, so every override above finds components by the name inference gave them.
  const renamed = Object.entries(comps).filter(([name, spec]) => spec.name && spec.name !== name);
  for (const [name, spec] of renamed) {
    if (doc.components.some((x) => x.name === spec.name) || renamed.filter(([, s]) => s.name === spec.name).length > 1) fail(`cannot rename component "${name}" to "${spec.name}": that name is taken`);
  }
  for (const [name, spec] of renamed) doc.components.find((x) => x.name === name).name = spec.name;
  return doc;
}
