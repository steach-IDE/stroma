import type { Preview } from '@storybook/react-vite';
import { Theme } from '@carbon/react';
// Carbon's precompiled stylesheet: SCSS already compiled, so the build needs no Sass.
import '@carbon/styles/css/styles.css';
import light from '@ibm/plex-sans/fonts/complete/woff2/IBMPlexSans-Light.woff2?url';
import regular from '@ibm/plex-sans/fonts/complete/woff2/IBMPlexSans-Regular.woff2?url';
import semiBold from '@ibm/plex-sans/fonts/complete/woff2/IBMPlexSans-SemiBold.woff2?url';

// Carbon's stylesheet loads IBM Plex Sans from a CDN, which the extractor blocks and which would change under
// us. These faces come from the pinned @ibm/plex-sans, are declared later (so they win), and cover every range.
const face = (weight: number, url: string) =>
  `@font-face{font-family:"IBM Plex Sans";font-weight:${weight};font-style:normal;font-display:block;src:url(${url}) format("woff2")}`;
const style = document.createElement('style');
style.textContent = [face(300, light), face(400, regular), face(600, semiBold)].join('\n');
document.head.append(style);

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
