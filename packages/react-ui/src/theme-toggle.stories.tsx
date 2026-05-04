import type { Meta, StoryObj } from '@storybook/react-vite';

import { ThemeToggle } from './theme-toggle';

const meta = {
  title: 'Components/ThemeToggle',
  component: ThemeToggle,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Toggles between light and dark by writing to `localStorage` and adding the `dark` class to `<html>`. The Storybook theme toolbar uses the same class, so the two stay in sync.',
      },
    },
  },
} satisfies Meta<typeof ThemeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
