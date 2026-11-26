// Chrome reference renders for the visual oracle.
// Markup is what shadcn's React components emit: the class strings come from the registry
// source through the real cva and tailwind-merge, and the CSS from the real Tailwind v4 compiler
// with a shadcn v4 globals.css. Hover and focus are forced per node through the DevTools protocol.
// Writes .stroma/oracle/chrome/<sheet>.<mode>.{html,png,json} and tokens.json at the repository root.

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { cva } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';
import * as tailwind from 'tailwindcss';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import { parseComponentFile } from './ingest.mjs';
import { SHADCN_V4_THEME_INLINE } from './tailwind.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.join(here, '..', '..');
const require = createRequire(path.join(here, 'package.json'));
const pkg = path.join(repo, 'examples', 'shadcn-neutral', 'packages', 'shadcn_neutral_ui');
const out = path.join(repo, '.stroma', 'oracle', 'chrome');
const sources = path.join(here, 'sources');
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

// ---------- class strings, exactly as the React components build them ----------

const registry = Object.fromEntries(
  ['button', 'badge', 'card'].map((n) => [n, parseComponentFile(readJson(path.join(sources, `${n}.json`)).files[0].content)]),
);
const buttonVariants = cva(registry.button.cva[0].base, registry.button.cva[0].config);
const badgeVariants = cva(registry.badge.cva[0].base, registry.badge.cva[0].config);
const cardClass = Object.fromEntries(registry.card.functions.map((f) => [f.name, { cls: twMerge(f.className), slot: f.slot }]));

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const ICON = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="12" r="10"/></svg>';
const classes = new Set();
const use = (cls) => { cls.split(/\s+/).forEach((c) => classes.add(c)); return cls; };

function html(n, attrs = '') {
  switch (n.type) {
    case 'Button': {
      const cls = use(twMerge(buttonVariants({ variant: n.variant, size: n.size })));
      return `<button data-slot="button" class="${cls}"${attrs}>${n.icon ? ICON : esc(n.text)}</button>`;
    }
    case 'Badge': {
      const cls = use(twMerge(badgeVariants({ variant: n.variant })));
      const tag = n.interactive ? 'a' : 'span';
      return `<${tag}${n.interactive ? ' href="#"' : ''} data-slot="badge" class="${cls}"${attrs}>${esc(n.text)}</${tag}>`;
    }
    default: {
      const part = cardClass[n.type];
      if (!part) throw new Error(`unknown node ${n.type}`);
      const kids = [...(n.children ?? []).map((c) => html(c)), ...(n.text ? [esc(n.text)] : [])];
      if (n.action) kids.push(`<div data-slot="card-action" class="${use(cardClass.CardAction.cls)}">${html(n.action)}</div>`);
      return `<div data-slot="${part.slot}" class="${use(part.cls)}"${attrs}>${kids.join('')}</div>`;
    }
  }
}

// ---------- CSS: a shadcn v4 globals.css built from the same pinned sources ----------

function globalsCss() {
  const { cssVarsV4 } = readJson(path.join(sources, 'colors-neutral.json'));
  const style = readJson(path.join(sources, 'index.json'));
  const names = Object.keys(cssVarsV4.light).filter((k) => k !== 'radius');
  const vars = (m) => Object.entries(cssVarsV4[m]).map(([k, v]) => `  --${k}: ${v};`).join('\n');
  const layer = Object.entries(style.css['@layer base']).map(([sel, body]) => `  ${sel} { ${Object.keys(body)[0]}; }`).join('\n');
  const fonts = [['Regular', 400], ['Medium', 500], ['SemiBold', 600]]
    .map(([f, w]) => `@font-face { font-family: Inter; font-weight: ${w}; src: url("${pathToFileURL(path.join(pkg, 'fonts', `Inter-${f}.ttf`))}"); }`)
    .join('\n');
  return `@import "tailwindcss";
@custom-variant dark (&:is(.dark *));
@theme inline {
  --font-sans: Inter, sans-serif;
${names.map((n) => `  --color-${n}: var(--${n});`).join('\n')}
${Object.entries(SHADCN_V4_THEME_INLINE.radius).map(([k, d]) => `  --radius-${k}: calc(var(--radius) + ${d}px);`).join('\n')}
}
:root {
${vars('light')}
}
.dark {
${vars('dark')}
}
@layer base {
${layer}
}
${fonts}
`;
}

async function compileCss(candidates) {
  const compiler = await tailwind.compile(globalsCss(), {
    base: here,
    loadStylesheet: async (id, base) => ({
      path: id,
      base,
      content: fs.readFileSync(require.resolve(id === 'tailwindcss' ? 'tailwindcss/index.css' : id), 'utf8'),
    }),
  });
  return compiler.build([...candidates]);
}

