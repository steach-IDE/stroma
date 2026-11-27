#!/usr/bin/env node
// stroma <command>: init, emit (and emit --check) work today; extract, review, verify and update are planned.
const PLANNED = ['extract', 'review', 'verify', 'update'];
const USAGE = `usage: stroma <command>
  init     write stroma.config.json
  emit     write the Flutter package from the committed DSIR (--check: exit 1 if a generated file is stale)
planned, not in this version: ${PLANNED.join(', ')}`;

const [command, ...args] = process.argv.slice(2);
const io = { cwd: process.cwd(), args, out: (m) => console.log(m), err: (m) => console.error(m) };
try {
  if (!command || command === 'help' || command === '--help') { console.log(USAGE); process.exit(command ? 0 : 2); }
  if (PLANNED.includes(command)) { console.error(`stroma ${command}: not in this version (see feature_list.json: feat-010). ${USAGE.split('\n')[0]}`); process.exit(2); }
  if (command !== 'init' && command !== 'emit') { console.error(`stroma: unknown command "${command}"\n${USAGE}`); process.exit(2); }
  const { run } = await import(`../src/commands/${command}.mjs`);
  process.exit(await run(io));
} catch (e) {
  console.error(`stroma ${command ?? ''}: ${e.message}`.replace('stroma :', 'stroma:'));
  process.exit(1);
}
