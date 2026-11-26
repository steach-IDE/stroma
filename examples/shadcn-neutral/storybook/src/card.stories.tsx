import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './components/ui/card';

// The same three examples, text and width as the oracle's card cells.
const meta = {
  title: 'Card',
  component: Card,
  decorators: [(Story) => <div style={{ width: 360 }}><Story /></div>],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

const Header = ({ action }: { action?: boolean }) => (
  <CardHeader>
    <CardTitle>Card title</CardTitle>
    <CardDescription>Card description that wraps onto a second line.</CardDescription>
    {action ? (
      <CardAction>
        <Button variant="outline" size="sm">Edit</Button>
      </CardAction>
    ) : null}
  </CardHeader>
);

export const Full: Story = {
  render: () => (
    <Card>
      <Header />
      <CardContent>Card content.</CardContent>
      <CardFooter>
        <Button>Save</Button>
      </CardFooter>
    </Card>
  ),
};

export const WithAction: Story = {
  render: () => (
    <Card>
      <Header action />
      <CardContent>Card content.</CardContent>
    </Card>
  ),
};

export const ContentOnly: Story = {
  render: () => (
    <Card>
      <CardContent>Only content.</CardContent>
    </Card>
  ),
};
