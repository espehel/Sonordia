import type { Meta, StoryObj } from '@storybook/react-vite';

import { LogoMark } from './logo-mark';
import { LogoMarkAnimated } from './logo-mark-animated';

const meta = {
  title: 'Brand/LogoMark',
  component: LogoMark,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof LogoMark>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Small: Story = { args: { className: 'size-5' } };
export const Medium: Story = { args: { className: 'size-10' } };
export const Large: Story = { args: { className: 'size-24' } };

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      <LogoMark className="size-5" />
      <LogoMark className="size-8" />
      <LogoMark className="size-12" />
      <LogoMark className="size-20" />
    </div>
  ),
};

export const InlineWithText: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <LogoMark className="size-6" />
      <span className="text-lg font-semibold tracking-tight">Sonordia</span>
    </div>
  ),
};

export const Animated: Story = {
  name: 'Animated (SMIL)',
  render: () => <LogoMarkAnimated className="size-24" />,
};

export const StaticVsAnimated: Story = {
  render: () => (
    <div className="flex items-end gap-8">
      <div className="flex flex-col items-center gap-2">
        <LogoMark className="size-20" />
        <span className="text-foreground/70 text-xs">Static</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <LogoMarkAnimated className="size-20" />
        <span className="text-foreground/70 text-xs">Animated</span>
      </div>
    </div>
  ),
};
