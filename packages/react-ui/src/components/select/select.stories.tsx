import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './select';

const meta = {
  title: 'Components/Select',
  component: Select,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-56" aria-label="Fruit">
        <SelectValue placeholder="Pick a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="banana">Banana</SelectItem>
        <SelectItem value="cherry">Cherry</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const Small: Story = {
  render: () => (
    <Select>
      <SelectTrigger size="sm" className="w-40" aria-label="Size">
        <SelectValue placeholder="Pick a size" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="s">Small</SelectItem>
        <SelectItem value="m">Medium</SelectItem>
        <SelectItem value="l">Large</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const WithGroups: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-56" aria-label="Timezone">
        <SelectValue placeholder="Pick a timezone" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>North America</SelectLabel>
          <SelectItem value="pst">Pacific (PST)</SelectItem>
          <SelectItem value="est">Eastern (EST)</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Europe</SelectLabel>
          <SelectItem value="cet">Central (CET)</SelectItem>
          <SelectItem value="gmt">Greenwich (GMT)</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Select disabled>
      <SelectTrigger className="w-56" aria-label="Disabled">
        <SelectValue placeholder="Locked" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="a">A</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const SelectsValue: Story = {
  args: { onValueChange: fn() },
  render: (args) => (
    <Select {...args}>
      <SelectTrigger className="w-56" aria-label="Fruit">
        <SelectValue placeholder="Pick a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="banana">Banana</SelectItem>
      </SelectContent>
    </Select>
  ),
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('combobox', { name: 'Fruit' }));
    const banana = await waitFor(() =>
      Array.from(document.querySelectorAll('[data-slot="select-item"]')).find(
        (el) => el.textContent === 'Banana',
      ),
    );
    await userEvent.click(banana as HTMLElement);
    await expect(args.onValueChange).toHaveBeenCalledWith('banana');
  },
};
