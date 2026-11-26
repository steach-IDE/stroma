import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from './components/ui/badge';
import variants from './variants.json';

const meta = {
  title: 'Badge',
  component: Badge,
  args: { children: 'Badge', variant: 'default' },
  argTypes: { variant: { control: 'select', options: variants.badge.variant } },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Rendered as a link (`asChild` with `<a>`), which is when its hover styles apply. */
export const AsLink: Story = {
  render: (args) => (
    <Badge {...args} asChild>
      <a href="#">{args.children}</a>
    </Badge>
  ),
};
