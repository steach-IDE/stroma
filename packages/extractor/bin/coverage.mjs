#!/usr/bin/env node
// stroma-coverage <extraction dir>: what the stories did and did not exercise (index.json's `coverage`), as a table.
import fs from 'node:fs';
import path from 'node:path';

const dir = process.argv[2];
if (!dir) { console.error('usage: stroma-coverage <extraction dir>'); process.exit(2); }
const { coverage, fonts = {} } = JSON.parse(fs.readFileSync(path.join(dir, 'index.json'), 'utf8'));
if (!coverage) { console.error(`${dir}: no coverage in index.json (extracted by an older extractor?)`); process.exit(1); }
for (const [story, c] of Object.entries(coverage)) {
  console.log(`${story}  (${c.cells} cells; states: ${c.states.join(', ')})`);
  for (const [axis, a] of Object.entries(c.axes)) {
    console.log(`  axis ${axis}: ${a.options.length} options${a.notRendered.length ? `, NOT rendered: ${a.notRendered.join(', ')}` : ', all rendered'}`);
  }
  if (c.uncontrolled.length) console.log(`  args with a control that no cell varies: ${c.uncontrolled.join(', ')}`);
  console.log(`  icon (an svg child of the root): ${c.icon}`);
  const f = fonts[story];
  const how = { web: 'a web font the page loaded', system: 'a SYSTEM font: depends on this machine', fallback: 'DID NOT LOAD' };
  if (f) console.log(`  font ${f.requested.join(', ')}: ${f.source === null ? 'no text drawn' : how[f.source]}; drawn in ${f.used.map((u) => u.family).join(', ') || 'nothing'}`);
  for (const [part, how] of Object.entries(c.parts)) console.log(`  part ${part}: ${how}`);
}