// ---------- render ----------

const STATE_PSEUDO = { hovered: ['hover'], focused: ['focus', 'focus-visible'] };

async function main() {
  const cells = readJson(path.join(pkg, 'test', 'oracle', 'cells.json'));
  const sheets = {};
  for (const c of cells) (sheets[`${c.sheet}.${c.mode}`] ??= []).push(c);
  const bodies = Object.fromEntries(Object.entries(sheets).map(([key, list]) => [key, list.map((c) => {
    const inner = html(c.node, ` data-cell="${c.id}"${c.state === 'disabled' ? ' disabled' : ''}`);
    // Preflight makes the cell border-box, so its 6px padding is added to the content width.
    return `<div class="cell"${c.width ? ` style="width:${c.width + 12}px"` : ''}>${inner}</div>`;
  }).join('\n')]));
  const tokenNames = Object.keys(readJson(path.join(sources, 'colors-neutral.json')).cssVarsV4.light)
    .filter((k) => k !== 'radius' && !k.startsWith('sidebar') && !k.startsWith('chart'));
  const css = await compileCss(classes);
  fs.mkdirSync(out, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 3200 }, deviceScaleFactor: 2 });
  const cdp = await page.context().newCDPSession(page);
  const tokenReport = {};

  for (const key of Object.keys(sheets)) {
    const mode = key.split('.')[1];
    const file = path.join(out, `${key}.html`);
    fs.writeFileSync(file, `<!doctype html><html class="${mode === 'dark' ? 'dark' : ''}"><head><meta charset="utf-8"><style>${css}
body { margin: 0; font-family: Inter, sans-serif; }
#sheet { width: 1200px; box-sizing: border-box; padding: 16px; display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
.cell { padding: 6px; }
.swatch { width: 8px; height: 8px; }
</style></head><body><div id="sheet">${bodies[key]}</div>
<div id="tokens">${tokenNames.map((t) => `<div class="swatch" style="background: var(--${t})"></div>`).join('')}</div>
</body></html>`);
    await page.goto(pathToFileURL(file).href);
    await page.evaluate(() => document.fonts.ready);

    await cdp.send('DOM.enable');
    await cdp.send('CSS.enable');
    const { root: doc } = await cdp.send('DOM.getDocument', { depth: -1 });
    for (const c of sheets[key]) {
      const pseudo = STATE_PSEUDO[c.state];
      if (!pseudo) continue;
      const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: doc.nodeId, selector: `[data-cell="${c.id}"]` });
      await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: pseudo });
    }
    await page.waitForTimeout(400); // let transition-all (150ms) finish

    const geometry = await page.evaluate(() => {
      const sheet = document.getElementById('sheet').getBoundingClientRect();
      const rect = (r) => r && { x: r.left - sheet.left, y: r.top - sheet.top, w: r.width, h: r.height };
      const cellsOut = {};
      for (const el of document.querySelectorAll('[data-cell]')) {
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.textContent.trim() ? 1 : 3) });
        const textNode = walker.nextNode();
        let text = null;
        if (textNode) {
          const range = document.createRange();
          range.selectNodeContents(textNode);
          text = rect(range.getBoundingClientRect());
        }
        cellsOut[el.dataset.cell] = {
          box: rect(el.getBoundingClientRect()),
          text,
          icon: rect(el.querySelector('svg')?.getBoundingClientRect()),
          title: rect(el.querySelector('[data-slot=card-title]')?.getBoundingClientRect()),
          content: rect(el.querySelector('[data-slot=card-content]')?.getBoundingClientRect()),
        };
      }
      return { sheet: rect(sheet), cells: cellsOut };
    });
    fs.writeFileSync(path.join(out, `${key}.json`), JSON.stringify(geometry, null, 2));
    await page.locator('#sheet').screenshot({ path: path.join(out, `${key}.png`) });

    if (key.startsWith('button.')) {
      // Swatches stack vertically, 8 CSS px (16 device px) each, composited over the page.
      const png = PNG.sync.read(await page.locator('#tokens').screenshot());
      tokenReport[mode] = Object.fromEntries(tokenNames.map((t, i) => {
        const idx = ((i * 16 + 8) * png.width + 8) * 4;
        return [t, [png.data[idx], png.data[idx + 1], png.data[idx + 2]]];
      }));
    }
  }
  fs.writeFileSync(path.join(out, 'tokens.json'), JSON.stringify(tokenReport, null, 2));
  await browser.close();
  console.log(`rendered ${Object.keys(sheets).length} sheets to .stroma/oracle/chrome`);
}

await main();
