import type { Preview } from '@storybook/react-vite';
import { Theme } from '@carbon/react';
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
      // `Theme` puts the theme's class (`cds--g90`) on a wrapper; `GlobalTheme` only sets React context.
      <Theme theme={context.globals.theme}>
        <div style={{ padding: 16 }}>
          <Story />
        </div>
      </Theme>
    ),
  ],
};

export default preview;
