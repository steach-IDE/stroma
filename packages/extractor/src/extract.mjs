// Reads a static Storybook build and writes one measurement file per cell:
// story x variant combination (from argTypes) x theme (from the `theme` global) x state.
// Nothing about any particular design system is known here: axes, themes and the component root all come
// from the Storybook and the DOM. Output is deterministic: same build, same files.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { serveStatic } from './serve.mjs';
import { measure, ROOT_SELECTOR } from './measure.mjs';
import { CROP_MARGIN } from './crop.mjs';

const INTERACTIVE = 'button, a[href], input, select, textarea, [tabindex]';
const FORCED = { hovered: ['hover'], focused: ['focus', 'focus-visible'] };

/** Cartesian product of the axes, in sorted axis order and declared option order. */
function combinations(axes) {
  return Object.keys(axes).sort().reduce(
    (acc, axis) => acc.flatMap((c) => axes[axis].map((o) => ({ ...c, [axis]: o }))),
    [{}],
  );
}

/** Asks Storybook itself for a story's variant axes, whether it has a `disabled` arg, and the theme global. */
async function describeStory(page, base, storyId) {
  await page.goto(`${base}/iframe.html?id=${storyId}&viewMode=story`);
  return page.evaluate(async (id) => {
    const preview = window.__STORYBOOK_PREVIEW__;
    await preview.ready();
    const story = await preview.storyStore.loadStory({ storyId: id });
    const axes = {};
    for (const [name, t] of Object.entries(story.argTypes)) if (Array.isArray(t.options)) axes[name] = t.options.map(String);
    const d = story.argTypes.disabled;
    const hasDisabled = Boolean(d && (d.type?.name === 'boolean' || d.control === 'boolean' || d.control?.type === 'boolean'));
    const items = preview.storyStore.projectAnnotations?.globalTypes?.theme?.toolbar?.items ?? [];
    const themes = items.map((i) => (typeof i === 'string' ? i : i.value)).filter(Boolean);
    const defaults = Object.fromEntries(Object.keys(axes).sort().map((k) => [k, String(story.initialArgs[k])]));
    // Args with a control and no options: the extractor sets none of them, so no cell varies them.
    const uncontrolled = Object.entries(story.argTypes)
      .filter(([name, t]) => t.control && t.control !== false && !Array.isArray(t.options) && t.type?.name !== 'function' && !(name === 'disabled' && hasDisabled))
      .map(([name]) => name).sort();
    return { title: story.title, name: story.name, axes, defaults, hasDisabled, themes, uncontrolled };
  }, storyId);
}

/**
 * In-page: sets the story's args and the theme global through Storybook's channel, and resolves once Storybook
 * has rendered them (immediately if nothing changes). Returns what Storybook now holds.
 */
