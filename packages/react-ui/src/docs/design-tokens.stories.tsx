import type { Meta, StoryObj } from '@storybook/react-vite';

import { ColorTokens, RadiusTokens, SpacingTokens, TypographyTokens } from './DesignTokens';

function DesignTokensPage() {
  return (
    <div className="text-foreground mx-auto max-w-5xl space-y-12 p-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Design tokens</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          The design system is built on CSS variables declared in{' '}
          <code className="text-foreground bg-muted rounded px-1 py-0.5 text-xs">
            src/styles.css
          </code>
          . Every token has a light and a dark value; switching is done by toggling the{' '}
          <code className="text-foreground bg-muted rounded px-1 py-0.5 text-xs">dark</code> class
          on{' '}
          <code className="text-foreground bg-muted rounded px-1 py-0.5 text-xs">&lt;html&gt;</code>
          . Use the theme toolbar above to flip the canvas and inspect tokens in both modes.
        </p>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Adding or tweaking a token? Edit{' '}
          <code className="text-foreground bg-muted rounded px-1 py-0.5 text-xs">:root</code> (and{' '}
          <code className="text-foreground bg-muted rounded px-1 py-0.5 text-xs">.dark</code>) in{' '}
          <code className="text-foreground bg-muted rounded px-1 py-0.5 text-xs">
            src/styles.css
          </code>
          . There is <strong>no</strong>{' '}
          <code className="text-foreground bg-muted rounded px-1 py-0.5 text-xs">
            tailwind.config.js
          </code>{' '}
          — Tailwind v4 reads the CSS-first declarations directly.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Colors</h2>
        <ColorTokens />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Radius</h2>
        <p className="text-muted-foreground text-sm">
          The base unit is{' '}
          <code className="text-foreground bg-muted rounded px-1 py-0.5 text-xs">--radius</code>{' '}
          (default{' '}
          <code className="text-foreground bg-muted rounded px-1 py-0.5 text-xs">0.5rem</code>).
          Tailwind&apos;s{' '}
          <code className="text-foreground bg-muted rounded px-1 py-0.5 text-xs">rounded-*</code>{' '}
          utilities map to scaled versions via{' '}
          <code className="text-foreground bg-muted rounded px-1 py-0.5 text-xs">
            @theme inline
          </code>
          .
        </p>
        <RadiusTokens />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Spacing</h2>
        <p className="text-muted-foreground text-sm">
          Tailwind v4&apos;s spacing scale is multiples of{' '}
          <code className="text-foreground bg-muted rounded px-1 py-0.5 text-xs">--spacing</code>{' '}
          (default{' '}
          <code className="text-foreground bg-muted rounded px-1 py-0.5 text-xs">0.25rem</code> =
          4px). The first column is the step you write in utilities like{' '}
          <code className="text-foreground bg-muted rounded px-1 py-0.5 text-xs">p-4</code> or{' '}
          <code className="text-foreground bg-muted rounded px-1 py-0.5 text-xs">gap-2</code>.
        </p>
        <SpacingTokens />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Typography scale</h2>
        <p className="text-muted-foreground text-sm">
          These come straight from Tailwind&apos;s defaults. The package does not override the type
          scale.
        </p>
        <TypographyTokens />
      </section>
    </div>
  );
}

const meta = {
  title: 'Foundations/Design tokens',
  component: DesignTokensPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: { story: { inline: true } },
  },
} satisfies Meta<typeof DesignTokensPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {};
