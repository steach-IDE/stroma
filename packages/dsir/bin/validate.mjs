#!/usr/bin/env node
// node bin/validate.mjs <file.dsir.json>...   exit 0 when every file is a valid DSIR 0.2, else 1.
import { readFileSync } from 'node:fs';
import { validate } from '../src/validate.mjs';

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('usage: validate <file.dsir.json>...');
  process.exit(2);
}
let failed = false;
for (const file of files) {
  let doc;
  try {
    doc = JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    console.error(`${file}: not readable JSON: ${e.message}`);
    failed = true;
    continue;
  }
  const errors = validate(doc);
  if (errors.length === 0) {
    console.log(`${file}: valid DSIR ${doc.dsirVersion}`);
  } else {
    failed = true;
    for (const { path, message } of errors) console.error(`${file}: ${path}: ${message}`);
  }
}
process.exit(failed ? 1 : 0);