async function render({ storyId, args, theme }) {
  const preview = window.__STORYBOOK_PREVIEW__;
  const channel = window.__STORYBOOK_ADDONS_CHANNEL__;
  const store = preview.storyStore;
  const current = () => ({ args: store.args.get(storyId), theme: store.userGlobals?.get?.()?.theme ?? store.globals?.get?.()?.theme });
  const rendered = () => new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${storyId}: Storybook did not render within 10 s`)), 10_000);
    channel.once('storyRendered', () => { clearTimeout(timer); resolve(); });
  });
  const now = current();
  if (theme && now.theme !== theme) {
    const done = rendered();
    channel.emit('updateGlobals', { globals: { theme } });
    await done;
  }
  const changed = Object.fromEntries(Object.entries(args).filter(([k, v]) => current().args[k] !== v));
  if (Object.keys(changed).length) {
    const done = rendered();
    channel.emit('updateStoryArgs', { storyId, updatedArgs: changed });
    await done;
  }
  await document.fonts.ready;
  return current();
}

/** Root element's CDP node id and all its descendants', in document order. */
async function nodeIdsUnderRoot(cdp, rootSelector) {
  const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
  const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: rootSelector });
  const { nodeIds } = await cdp.send('DOM.querySelectorAll', { nodeId, selector: '*' });
  return [nodeId, ...nodeIds];
}

const fileName = ({ theme, args, state }) =>
  [...(theme ? [`theme=${theme}`] : []), ...Object.keys(args).sort().map((k) => `${k}=${args[k]}`), `state=${state}`].join(',') + '.json';

/**
 * @param {object} o
 * @param {string} o.storybook  static build directory
 * @param {string} o.out        output directory (must be empty or absent; nothing is ever deleted)
 * @param {string[]} [o.stories] story ids to extract (default: all)
 * @param {Record<string,string>} [o.where] keep only combinations with these arg values
 * @param {string} [o.root]     CSS selector of the component root, for a design system that marks no parts with
 *                              data-slot, data-part or data-scope (default: those markers). Only the first match counts.
 */
export async function extract({ storybook, out, stories = [], where = {}, root }) {
  const rootSelector = root ? `#storybook-root :is(${root})` : ROOT_SELECTOR;
  if (fs.existsSync(out) && fs.readdirSync(out).length) throw new Error(`${out} is not empty; use a fresh directory`);
  const index = JSON.parse(fs.readFileSync(path.join(storybook, 'index.json'), 'utf8'));
  const ids = Object.values(index.entries).filter((e) => e.type === 'story').map((e) => e.id).sort();
  for (const id of stories) if (!ids.includes(id)) throw new Error(`no story "${id}" in ${storybook}`);
  const selected = stories.length ? ids.filter((id) => stories.includes(id)) : ids;

  const server = await serveStatic(storybook);
  const browser = await chromium.launch();
  const cells = [];
  const blocked = new Set();
  const seen = {}; // story -> what its cells showed, for the coverage section
  const pageColours = {}; // theme -> the page's background and text colour, from <body> (else <html>, else white)
  const described = {};
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 }); // 2x: the crops are compared with Flutter's goldens, which are 2x; CSS px (every measurement) are unaffected
    // Nothing outside the Storybook may shape a measurement (a CDN font, say): the network is cut, and what was
    // asked for is listed in index.json, so a fallback font is never silent.
    await page.route('**/*', (route) => {
      const url = route.request().url();
      if (url.startsWith(server.url) || /^(data|blob):/.test(url)) return route.continue();
      blocked.add(url);
      return route.abort();
    });
    const cdp = await page.context().newCDPSession(page);
    for (const storyId of selected) {
      const meta = await describeStory(page, server.url, storyId);
      described[storyId] = meta;
      const saw = (seen[storyId] ??= { cells: 0, icon: 0, states: new Set(), parts: {}, args: Object.fromEntries(Object.keys(meta.axes).map((a) => [a, new Set()])) });
      const themes = meta.themes.length ? meta.themes : [null];
      const combos = combinations(meta.axes).filter((c) => Object.entries(where).every(([k, v]) => !(k in c) || c[k] === v));
      // Storybook ignores `args` in the iframe URL, so cells are set the way its own UI does: through the
      // preview's channel, waiting for the render each update causes.
      await page.goto(`${server.url}/iframe.html?id=${storyId}&viewMode=story`);
      try {
        await page.locator(rootSelector).first().waitFor({ timeout: 10_000 });
      } catch {
        throw new Error(`${storyId}: no component root in #storybook-root (${root ? `nothing matches ${root}` : 'an element with data-slot, data-part or data-scope'})`);
      }
      await cdp.send('DOM.enable');
      await cdp.send('CSS.enable');
      await cdp.send('Animation.enable');
      await cdp.send('Animation.setPlaybackRate', { playbackRate: 100_000 }); // finish CSS transitions now
      for (const theme of themes) {
        for (const combo of combos) {
          for (const disabled of meta.hasDisabled ? [false, true] : [false]) {
            const args = { ...combo, ...(meta.hasDisabled ? { disabled } : {}) };
            const shown = await page.evaluate(render, { storyId, args, theme });
            for (const [k, v] of Object.entries(args)) {
              // Measuring a cell Storybook didn't render would be silent, so check what it actually shows.
              if (shown.args[k] !== v) throw new Error(`${storyId}: Storybook rendered ${k}=${shown.args[k]}, not ${v}`);
            }
            if (theme && shown.theme !== theme) throw new Error(`${storyId}: Storybook rendered theme ${shown.theme}, not ${theme}`);
            pageColours[theme ?? 'light'] ??= await page.evaluate(() => {
              const clear = (c) => /^rgba\(.*,\s*0\)$|^transparent$/.test(c);
              const [body, html] = [getComputedStyle(document.body), getComputedStyle(document.documentElement)];
              return { background: !clear(body.backgroundColor) ? body.backgroundColor : !clear(html.backgroundColor) ? html.backgroundColor : 'rgb(255, 255, 255)', color: body.color };
            });
            const nodeIds = await nodeIdsUnderRoot(cdp, rootSelector);
            const interactive = await page.locator(rootSelector).first().evaluate((el, sel) => el.matches(sel), INTERACTIVE);
            const states = disabled ? ['disabled'] : ['rest', ...(interactive ? ['hovered', 'focused'] : [])];
            for (const state of states) {
              await cdp.send('CSS.forcePseudoState', { nodeId: nodeIds[0], forcedPseudoClasses: FORCED[state] ?? [] });
              await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
              const elements = await measure(page, cdp, nodeIds, rootSelector);
              saw.cells++;
              saw.states.add(state);
              for (const [axis, v] of Object.entries(combo)) saw.args[axis].add(v);
              if (elements.some((e, i) => i > 0 && e.tag === 'svg' && e.parent === 0)) saw.icon++;
              for (const e of elements.filter((x, i) => i > 0 && x.parent === 0)) {
                const part = e.attrs['data-slot'] ?? e.attrs['data-part'] ?? e.attrs['data-scope'];
                if (part) saw.parts[part] = (saw.parts[part] ?? 0) + 1;
              }
              const cell = { story: storyId, title: meta.title, name: meta.name, theme, args: combo, state, elements };
              const rel = path.posix.join(storyId, fileName({ theme, args: combo, state }));
              fs.mkdirSync(path.join(out, storyId), { recursive: true });
              fs.writeFileSync(path.join(out, rel), JSON.stringify(cell, null, 2) + '\n');
              // What Chrome drew: the root's box and a margin around it (a focus ring or shadow sits outside the box).
              const at = await page.locator(rootSelector).first().boundingBox();
              const margin = CROP_MARGIN;
              const clip = { x: Math.max(0, at.x - margin), y: Math.max(0, at.y - margin), width: at.width + 2 * margin, height: at.height + 2 * margin };
              fs.writeFileSync(path.join(out, rel.replace(/\.json$/, '.png')), await page.screenshot({ clip, animations: 'disabled', caret: 'hide' }));
              cells.push({ story: storyId, theme, args: combo, state, file: rel });
            }
            await cdp.send('CSS.forcePseudoState', { nodeId: nodeIds[0], forcedPseudoClasses: [] });
          }
        }
      }
    }
  } finally {
    await browser.close();
    await server.close();
  }
  cells.sort((a, b) => (a.file < b.file ? -1 : 1));
  // What the stories did and did not exercise: facts about the cells, not a judgement of what a component should have.
  const how = (n, total) => (n === 0 ? 'never' : n === total ? 'always' : 'sometimes');
  const coverage = Object.fromEntries(Object.entries(seen).map(([id, saw]) => [id, {
    cells: saw.cells,
    axes: Object.fromEntries(Object.entries(described[id].axes).map(([axis, options]) => [axis, { options, notRendered: options.filter((o) => !saw.args[axis].has(o)) }])),
    uncontrolled: described[id].uncontrolled,
    states: [...saw.states].sort(),
    icon: how(saw.icon, saw.cells),
    parts: Object.fromEntries(Object.entries(saw.parts).sort().map(([part, n]) => [part, how(n, saw.cells)])),
  }]));
  const gaps = Object.entries(coverage).flatMap(([id, c]) => [
    ...Object.entries(c.axes).filter(([, a]) => a.notRendered.length).map(([axis, a]) => `${id}: ${axis} options not rendered: ${a.notRendered.join(', ')}`),
    ...(c.uncontrolled.length ? [`${id}: args with a control that no cell varies: ${c.uncontrolled.join(', ')}`] : []),
  ]);
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'index.json'), JSON.stringify({ extractor: 'stroma-extractor 0.0.0', stories: described, cells, coverage, page: Object.fromEntries(Object.entries(pageColours).sort()), ...(blocked.size ? { blocked: [...blocked].sort() } : {}) }, null, 2) + '\n');
  return { stories: selected.length, cells: cells.length, gaps };
}
