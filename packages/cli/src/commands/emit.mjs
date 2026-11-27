// stroma emit [--check]: write the Flutter package from the committed DSIR, or say what is stale.
import fs from 'node:fs';
import path from 'node:path';
import { findConfig, readConfig } from '../config.mjs';
import { emit } from '../emitter.mjs';

// What the emitter does not own: fonts, the goldens `flutter test` writes, tool output, dotfiles, the lock file.
const NOT_EMITTED = /^(fonts|build|\.dart_tool|test\/goldens)\//;
const walk = (dir, base = dir) => (fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory()
  ? walk(path.join(dir, e.name), base)
  : [path.relative(base, path.join(dir, e.name)).split(path.sep).join('/')])) : []);

export function run({ cwd, args, out, err }) {
  const check = args.includes('--check');
  const i = args.indexOf('--config');
  const cfg = readConfig(findConfig(cwd, i >= 0 ? args[i + 1] : undefined));
  if (!fs.existsSync(cfg.dsirFile)) throw new Error(`the DSIR ${path.relative(cwd, cfg.dsirFile)} does not exist (run \`stroma extract\`, or set "dsir" in ${path.basename(cfg.file)})`);
  const dsir = JSON.parse(fs.readFileSync(cfg.dsirFile, 'utf8'));
  const mapping = cfg.mappingFile ? JSON.parse(fs.readFileSync(cfg.mappingFile, 'utf8')) : null;
  const { files, fonts } = emit({ dsir, mapping, packageName: cfg.packageName, withFonts: cfg.withFonts });

  const rel = (f) => path.relative(cwd, path.join(cfg.packageDir, f));
  let stale = 0;
  for (const [f, text] of Object.entries(files)) {
    const file = path.join(cfg.packageDir, f);
    if (check) {
      if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== text) { err(`stale: ${rel(f)}`); stale++; }
    } else {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, text);
    }
  }
  // Files the emitter owns but no longer writes (a renamed or removed component).
  for (const f of walk(cfg.packageDir)) {
    if (f in files || NOT_EMITTED.test(f) || path.basename(f).startsWith('.') || f === 'pubspec.lock') continue;
    if (check) { err(`stale: ${rel(f)} is no longer emitted`); stale++; } else fs.rmSync(path.join(cfg.packageDir, f));
  }
  if (check) {
    if (stale) { err(`${stale} stale file${stale === 1 ? '' : 's'}: run \`stroma emit\`; never edit a generated file by hand`); return 1; }
    out(`${path.relative(cwd, cfg.packageDir) || '.'} is up to date`);
    return 0;
  }
  out(`wrote ${Object.keys(files).length} files to ${path.relative(cwd, cfg.packageDir) || '.'}`);
  const missing = cfg.withFonts ? fonts.filter((f) => !fs.existsSync(path.join(cfg.packageDir, 'fonts', f.file))) : [];
  if (missing.length) out(`fonts: copy ${missing.map((f) => f.file).join(', ')} into ${path.relative(cwd, path.join(cfg.packageDir, 'fonts'))} (your pinned copy; stroma does not download fonts yet)`);
  return 0;
}
