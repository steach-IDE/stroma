import type { Preview } from '@storybook/react-vite';
import { GlobalTheme } from '@carbon/react';
// Carbon's precompiled stylesheet: SCSS already compiled, so the build needs no Sass.
import '@carbon/styles/css/styles.css';

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Carbon theme',
      toolbar: { title: 'Theme', items: ['white', 'g10', 'g90', 'g100'], dynamicTitle: true },
    },
  },
  initialGlobals: { theme: 'white' },
  decorators: [
    (Story, context) => (
      <GlobalTheme theme={context.globals.theme}>
        <div style={{ padding: 16 }}>
          <Story />
        </div>
      </GlobalTheme>
    ),
  ],
};

export default preview;
