import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent } from 'storybook/test';

import { Label } from './label';
import { Checkbox } from '../checkbox/checkbox';
import { Input } from '../input/input';

const meta = {
  title: 'Components/Label',
  component: Label,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { children: 'Email address' },
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => <Label {...args} />,
};

export const WithInput: Story = {
  render: () => (
    <div className="grid w-72 gap-1.5">
      <Label htmlFor="email">Email</Label>
      <Input id="email" type="email" placeholder="you@example.com" />
    </div>
  ),
};

export const WithCheckbox: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="newsletter" />
      <Label htmlFor="newsletter">Subscribe to the newsletter</Label>
    </div>
  ),
};

export const FocusesAssociatedInput: Story = {
  render: () => (
    <div className="grid w-72 gap-1.5">
      <Label htmlFor="username">Username</Label>
      <Input id="username" placeholder="@espen" />
    </div>
  ),
  play: async ({ canvas }) => {
    const label = canvas.getByText('Username');
    const input = canvas.getByLabelText('Username');
    await userEvent.click(label);
    await expect(input).toHaveFocus();
  },
};
