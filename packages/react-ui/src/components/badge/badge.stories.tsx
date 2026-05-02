import type { Meta, StoryObj } from "@storybook/react-vite";
import { CheckIcon } from "lucide-react";

import { Badge } from "./badge";

const meta = {
  title: "Components/Badge",
  component: Badge,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: { children: "Badge" },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "secondary", "destructive", "outline", "ghost", "link"],
    },
    asChild: { control: "boolean" },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Secondary: Story = { args: { variant: "secondary" } };
export const Destructive: Story = { args: { variant: "destructive" } };
export const Outline: Story = { args: { variant: "outline" } };
export const Ghost: Story = { args: { variant: "ghost" } };
export const LinkVariant: Story = {
  name: "Link",
  args: { variant: "link", asChild: true, children: <a href="#">Link badge</a> },
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="ghost">Ghost</Badge>
    </div>
  ),
};

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <CheckIcon /> Verified
      </>
    ),
  },
};
