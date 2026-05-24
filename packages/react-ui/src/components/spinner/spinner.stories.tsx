import type { Meta, StoryObj } from '@storybook/react-vite';

import { Spinner } from './spinner';

const meta = {
  title: 'Brand/Spinner',
  component: Spinner,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Transparent: Story = { args: { background: false } };

export const Small: Story = { args: { className: 'size-5' } };
export const Medium: Story = { args: { className: 'size-10' } };
export const Large: Story = { args: { className: 'size-24' } };

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      <Spinner className="size-5" />
      <Spinner className="size-8" />
      <Spinner className="size-12" />
      <Spinner className="size-20" />
    </div>
  ),
};

export const InlineWithText: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Spinner className="size-5" />
      <span className="text-sm">Loading…</span>
    </div>
  ),
};
