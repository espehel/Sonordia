# Sonordia monorepo

npm workspaces. Apps live under `apps/`, shared packages under `packages/`.

## Before working in a package or app, read its CLAUDE.md

Every directory under `apps/` and `packages/` may have its own `CLAUDE.md` with conventions, wrapper scripts, and required workflows that the bare upstream tool (shadcn CLI, electron-vite, etc.) does not enforce. **Read it before running commands, adding files, or installing components** — even for "small" tasks.

Current per-package docs:

- `apps/desktop/CLAUDE.md`
- `packages/react-ui/CLAUDE.md`

If you're about to act inside one of these directories and haven't read its `CLAUDE.md` this session, stop and read it first. The cost is one `Read` call; the cost of skipping it is rework and clobbered conventions.
