import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tag } from '@carbon/react';

// The same axes as Carbon's own Storybook (Components/Tag, read-only tag).
const meta = {
  title: 'Tag',
  component: Tag,
  args: { children: 'Tag', type: 'red', size: 'md' },
  argTypes: {
    type: { control: 'select', options: ['red', 'blue', 'cyan', 'teal', 'green', 'gray', 'high-contrast', 'outline'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof Tag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ReadOnly: Story = {};
