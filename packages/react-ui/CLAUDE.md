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

The `shadcn:add` script (in `scripts/shadcn-add.mjs`) wraps `npx shadcn@latest add` and does two
things to the files shadcn emits:

1. **Rewrites the `@/` imports** to relative form:
   - `from "@/lib/utils"` → `from "../../lib/utils"`
   - `from "@/components/<x>"` → `from "../<x>/<x>"`
2. **Folds each generated file into its own folder.** shadcn writes flat to `src/components/<x>.tsx`
   (because `aliases.ui` in `components.json` is `@/components`); the script moves it to
   `src/components/<x>/<x>.tsx` so every component has its own folder.

Why the rewrite is needed: shadcn-generated files use the `@/` alias which only resolves inside this package's `tsconfig.json`. When a consumer app's `tsc` traverses into the source (which it must — we don't ship `.d.ts`), the alias fails. The relative form works everywhere.

### One thing the script does NOT do

Add the subpath export to `package.json` yourself:

```json
{
  "exports": {
    "./<component>": "./src/components/<component>/<component>.tsx"
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
    └── components/       # one folder per component
        ├── button/
        │   ├── button.tsx
        │   └── button.stories.tsx
        ├── card/
        │   ├── card.tsx
        │   └── card.stories.tsx
        └── ...
```

## TypeScript notes

- The package's `tsconfig.json` is `noEmit: true` and exists mainly so the shadcn CLI's `@/*` alias resolves when running locally and for editor language services. It is not used as a project reference by consumers.
- Consumer apps typecheck through this package's source transitively via `moduleResolution: "bundler"`. They do **not** declare `references` to this package — that requires `composite: true` + emit, which would defeat the source-only model.


## Storybook & docs

Every component in this package has a Storybook story. Stories are the source of truth for how a
component is meant to be used — design tokens, examples, and interaction tests all live there.

### Where files live

- `src/components/<name>/<name>.tsx` — the component (one folder per component)
- `src/components/<name>/<name>.stories.tsx` — co-located stories
- `src/docs/` — docs pages as regular `.stories.tsx` files (e.g. `design-tokens.stories.tsx`,
  with the swatch components in `DesignTokens.tsx`). Avoid `.mdx`: the addon-docs MDX loader
  produces a `file://` import URL that Vite can't resolve in this monorepo.
- `.storybook/` — Storybook config; `preview.ts` imports `styles.css` and registers the
  light/dark theme toolbar
- `npm run storybook` (from this package) starts the dev server

### When you add or change a component — required workflow

1. **Read the existing docs first.** Call the `react-ui-docs` MCP tools before touching props:
   - `list-all-documentation` to find the component
   - `get-documentation` to confirm props, variants, and examples
   - Never invent props from naming conventions or other libraries — if a prop isn't documented,
     ask the user.
2. **Call `get-storybook-story-instructions`** before writing or editing any `*.stories.tsx`
   file. It returns the current Storybook 9 conventions (imports from `@storybook/react-vite`,
   test helpers from `storybook/test`, `initialGlobals`, `canvas` in play functions, etc.).
3. **Update or create the story file.** A story exists for every component in
   `src/components/` plus root-level components like `theme-toggle`. If you:
   - **add a new component** → create `<name>.stories.tsx` next to it. Cover each meaningful
     variant (size/variant/state) and add a `play` function for interactive components
     (Dialog, Select, DropdownMenu, Toast, Tooltip, etc.).
   - **change an existing component** (new variant, new prop, behavior change) → update the
     story to demonstrate the new state. If the change is breaking, update existing stories so
     they still render.
   - **add a new design token** → update `src/docs/DesignTokens.tsx` so it appears on the
     `Foundations / Design tokens` page.
4. **Add the subpath export to `package.json`.** A new component file on disk is not enough —
   the `exports` map must include it (see "Adding a shadcn component" above). Stories import
   from the relative file (`./<name>`) so they work even before the export is added, but
   consumers need it.
5. **Run `run-story-tests`.** Use a focused run (pass the changed `storyId`s) while iterating,
   then a full run before reporting done. Fix every failure — a11y violations included.
6. **Call `preview-stories` and paste the URLs** in your reply so the user can visually verify
   the change. Do this for every story you touched, every time, even later in a session.

### Story checklist

- Imports: `Meta`, `StoryObj` from `@storybook/react-vite`; `fn`, `userEvent`, `expect`,
  `waitFor` from `storybook/test`.
- Add `tags: ["autodocs"]` so the component shows up in the autodocs sidebar.
- Use `parameters.layout: "centered"` for small components, `"padded"` for full-width.
- Cover every behaviorally distinct state — variants that only change color count once
  (use a single `Variants` story that renders them side by side), but states that change
  logic (loading/empty/error/disabled/invalid) each get their own story.
- For interactive components, write at least one play function asserting the visible outcome
  (`expect(args.onChange).toHaveBeenCalled()`, dialog content appears, toast shows up).
- Do **not** create or modify the example stories (`Button`, `Header`, `Page`) that came with
  the Storybook scaffold — they were removed and should not come back.

### Don't

- Don't add `tailwind.config.js` or override design tokens in JS — edit `src/styles.css`.
- Don't read `window.api`, Electron globals, or app-specific data from a story. If a component
  needs platform behavior, the story should pass it via props (see "What does NOT belong here").
- Don't skip the MCP tools — story names sometimes don't match prop names, so always verify
  through `get-documentation` before using a prop.
