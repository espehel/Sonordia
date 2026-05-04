import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';

import { Button } from '../button/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';
import { Input } from '../input/input';

const meta = {
  title: 'Components/Dialog',
  component: Dialog,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <Input placeholder="Name" aria-label="Name" defaultValue="Espen" />
          <Input placeholder="Username" aria-label="Username" defaultValue="@espen" />
        </div>
        <DialogFooter showCloseButton>
          <Button>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const HiddenCloseButton: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Open</Button>
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>No corner close</DialogTitle>
          <DialogDescription>
            The header X is hidden. Provide an explicit close button instead.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const OpensAndCloses: Story = {
  args: { onOpenChange: fn() },
  render: (args) => (
    <Dialog {...args}>
      <DialogTrigger asChild>
        <Button>Open</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm action</DialogTitle>
          <DialogDescription>This is a controlled visibility test.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Open' }));
    const dialog = await waitFor(() => document.querySelector('[data-slot="dialog-content"]'));
    await expect(dialog).toBeTruthy();
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(true);

    const cancel = await waitFor(() =>
      Array.from(document.querySelectorAll('button')).find((b) => b.textContent === 'Cancel'),
    );
    await userEvent.click(cancel!);
    await waitFor(() => expect(document.querySelector('[data-slot="dialog-content"]')).toBeNull());
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(false);
  },
};
