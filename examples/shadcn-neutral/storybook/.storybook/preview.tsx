import type { Preview } from '@storybook/react-vite';
import '../src/globals.css';

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'shadcn colour mode',
      toolbar: { title: 'Theme', items: ['light', 'dark'], dynamicTitle: true },
    },
  },
  initialGlobals: { theme: 'light' },
  decorators: [
    (Story, context) => {
      // shadcn's dark mode is the `dark` class on an ancestor (`@custom-variant dark (&:is(.dark *))`).
      document.documentElement.classList.toggle('dark', context.globals.theme === 'dark');
      return (
        <div style={{ padding: 16 }}>
          <Story />
        </div>
      );
    },
  ],
};

export default preview;
