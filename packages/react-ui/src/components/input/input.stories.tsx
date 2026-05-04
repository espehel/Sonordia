import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';

import { Input } from './input';

const meta = {
  title: 'Components/Input',
  component: Input,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { onChange: fn() },
  decorators: [
    (Story) => (
      <div className="w-72">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { placeholder: 'Email address', 'aria-label': 'Email' },
};

export const Disabled: Story = {
  args: { placeholder: 'Disabled', disabled: true, 'aria-label': 'Disabled input' },
};

export const Invalid: Story = {
  args: {
    placeholder: 'you@example.com',
    'aria-invalid': true,
    defaultValue: 'not-an-email',
    'aria-label': 'Email',
  },
};

export const Password: Story = {
  args: { type: 'password', placeholder: 'Password', 'aria-label': 'Password' },
};

export const File: Story = {
  args: { type: 'file', 'aria-label': 'Upload file' },
};

export const TypesUserInput: Story = {
  args: { placeholder: 'Type here', 'aria-label': 'Free text' },
  play: async ({ canvas, args }) => {
    const input = canvas.getByLabelText('Free text');
    await userEvent.type(input, 'hello world');
    await expect(input).toHaveValue('hello world');
    await expect(args.onChange).toHaveBeenCalled();
  },
};
