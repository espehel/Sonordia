import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './card';

const meta = {
  title: 'Components/Card',
  component: Card,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Card title</CardTitle>
        <CardDescription>A short description of what this card contains.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">
          Cards group related content. Stack a header, content, and footer to compose layouts.
        </p>
      </CardContent>
      <CardFooter>
        <Button size="sm">Action</Button>
      </CardFooter>
    </Card>
  ),
};

export const WithAction: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>You have 3 unread messages.</CardDescription>
        <CardAction>
          <Button variant="ghost" size="sm">
            Mark all read
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1 text-sm">
          <li>New comment on your post</li>
          <li>Build finished successfully</li>
          <li>Weekly digest ready</li>
        </ul>
      </CardContent>
    </Card>
  ),
};

export const WithBorderedFooter: Story = {
  render: () => (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Plan</CardTitle>
        <CardDescription>Your current subscription.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">Pro — billed monthly</p>
      </CardContent>
      <CardFooter className="border-t">
        <Button variant="outline" size="sm">
          Manage
        </Button>
      </CardFooter>
    </Card>
  ),
};
