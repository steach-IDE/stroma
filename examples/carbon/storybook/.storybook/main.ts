import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: ['../src/**/*.stories.tsx'],
  // A test fixture must not send usage data anywhere.
  core: { disableTelemetry: true },
};

export default config;
