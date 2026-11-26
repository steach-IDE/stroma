// DSIR 0.1 (the Scrib spike's format) -> 0.2. Pure: the same input gives the same output.
//  - dsirVersion becomes 0.2.0.
//  - Every rule gets provenance "enricher": 0.1 rules were read from source code, never measured.
//  - behaviour: 0.1 always held null; a component whose role is "button" becomes the button pattern.

const BEHAVIOUR_BY_ROLE = { button: 'button' };

export function migrate01to02(doc) {
  if (!/^0\.1\.\d+$/.test(doc.dsirVersion ?? '')) throw new Error(`expected a DSIR 0.1.x, got "${doc.dsirVersion}"`);
  const rule = (r) => ({ ...r, provenance: 'enricher' });
  return {
    ...doc,
    dsirVersion: '0.2.0',
    globals: Object.fromEntries(
      Object.entries(doc.globals).map(([sel, g]) => [sel, { ...g, rules: g.rules.map(rule) }]),
    ),
    components: doc.components.map((c) => ({
      ...c,
      behaviour: c.behaviour ?? BEHAVIOUR_BY_ROLE[c.role] ?? null,
      rules: c.rules.map(rule),
    })),
  };
}
