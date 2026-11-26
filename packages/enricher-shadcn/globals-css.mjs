// shadcn v4's globals.css, built from the pinned theme (sources/colors-neutral.json) and the style's base layer
// (sources/index.json). One builder for the Chrome reference renderer and the example Storybook, so both render
// the same CSS. `fontUrl(file)` says where each Inter file is served from.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SHADCN_V4_THEME_INLINE } from './tailwind.mjs';

const sources = path.join(path.dirname(fileURLToPath(import.meta.url)), 'sources');
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

export function globalsCss(fontUrl) {
  const { cssVarsV4 } = readJson(path.join(sources, 'colors-neutral.json'));
  const style = readJson(path.join(sources, 'index.json'));
  const names = Object.keys(cssVarsV4.light).filter((k) => k !== 'radius');
  const vars = (m) => Object.entries(cssVarsV4[m]).map(([k, v]) => `  --${k}: ${v};`).join('\n');
  const layer = Object.entries(style.css['@layer base']).map(([sel, body]) => `  ${sel} { ${Object.keys(body)[0]}; }`).join('\n');
  const fonts = [['Regular', 400], ['Medium', 500], ['SemiBold', 600]]
    .map(([f, w]) => `@font-face { font-family: Inter; font-weight: ${w}; src: url("${fontUrl(`Inter-${f}.ttf`)}"); }`)
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
