// Compares an inferred DSIR with a source-derived one: what rendering kept and what it lost.
const COLOR_KEYS = ['bg', 'fg', 'borderColor', 'ringColor'];
// Key order carries no meaning in variants or defaults.
const same = (a, b) => JSON.stringify(Object.entries(a).sort()) === JSON.stringify(Object.entries(b).sort());

function colourTokens(component) {
  const out = new Set();
  for (const r of component.rules) for (const k of COLOR_KEYS) if (r.set[k]?.token) out.add(r.set[k].token);
  return out;
}

export function compare(inferred, source) {
  const byName = new Map(source.components.map((c) => [c.name, c]));
  const components = {};
  for (const c of inferred.components) {
    const s = byName.get(c.name);
    if (!s) { components[c.name] = { inSource: false }; continue; }
    const [mine, theirs] = [colourTokens(c), colourTokens(s)];
    components[c.name] = {
      inSource: true,
      rules: { inferred: c.rules.length, source: s.rules.length },
      variantsMatch: same(c.variants, s.variants),
      defaultsMatch: same(c.defaultVariants, s.defaultVariants),
      colourTokens: {
        both: [...mine].filter((t) => theirs.has(t)).sort(),
        inferredOnly: [...mine].filter((t) => !theirs.has(t)).sort(),
        sourceOnly: [...theirs].filter((t) => !mine.has(t)).sort(),
      },
    };
  }
  const missing = source.components.map((c) => c.name).filter((n) => !inferred.components.some((c) => c.name === n));
  return { components, missingFromInferred: missing };
}
