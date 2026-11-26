import type { Meta, StoryObj } from '@storybook/react-vite';
import { ClickableTile, Tile } from '@carbon/react';

// Tile has no variant axes in Carbon's Storybook; each story is one component.
const meta = { title: 'Tile', component: Tile } satisfies Meta<typeof Tile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { render: () => <Tile>Default tile</Tile> };

export const Clickable: Story = {
  render: () => <ClickableTile href="#">Clickable tile</ClickableTile>,
};
