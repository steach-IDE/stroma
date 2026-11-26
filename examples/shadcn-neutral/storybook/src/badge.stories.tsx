import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from './components/ui/badge';
import variants from './variants.json';

// The oracle's stand-in icon: a circle of radius 10 in a 24 box.
const Icon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
  </svg>
);

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

/** A leading icon, so the extractor sees the `[&>svg]` rules apply. */
export const WithIcon: Story = {
  args: { children: (<><Icon />Badge</>) },
};
