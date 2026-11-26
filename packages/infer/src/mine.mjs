// Rule mining: given one style key's value in every cell, find an ordered list of conditional rules that
// predicts it, least specific first (the CSS cascade's order: a later rule wins).
//
// A cell is { when: { dim: value }, value }. A dimension value is expressible in a DSIR condition or not
// (`state: rest` and `hasIcon: false` are not: they are what holds when no rule says otherwise).
// A rule's value is the one its cells show when every unwritable condition is at rest (see valueFor).
// Rules are tried by specificity: the base value (no conditions), then each single condition, then each pair,
// and so on. A rule is kept only if it lowers the number of cells predicted wrongly. Every step is in a fixed
// order, so the same cells always give the same rules.

const key = (v) => JSON.stringify(v ?? null);
const cmpOrder = (x, y) => x[0] - y[0] || x[1] - y[1] || (x[2] < y[2] ? -1 : x[2] > y[2] ? 1 : 0);

function mode(values) {
  const counts = new Map();
  for (const v of values) counts.set(key(v), (counts.get(key(v)) ?? 0) + 1);
  // A tie prefers no value (no rule at all), then the smaller JSON string, so the choice never depends on input order.
  const rank = (k) => (k === 'null' ? '' : k);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || (rank(a[0]) < rank(b[0]) ? -1 : 1))[0]?.[0];
}

function subsets(items, k, start = 0, acc = [], out = []) {
  if (acc.length === k) { out.push([...acc]); return out; }
  for (let i = start; i < items.length; i++) subsets(items, k, i + 1, [...acc, items[i]], out);
  return out;
}

/**
 * @param {{ when: Record<string, string>, value: unknown }[]} cells
 * @param {string[]} dims            dimension names, in a fixed order
 * @param {(dim: string, value: string) => boolean} expressible
 * @returns {{ rules: { when: Record<string,string>, value: unknown, order: [number, number, string] }[], wrong: { when: Record<string,string>, value: unknown, predicted: unknown }[] }}
 */
export function mine(cells, dims, expressible) {
  const rules = [];
  const predict = (c) => {
    let v = null;
    for (const r of rules) if (Object.entries(r.when).every(([d, x]) => c.when[d] === x)) v = r.value;
    return key(v);
  };
  const errors = () => cells.filter((c) => predict(c) !== key(c.value)).length;
  // Conditions like `state: rest` or `hasIcon: false` can't be written, only their opposites can. So a rule's
  // value is the one shown where those conditions are at rest: the opposite cases can then be added on top.
  const flagDims = dims.filter((d) => cells.some((c) => c.when[d] !== undefined && !expressible(d, c.when[d])));
  const valueFor = (members, combo) => {
    const atRest = members.filter((c) => flagDims.every((d) => combo.includes(d) || !expressible(d, c.when[d])));
    return mode((atRest.length ? atRest : members).map((c) => c.value));
  };
  const base = valueFor(cells, []);
  if (base !== key(null)) rules.push({ when: {}, value: JSON.parse(base), order: [0, 0, ''] });

  // Greedy mining can keep a rule that a later, better rule makes wrong (it was tried first). So: mine, then
  // drop every rule the predictions don't need, and mine again, until nothing changes.
  for (let pass = 0; pass < 5; pass++) {
    const before = rules.length;
    const errorsBefore = errors();
    mineOnce();
    for (let i = rules.length - 1; i >= 1; i--) {
      const kept = errors();
      const [removed] = rules.splice(i, 1);
      if (errors() > kept) rules.splice(i, 0, removed);
    }
    rules.sort((x, y) => cmpOrder(x.order, y.order));
    if (rules.length === before && errors() === errorsBefore) break;
  }

  function mineOnce() {
    for (let k = 1; k <= dims.length; k++) {
      if (errors() === 0) return;
      for (const [ci, combo] of subsets(dims, k).entries()) {
        const groups = new Map();
        for (const c of cells) {
          const assignment = combo.map((d) => c.when[d]);
          if (assignment.some((v, i) => v === undefined || !expressible(combo[i], v))) continue;
          const g = JSON.stringify(assignment);
          if (!groups.has(g)) groups.set(g, []);
          groups.get(g).push(c);
        }
        for (const g of [...groups.keys()].sort()) {
          const members = groups.get(g);
          const m = valueFor(members, combo);
          if (m === key(null)) continue; // a rule can set a value, never unset one
          if (rules.some((r) => r.order[0] === k && r.order[1] === ci && r.order[2] === g)) continue;
          // Judge the rule on the cells it defines: those at rest. The others are for later, more specific rules
          // (the prune pass removes it again if it ends up not helping).
          const atRest = members.filter((c) => flagDims.every((d) => combo.includes(d) || !expressible(d, c.when[d])));
          const judged = atRest.length ? atRest : members;
          const wrongBefore = judged.filter((c) => predict(c) !== key(c.value)).length;
          const wrongAfter = judged.filter((c) => m !== key(c.value)).length;
          if (wrongAfter < wrongBefore) {
            const values = JSON.parse(g);
            const rule = { when: Object.fromEntries(combo.map((d, i) => [d, values[i]])), value: JSON.parse(m), order: [k, ci, g] };
            // Keep the list in cascade order so prediction matches the order the DSIR will hold.
            const at = rules.findIndex((r) => cmpOrder(r.order, rule.order) > 0);
            rules.splice(at < 0 ? rules.length : at, 0, rule);
          }
        }
      }
    }
  }
  const wrong = cells
    .filter((c) => predict(c) !== key(c.value))
    .map((c) => ({ when: c.when, value: c.value, predicted: JSON.parse(predict(c)) }));
  return { rules, wrong };
}
