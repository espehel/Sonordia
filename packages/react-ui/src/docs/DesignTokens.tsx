import { cn } from '../lib/utils';

type Swatch = {
  name: string;
  bg: string;
  // Surfaces and a few neutrals don't have enough contrast against the page
  // background to be visible without an outline.
  border?: boolean;
};

const SURFACE_TOKENS: Swatch[] = [
  { name: 'background', bg: 'bg-background', border: true },
  { name: 'foreground', bg: 'bg-foreground' },
  { name: 'card', bg: 'bg-card', border: true },
  { name: 'popover', bg: 'bg-popover', border: true },
  { name: 'muted', bg: 'bg-muted', border: true },
];

const ROLE_TOKENS: Swatch[] = [
  { name: 'primary', bg: 'bg-primary' },
  { name: 'secondary', bg: 'bg-secondary', border: true },
  { name: 'accent', bg: 'bg-accent', border: true },
  { name: 'destructive', bg: 'bg-destructive' },
];

const FORM_TOKENS: Swatch[] = [
  { name: 'border', bg: 'bg-border', border: true },
  { name: 'input', bg: 'bg-input', border: true },
  { name: 'ring', bg: 'bg-ring' },
];

const CHART_TOKENS: Swatch[] = [
  { name: 'chart-1', bg: 'bg-chart-1' },
  { name: 'chart-2', bg: 'bg-chart-2' },
  { name: 'chart-3', bg: 'bg-chart-3' },
  { name: 'chart-4', bg: 'bg-chart-4' },
  { name: 'chart-5', bg: 'bg-chart-5' },
];

const SIDEBAR_TOKENS: Swatch[] = [
  { name: 'sidebar', bg: 'bg-sidebar', border: true },
  { name: 'sidebar-primary', bg: 'bg-sidebar-primary' },
  { name: 'sidebar-accent', bg: 'bg-sidebar-accent', border: true },
  { name: 'sidebar-border', bg: 'bg-sidebar-border', border: true },
  { name: 'sidebar-ring', bg: 'bg-sidebar-ring' },
];

const RADIUS_TOKENS = [
  { name: 'radius-sm', className: 'rounded-sm' },
  { name: 'radius-md', className: 'rounded-md' },
  { name: 'radius-lg', className: 'rounded-lg' },
  { name: 'radius-xl', className: 'rounded-xl' },
];

// Tailwind v4's default `--spacing` is 0.25rem (4px). Each step on the scale is
// `n * --spacing`. Showing the steps that actually appear in this codebase.
const SPACING_TOKENS = [
  { step: 0.5, className: 'w-0.5', px: 2 },
  { step: 1, className: 'w-1', px: 4 },
  { step: 1.5, className: 'w-1.5', px: 6 },
  { step: 2, className: 'w-2', px: 8 },
  { step: 3, className: 'w-3', px: 12 },
  { step: 4, className: 'w-4', px: 16 },
  { step: 6, className: 'w-6', px: 24 },
  { step: 8, className: 'w-8', px: 32 },
  { step: 10, className: 'w-10', px: 40 },
  { step: 12, className: 'w-12', px: 48 },
  { step: 16, className: 'w-16', px: 64 },
  { step: 20, className: 'w-20', px: 80 },
  { step: 24, className: 'w-24', px: 96 },
];

function Swatch({ swatch }: { swatch: Swatch }) {
  return (
    <div className="space-y-1.5">
      <div className={cn('h-16 rounded-md', swatch.bg, swatch.border && 'border')} aria-hidden />
      <div className="text-foreground font-mono text-xs">--{swatch.name}</div>
    </div>
  );
}

function Group({ title, tokens }: { title: string; tokens: Swatch[] }) {
  return (
    <section className="mb-8">
      <h3 className="mb-3 text-sm font-semibold tracking-tight">{title}</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {tokens.map((t) => (
          <Swatch key={t.name} swatch={t} />
        ))}
      </div>
    </section>
  );
}

export function ColorTokens() {
  return (
    <div className="text-foreground">
      <Group title="Surfaces" tokens={SURFACE_TOKENS} />
      <Group title="Roles" tokens={ROLE_TOKENS} />
      <Group title="Form" tokens={FORM_TOKENS} />
      <Group title="Charts" tokens={CHART_TOKENS} />
      <Group title="Sidebar" tokens={SIDEBAR_TOKENS} />
    </div>
  );
}

export function RadiusTokens() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {RADIUS_TOKENS.map((r) => (
        <div key={r.name} className="flex flex-col items-center gap-2">
          <div className={cn('bg-primary size-20', r.className)} />
          <div className="text-xs font-medium">--{r.name}</div>
        </div>
      ))}
    </div>
  );
}

export function SpacingTokens() {
  return (
    <div className="text-foreground space-y-1">
      {SPACING_TOKENS.map((s) => (
        <div key={s.step} className="flex items-center gap-4 text-xs">
          <div className="text-muted-foreground w-10 font-mono tabular-nums">{s.step}</div>
          <div className="text-muted-foreground w-12 font-mono tabular-nums">{s.px}px</div>
          <div className={cn('bg-primary h-3 rounded-sm', s.className)} />
        </div>
      ))}
    </div>
  );
}

export function TypographyTokens() {
  return (
    <div className="text-foreground space-y-2">
      <p className="text-xs">text-xs — The quick brown fox jumps over the lazy dog</p>
      <p className="text-sm">text-sm — The quick brown fox jumps over the lazy dog</p>
      <p className="text-base">text-base — The quick brown fox jumps over the lazy dog</p>
      <p className="text-lg">text-lg — The quick brown fox jumps over the lazy dog</p>
      <p className="text-xl">text-xl — The quick brown fox jumps over the lazy dog</p>
      <p className="text-2xl">text-2xl — The quick brown fox jumps over the lazy dog</p>
    </div>
  );
}
