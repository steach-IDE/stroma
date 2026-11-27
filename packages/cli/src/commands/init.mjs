// stroma init: write stroma.config.json. Flags (or prompts on a terminal): --storybook <url|build dir> --name <dart package> [--path <dir>] [--dsir <file>] [--force]
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { CONFIG } from '../config.mjs';

export async function run({ cwd, args, out, err }) {
  const opt = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined; };
  const file = path.join(cwd, CONFIG);
  if (fs.existsSync(file) && !args.includes('--force')) { err(`${CONFIG} already exists (use --force to replace it)`); return 1; }
  let [storybook, name] = [opt('storybook'), opt('name')];
  if ((!storybook || !name) && process.stdin.isTTY) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    storybook ||= await rl.question('Storybook (a URL, or a local `storybook build` folder): ');
    name ||= await rl.question('Flutter package name (for example acme_ui): ');
    rl.close();
  }
  if (!storybook || !name) { err('usage: stroma init --storybook <url or build folder> --name <package name> [--path <dir>] [--dsir <file>] [--force]'); return 2; }
  if (!/^[a-z][a-z0-9_]*$/.test(name)) { err(`"${name}" is not a Dart package name (lower case, digits, underscores)`); return 2; }
  const isUrl = /^https?:\/\//.test(storybook);
  const config = {
    source: isUrl ? { storybook } : { storybookBuild: storybook },
    package: { name, path: opt('path') ?? path.join('packages', name) },
    ...(opt('dsir') ? { dsir: opt('dsir') } : {}),
    handWritten: [],
  };
  fs.writeFileSync(file, JSON.stringify(config, null, 2) + '\n');
  out(`wrote ${CONFIG}: package ${name} at ${config.package.path}; its DSIR is expected at ${opt('dsir') ?? path.join('design-system', `${name}.dsir.json`)}`);
  return 0;
}
