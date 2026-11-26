import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@carbon/react';

// The same axes as Carbon's own Storybook (react.carbondesignsystem.com, Components/Button).
const meta = {
  title: 'Button',
  component: Button,
  args: { children: 'Button', kind: 'primary', size: 'lg', disabled: false },
  argTypes: {
    kind: { control: 'select', options: ['primary', 'secondary', 'tertiary', 'ghost', 'danger', 'danger--tertiary', 'danger--ghost'] },
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl', '2xl'] },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
