import type { Preview } from '@storybook/react-vite';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// MUI's default theme with Emotion: component styles are generated at runtime with the theme's values written
// out literally (`background-color: #1976d2`), not as CSS custom properties. That is the point of this fixture.
const themes = { light: createTheme({ palette: { mode: 'light' } }), dark: createTheme({ palette: { mode: 'dark' } }) };

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'MUI palette mode',
      toolbar: { title: 'Theme', items: ['light', 'dark'], dynamicTitle: true },
    },
  },
  initialGlobals: { theme: 'light' },
  decorators: [
    (Story, context) => {
      const mode = context.globals.theme === 'dark' ? 'dark' : 'light';
      // The page behind a themed component is the theme's paper colour, as in an app.
      document.body.style.background = themes[mode].palette.background.default;
      return (
        <ThemeProvider theme={themes[mode]}>
          <div style={{ padding: 16 }}>
            <Story />
          </div>
        </ThemeProvider>
      );
    },
  ],
};

export default preview;
