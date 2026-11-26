#!/usr/bin/env node
// node bin/migrate.mjs <in.dsir.json> <out.dsir.json>   converts a DSIR 0.1 to 0.2 and validates the result.
import { readFileSync, writeFileSync } from 'node:fs';
import { migrate01to02 } from '../src/migrate.mjs';
import { validate } from '../src/validate.mjs';

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error('usage: migrate <in.dsir.json> <out.dsir.json>');
  process.exit(2);
}
const migrated = migrate01to02(JSON.parse(readFileSync(input, 'utf8')));
const errors = validate(migrated);
if (errors.length) {
  for (const { path, message } of errors) console.error(`${path}: ${message}`);
  process.exit(1);
}
writeFileSync(output, JSON.stringify(migrated, null, 2) + '\n');
console.log(`wrote ${output} (DSIR ${migrated.dsirVersion})`);
