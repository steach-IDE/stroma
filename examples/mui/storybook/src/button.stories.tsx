import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@mui/material';

// MUI's own axes for Button (mui.com/material-ui/react-button).
const meta = {
  title: 'Button',
  component: Button,
  args: { children: 'Button', variant: 'contained', color: 'primary', size: 'medium', disabled: false },
  argTypes: {
    variant: { control: 'select', options: ['text', 'outlined', 'contained'] },
    color: { control: 'select', options: ['primary', 'secondary', 'error', 'warning', 'info', 'success'] },
    size: { control: 'select', options: ['small', 'medium', 'large'] },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
