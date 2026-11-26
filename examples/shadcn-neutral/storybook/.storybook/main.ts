import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/react-vite';
import tailwindcss from '@tailwindcss/vite';

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: ['../src/**/*.stories.tsx'],
  staticDirs: ['../public'],
  // A test fixture must not send usage data anywhere.
  core: { disableTelemetry: true },
  viteFinal: async (vite) => {
    vite.plugins = [...(vite.plugins ?? []), tailwindcss()];
    vite.resolve = {
      ...vite.resolve,
      // The registry's sources import the `cn` helper by this placeholder name; keep them byte-identical.
      alias: [{ find: /^cn$/, replacement: fileURLToPath(new URL('../src/lib/utils.ts', import.meta.url)) }],
    };
    return vite;
  },
};

export default config;
