# @sonordia/ui — Shared React UI

Shared React component library for `@sonordia/web` and `@sonordia/desktop`. Built on **shadcn/ui** (style: `new-york`, base color: `neutral`) over **Tailwind v4**.

## How this package is consumed

**Source-only export, no build step.** The `exports` map points directly at `.tsx` / `.ts` files. Consumer apps' bundlers (Vite, electron-vite) and TypeScript (`moduleResolution: "bundler"`) read the source directly. There is no `dist/`, no `tsc -b`, no rollup config to maintain.

**Per-component subpath exports — no barrel.** Importers must use the specific subpath:

```ts
import { Button } from "@sonordia/ui/button";
import { Card, CardContent } from "@sonordia/ui/card";
```

A single barrel (`@sonordia/ui`) was tried and rejected: re-exporting `Dialog` pulled the entire Radix Dialog tree into every consumer's module graph (~1700 modules transformed vs. ~150 with subpaths). Tree-shaking helps with final bundle size but not with build cost or HMR latency. Keep imports direct.

When adding a new component, **also add its subpath to `exports` in `package.json`** — the file existing on disk is not enough, the bundler uses the `exports` map to resolve.

The `cn` helper has its own subpath: `import { cn } from "@sonordia/ui/utils"`.

## Adding a shadcn component

Run from this directory:

```bash
cd packages/react-ui
npm run shadcn:add -- @shadcn/<component>
```

The `shadcn:add` script (in `scripts/shadcn-add.mjs`) wraps `npx shadcn@latest add` and **automatically rewrites** the `@/` imports it generates:

- `from "@/lib/utils"` → `from "../../lib/utils"`
- `from "@/components/ui/<x>"` → `from "./<x>"`

Why the rewrite is needed: shadcn-generated files use the `@/` alias which only resolves inside this package's `tsconfig.json`. When a consumer app's `tsc` traverses into the source (which it must — we don't ship `.d.ts`), the alias fails. The relative form works everywhere.

### One thing the script does NOT do

Add the subpath export to `package.json` yourself:

```json
{
  "exports": {
    "./<component>": "./src/components/ui/<component>.tsx"
  }
}
```

Without this, consumers can't `import` the new component — the file existing on disk is not enough. The script prints a reminder.

After all that, run `npm install` from the repo root so the workspace picks up new transitive deps shadcn added.

## Tailwind v4 setup

There is **no `tailwind.config.js`**. Tailwind v4 is CSS-first.

- `src/styles.css` is the single source of truth: imports Tailwind, declares the design-token CSS variables (light + dark), maps them to Tailwind theme variables via `@theme inline`, and `@source "../**/*.{ts,tsx}"` tells Tailwind to scan this package.
- Consumer apps install `@tailwindcss/vite`, register the plugin, and import this CSS once at entry: `import "@sonordia/ui/styles.css"`.
- Consumer source is auto-scanned by the Vite plugin from each app's project root.

To add or tweak a design token, edit the CSS variables in `:root` (and `.dark`) in `src/styles.css`. Don't add a JS theme config.

## What belongs here

- **Presentational primitives** — Button, Input, Card, Dialog, Table, etc.
- **Generic, platform-agnostic composites** that can render in either web or Electron renderer.
- **Design tokens / global CSS** in `src/styles.css`.

## What does NOT belong here

- **Window controls / titlebar** — Electron-specific, lives in `apps/desktop/src/renderer/`.
- **`window.api` / IPC bindings** — typed in `apps/desktop/src/preload/api.d.ts`; do not move it.
- **App-specific data hooks** (`useSongs`, `usePlaylists`, `usePlayer`, etc.) — they bind to `window.api` and stay in the desktop renderer.
- **Audio / canvas viz layers** (`PlayerPanel`, `WaveformLayer`, etc.) — coupled to the desktop's playback pipeline.
- **HTTP clients / API fetchers** — web-specific.

If a shared component needs platform-specific behavior, **pass it via props or context**, e.g. an `onPickFile` callback or a `usePlatform()` context value the app sets up. Do not reach into Electron or web globals from this package.

## React singleton

Both consumer apps must resolve the same React instance, or hooks blow up. Both `apps/web/vite.config.ts` and the `renderer` block of `apps/desktop/electron.vite.config.ts` set `resolve.dedupe: ['react', 'react-dom']`. Don't remove those.

`react` and `react-dom` are declared as `peerDependencies` here so npm doesn't install a second copy under the package.

## File layout

```
packages/react-ui/
├── package.json          # subpath exports, deps
├── components.json       # shadcn config (CLI reads this)
├── tsconfig.json         # composite, baseUrl, @/* alias for shadcn CLI
├── CLAUDE.md             # this file
└── src/
    ├── styles.css        # Tailwind v4 + tokens + @source
    ├── lib/
    │   └── utils.ts      # cn helper
    └── components/
        └── ui/
            ├── button.tsx
            ├── card.tsx
            ├── dialog.tsx
            ├── input.tsx
            └── table.tsx
```

## TypeScript notes

- The package's `tsconfig.json` is `noEmit: true` and exists mainly so the shadcn CLI's `@/*` alias resolves when running locally and for editor language services. It is not used as a project reference by consumers.
- Consumer apps typecheck through this package's source transitively via `moduleResolution: "bundler"`. They do **not** declare `references` to this package — that requires `composite: true` + emit, which would defeat the source-only model.
