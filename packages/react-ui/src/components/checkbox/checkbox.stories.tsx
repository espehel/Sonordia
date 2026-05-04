import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent } from 'storybook/test';

import { Checkbox } from './checkbox';
import { Label } from '../label/label';

const meta = {
  title: 'Components/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { onCheckedChange: fn() },
  argTypes: {
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { 'aria-label': 'Accept terms' },
};

export const Checked: Story = {
  args: { defaultChecked: true, 'aria-label': 'Subscribed' },
};

export const Indeterminate: Story = {
  args: { checked: 'indeterminate', 'aria-label': 'Mixed selection' },
};

export const Disabled: Story = {
  args: { disabled: true, 'aria-label': 'Locked' },
};

export const DisabledChecked: Story = {
  args: { disabled: true, defaultChecked: true, 'aria-label': 'Locked checked' },
};

export const Invalid: Story = {
  args: { 'aria-invalid': true, 'aria-label': 'Invalid' },
};

export const WithLabel: Story = {
  render: (args) => (
    <div className="flex items-center gap-2">
      <Checkbox id="terms" {...args} />
      <Label htmlFor="terms">Accept terms and conditions</Label>
    </div>
  ),
};

export const WithLabelDisabled: Story = {
  render: (args) => (
    <div className="flex items-center gap-2">
      <Checkbox id="terms-disabled" disabled {...args} />
      <Label htmlFor="terms-disabled">Accept terms and conditions</Label>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "The Label uses `peer-disabled:opacity-50` to follow the checkbox's disabled state when wrapped or sitting next to it.",
      },
    },
  },
};

export const TogglesOnClick: Story = {
  args: { 'aria-label': 'Toggle me' },
  render: function Toggling(args) {
    const [checked, setChecked] = useState(false);
    return (
      <Checkbox
        {...args}
        checked={checked}
        onCheckedChange={(value) => {
          setChecked(value === true);
          args.onCheckedChange?.(value);
        }}
      />
    );
  },
  play: async ({ canvas, args }) => {
    const checkbox = canvas.getByRole('checkbox', { name: 'Toggle me' });
    await expect(checkbox).not.toBeChecked();
    await userEvent.click(checkbox);
    await expect(checkbox).toBeChecked();
    await expect(args.onCheckedChange).toHaveBeenLastCalledWith(true);
    await userEvent.click(checkbox);
    await expect(checkbox).not.toBeChecked();
    await expect(args.onCheckedChange).toHaveBeenLastCalledWith(false);
  },
};
