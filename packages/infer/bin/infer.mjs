#!/usr/bin/env node
// stroma-infer --extraction <dir> --out <file.dsir.json> --license <SPDX id> [--source <url or name>] [--report <file.json>]
//              [--compare <source.dsir.json>]   adds how the result compares with a source-derived DSIR to the report
import fs from 'node:fs';
import { infer } from '../src/infer.mjs';
import { compare } from '../src/compare.mjs';
import { migrate } from '../../dsir/src/migrate.mjs';

const a = process.argv.slice(2);
const opt = (n) => { const i = a.indexOf(`--${n}`); return i >= 0 ? a[i + 1] : undefined; };
const [extraction, out, license] = [opt('extraction'), opt('out'), opt('license')];
if (!extraction || !out || !license) {
  console.error('usage: stroma-infer --extraction <dir> --out <file.dsir.json> --license <SPDX id> [--source <url>] [--report <file.json>]');
  process.exit(2);
}
try {
  const { dsir, report } = infer({ extraction, license, source: opt('source') ?? 'local Storybook build' });
  fs.writeFileSync(out, JSON.stringify(dsir, null, 2) + '\n');
  if (opt('compare')) report.vsSource = compare(dsir, migrate(JSON.parse(fs.readFileSync(opt('compare'), 'utf8'))));
  if (opt('report')) fs.writeFileSync(opt('report'), JSON.stringify(report, null, 2) + '\n');
  console.log(`inferred ${dsir.components.length} components from ${report.cells} cells: ${report.fit.percent}% of values explained`);
} catch (e) {
  console.error(`stroma-infer: ${e.message}`);
  process.exit(1);
}
