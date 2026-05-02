import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent } from "storybook/test";
import { ArrowRight, Mail } from "lucide-react";

import { Button } from "./button";

const meta = {
  title: "Components/Button",
  component: Button,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: { children: "Button", onClick: fn() },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "destructive", "outline", "secondary", "ghost", "link"],
    },
    size: {
      control: "select",
      options: ["default", "xs", "sm", "lg", "icon", "icon-xs", "icon-sm", "icon-lg"],
    },
    disabled: { control: "boolean" },
    asChild: { control: "boolean" },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Destructive: Story = {
  args: { variant: "destructive", children: "Delete" },
};

export const Outline: Story = {
  args: { variant: "outline" },
};

export const Secondary: Story = {
  args: { variant: "secondary" },
};

export const Ghost: Story = {
  args: { variant: "ghost" },
};

export const Link: Story = {
  args: { variant: "link" },
};

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <Button {...args} variant="default">
        Default
      </Button>
      <Button {...args} variant="destructive">
        Destructive
      </Button>
      <Button {...args} variant="outline">
        Outline
      </Button>
      <Button {...args} variant="secondary">
        Secondary
      </Button>
      <Button {...args} variant="ghost">
        Ghost
      </Button>
      <Button {...args} variant="link">
        Link
      </Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <Button {...args} size="xs">
        Extra small
      </Button>
      <Button {...args} size="sm">
        Small
      </Button>
      <Button {...args} size="default">
        Default
      </Button>
      <Button {...args} size="lg">
        Large
      </Button>
    </div>
  ),
};

export const IconSizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <Button {...args} size="icon-xs" aria-label="Open mail">
        <Mail />
      </Button>
      <Button {...args} size="icon-sm" aria-label="Open mail">
        <Mail />
      </Button>
      <Button {...args} size="icon" aria-label="Open mail">
        <Mail />
      </Button>
      <Button {...args} size="icon-lg" aria-label="Open mail">
        <Mail />
      </Button>
    </div>
  ),
};

export const WithIcon: Story = {
  args: {
    children: (
      <>
        Continue <ArrowRight />
      </>
    ),
  },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const AsChild: Story = {
  args: {
    asChild: true,
    children: <a href="#example">Link rendered as button</a>,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Use `asChild` to merge button styles onto a different element (here, an anchor) without losing semantics.",
      },
    },
  },
};

export const FiresOnClick: Story = {
  args: { children: "Click me" },
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Click me" }));
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

export const DisabledDoesNotFire: Story = {
  args: { children: "Disabled", disabled: true },
  play: async ({ canvas, args }) => {
    const button = canvas.getByRole("button", { name: "Disabled" });
    await expect(button).toBeDisabled();
    await userEvent.click(button, { pointerEventsCheck: 0 });
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};
