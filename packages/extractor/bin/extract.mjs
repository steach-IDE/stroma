#!/usr/bin/env node
// stroma-extract --storybook <static build> --out <empty dir> [--story <id>]... [--where <arg>=<value>]...
import { extract } from '../src/extract.mjs';

const args = process.argv.slice(2);
const opts = { stories: [], where: {} };
for (let i = 0; i < args.length; i++) {
  const [flag, value] = [args[i], args[i + 1]];
  if (flag === '--storybook') opts.storybook = value;
  else if (flag === '--out') opts.out = value;
  else if (flag === '--story') opts.stories.push(value);
  else if (flag === '--where') { const [k, v] = value.split('='); opts.where[k] = v; }
  else { console.error(`unknown option ${flag}`); process.exit(2); }
  i++;
}
if (!opts.storybook || !opts.out) {
  console.error('usage: stroma-extract --storybook <static build> --out <empty dir> [--story <id>]... [--where <arg>=<value>]...');
  process.exit(2);
}
try {
  const { stories, cells } = await extract(opts);
  console.log(`extracted ${cells} cells from ${stories} stories into ${opts.out}`);
} catch (e) {
  console.error(`stroma-extract: ${e.message}`);
  process.exit(1);
}
