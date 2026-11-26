// What is recorded for every element under a component's root. Runs partly in the page (computed styles,
// geometry, attributes) and partly through the DevTools protocol (the author rules that matched).

/** Computed properties recorded per element: layout, box, colour, type and motion. */
export const PROPERTIES = [
  'display', 'position', 'visibility', 'flex-direction', 'flex-wrap', 'align-items', 'justify-content',
  'row-gap', 'column-gap', 'grid-template-columns', 'align-self', 'justify-self', 'width', 'height', 'min-width', 'min-height', 'max-width',
  'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
  'border-top-style', 'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
  'border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius',
  'background-color', 'background-image', 'color', 'opacity', 'box-shadow',
  'outline-style', 'outline-width', 'outline-color', 'outline-offset',
  'font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing', 'text-align',
  'text-decoration-line', 'text-transform', 'white-space', 'text-overflow', 'overflow-x', 'overflow-y',
  'cursor', 'pointer-events', 'transition-property', 'transition-duration', 'transition-timing-function',
];

/** The component's root unless told otherwise: the first element in the story that a design system marks as a part. */
export const ROOT_SELECTOR = '#storybook-root [data-slot], #storybook-root [data-part], #storybook-root [data-scope]';

const round = (n) => Math.round(n * 1000) / 1000;

/** In-page: everything but the matched rules, for the root and each element under it, in document order. */
function inPage({ rootSelector, properties }) {
  const IMPLICIT_ROLES = { BUTTON: 'button', A: 'link', INPUT: 'textbox', SELECT: 'combobox', TEXTAREA: 'textbox', IMG: 'img' };
  const root = document.querySelector(rootSelector);
  const origin = root.getBoundingClientRect();
  const all = [root, ...root.querySelectorAll('*')];
  return all.map((el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const attrs = {};
    for (const a of [...el.attributes].sort((x, y) => (x.name < y.name ? -1 : 1))) {
      if (a.name.startsWith('aria-') || a.name.startsWith('data-') || ['role', 'type', 'href', 'disabled', 'tabindex'].includes(a.name)) {
        attrs[a.name] = a.value;
      }
    }
    // A design system that marks no parts (Carbon) is named by its root's classes; only the root's are kept.
    if (el === root && el.getAttribute('class')) attrs.class = el.getAttribute('class');
    const text = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim();
    return {
      tag: el.tagName.toLowerCase(),
      parent: el === root ? -1 : all.indexOf(el.parentElement),
      role: el.getAttribute('role') ?? (el.tagName === 'A' && !el.hasAttribute('href') ? null : IMPLICIT_ROLES[el.tagName] ?? null),
      attrs,
      text,
      box: { x: r.left - origin.left, y: r.top - origin.top, w: r.width, h: r.height },
      style: Object.fromEntries(properties.map((p) => [p, cs.getPropertyValue(p)])),
    };
  });
}

/** Author rules that matched one node, in cascade order, declarations as authored (so var() survives). */
async function matchedRules(cdp, nodeId) {
  const m = await cdp.send('CSS.getMatchedStylesForNode', { nodeId });
  const rules = [];
  const keep = (props) => props.filter((d) => d.text && !d.disabled).map((d) => [d.name, d.value]);
  const inline = keep(m.inlineStyle?.cssProperties ?? []);
  for (const { rule } of m.matchedCSSRules ?? []) {
    if (rule.origin !== 'regular') continue; // user-agent defaults are already in the computed style
    const decls = keep(rule.style.cssProperties);
    if (decls.length === 0) continue;
    const at = [...(rule.media ?? []).map((x) => `@media ${x.text}`), ...(rule.supports ?? []).map((x) => `@supports ${x.text}`),
      ...(rule.containerQueries ?? []).map((x) => `@container ${x.text}`), ...(rule.layers ?? []).map((x) => `@layer ${x.text}`)];
    rules.push({ selector: rule.selectorList.text, ...(at.length ? { at } : {}), decls });
  }
  if (inline.length) rules.push({ selector: 'style', decls: inline });
  return rules;
}

/** Every custom property the rules reference (following var() inside their values), with its computed value. */
async function variables(page, rootSelector, elementIndex, rules) {
  const names = new Set();
  for (const r of rules) for (const [, v] of r.decls) for (const m of v.matchAll(/var\(\s*(--[\w-]+)/g)) names.add(m[1]);
  return page.evaluate(({ rootSelector, elementIndex, start }) => {
    const root = document.querySelector(rootSelector);
    const el = [root, ...root.querySelectorAll('*')][elementIndex];
    const cs = getComputedStyle(el);
    const out = {};
    const queue = [...start];
    while (queue.length) {
      const name = queue.shift();
      if (name in out) continue;
      const value = cs.getPropertyValue(name).trim();
      out[name] = value;
      for (const m of value.matchAll(/var\(\s*(--[\w-]+)/g)) if (!(m[1] in out)) queue.push(m[1]);
    }
    return Object.fromEntries(Object.keys(out).sort().map((k) => [k, out[k]]));
  }, { rootSelector, elementIndex, start: [...names].sort() });
}

/** Measures the current render. `nodeIds` are the CDP ids of root + descendants, in document order. */
export async function measure(page, cdp, nodeIds, rootSelector = ROOT_SELECTOR) {
  const elements = await page.evaluate(inPage, { rootSelector, properties: PROPERTIES });
  if (elements.length !== nodeIds.length) throw new Error('the DOM changed while it was being measured');
  for (let i = 0; i < elements.length; i++) {
    const e = elements[i];
    e.box = { x: round(e.box.x), y: round(e.box.y), w: round(e.box.w), h: round(e.box.h) };
    e.rules = await matchedRules(cdp, nodeIds[i]);
    e.vars = await variables(page, rootSelector, i, e.rules);
  }
  return elements;
}
