import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './components/ui/button';
import variants from './variants.json';

// The oracle's stand-in icon: a circle of radius 10 in a 24 box.
const Icon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
  </svg>
);

const meta = {
  title: 'Button',
  component: Button,
  args: { children: 'Button', variant: 'default', size: 'default', disabled: false },
  argTypes: {
    variant: { control: 'select', options: variants.button.variant },
    size: { control: 'select', options: variants.button.size },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** For the icon-only sizes (`icon`, `icon-xs`, `icon-sm`, `icon-lg`). */
export const IconOnly: Story = { args: { size: 'icon', children: <Icon /> } };
