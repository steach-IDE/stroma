// Writes the Storybook's inputs from the enricher's pinned sources, so the Storybook and the enricher can't
// disagree about what shadcn/ui is:
//   src/components/ui/{button,badge,card}.tsx   the registry files, byte for byte
//   src/globals.css                             shadcn v4 globals.css, from the same builder the reference renderer uses
//   src/variants.json                           each component's cva variant axes and options, for the story controls
//   node scripts/sync.mjs [--check]             --check: exit 1 if any of these is stale or a stray file is in ui/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const enricher = path.join(root, '..', '..', '..', 'packages', 'enricher-shadcn');
const { parseComponentFile } = await import(path.join(enricher, 'ingest.mjs'));
const { globalsCss } = await import(path.join(enricher, 'globals-css.mjs'));

const COMPONENTS = ['button', 'badge', 'card'];
const out = {};
const variants = {};
for (const name of COMPONENTS) {
  const item = JSON.parse(fs.readFileSync(path.join(enricher, 'sources', `${name}.json`), 'utf8'));
  const source = item.files[0].content;
  out[`src/components/ui/${name}.tsx`] = source;
  const { cva } = parseComponentFile(source);
  if (cva.length) {
    variants[name] = Object.fromEntries(Object.entries(cva[0].config.variants).map(([axis, o]) => [axis, Object.keys(o)]));
  }
}
out['src/globals.css'] = globalsCss((file) => `/fonts/${file}`);
out['src/variants.json'] = JSON.stringify(variants, null, 2) + '\n';

const check = process.argv.includes('--check');
let stale = 0;
for (const [rel, content] of Object.entries(out)) {
  const file = path.join(root, rel);
  if (check) {
    if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== content) { console.error(`stale: ${rel}`); stale++; }
  } else {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  }
}
const uiDir = path.join(root, 'src', 'components', 'ui');
for (const f of fs.existsSync(uiDir) ? fs.readdirSync(uiDir) : []) {
  const rel = `src/components/ui/${f}`;
  if (rel in out) continue;
  if (check) { console.error(`stale: ${rel} is not a pinned source`); stale++; } else fs.rmSync(path.join(uiDir, f));
}
if (stale) process.exit(1);
console.log(check ? 'storybook sources are up to date' : `wrote ${Object.keys(out).length} files`);
