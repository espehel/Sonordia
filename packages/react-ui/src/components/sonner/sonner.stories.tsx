import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor } from 'storybook/test';

import { Button } from '../button/button';
import { Toaster, toast } from './sonner';

const meta = {
  title: 'Components/Toast',
  component: Toaster,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <>
        <Story />
        <Toaster />
      </>
    ),
  ],
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <Button onClick={() => toast('Saved successfully')}>Show toast</Button>,
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={() => toast('Default toast')}>
        Default
      </Button>
      <Button variant="outline" onClick={() => toast.success('Settings updated')}>
        Success
      </Button>
      <Button variant="outline" onClick={() => toast.info('New version available')}>
        Info
      </Button>
      <Button variant="outline" onClick={() => toast.warning('Battery low')}>
        Warning
      </Button>
      <Button variant="outline" onClick={() => toast.error('Failed to save')}>
        Error
      </Button>
    </div>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <Button
      onClick={() =>
        toast('Scheduled', {
          description: 'Friday, March 12 at 9:00 AM',
        })
      }
    >
      Toast with description
    </Button>
  ),
};

export const ShowsOnClick: Story = {
  render: () => <Button onClick={() => toast.success('It worked')}>Trigger</Button>,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Trigger' }));
    await waitFor(async () => {
      const toastEl = document.querySelector('[data-sonner-toast]');
      await expect(toastEl).toBeTruthy();
      await expect(toastEl?.textContent).toContain('It worked');
    });
  },
};
