import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor } from "storybook/test";
import { CopyIcon } from "lucide-react";

import { Button } from "../button/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

const meta = {
  title: "Components/Tooltip",
  component: Tooltip,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Copy">
          <CopyIcon />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Copy to clipboard</TooltipContent>
    </Tooltip>
  ),
};

export const Sides: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-6">
      {(["top", "right", "bottom", "left"] as const).map((side) => (
        <Tooltip key={side}>
          <TooltipTrigger asChild>
            <Button variant="outline">{side}</Button>
          </TooltipTrigger>
          <TooltipContent side={side}>Tooltip on {side}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  ),
};

export const ShowsOnHover: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">Hover me</Button>
      </TooltipTrigger>
      <TooltipContent>Visible after hover</TooltipContent>
    </Tooltip>
  ),
  play: async ({ canvas }) => {
    await userEvent.hover(canvas.getByRole("button", { name: "Hover me" }));
    await waitFor(async () => {
      const tooltip = document.querySelector('[data-slot="tooltip-content"]');
      await expect(tooltip).toBeTruthy();
      await expect(tooltip?.textContent).toContain("Visible after hover");
    });
  },
};
