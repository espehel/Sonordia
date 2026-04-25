# MusicalKey Desktop Development Guide

## Project Overview

Electron desktop app for musical key and BPM analysis. Part of the MusicalKeyCNN monorepo. Users import audio files into a local SQLite library, analyze them for key (Camelot wheel) and BPM via a Python child process, and organize results into playlists.

The app spawns a long-running Python process (`bridge/analyzer.py`) that communicates via JSON-lines over stdin/stdout, calling the same `key_prediction` and `bpm_analysis` packages used by the FastAPI API.

## Directory Structure

```text
apps/desktop/
├── package.json
├── electron-builder.yml        # Packaging config (macOS .dmg/.zip)
├── electron.vite.config.ts     # NOT vite.config.ts — electron-vite uses this name
├── tsconfig.json               # Project references root
├── tsconfig.node.json          # Main + preload TypeScript config
├── tsconfig.web.json           # Renderer TypeScript config
├── bridge/
│   └── analyzer.py             # Long-running Python process (JSON-lines protocol)
├── src/
│   ├── main/
│   │   ├── index.ts            # App entry, BrowserWindow, bridge + IPC init
│   │   ├── ipc.ts              # All ipcMain.handle registrations
│   │   ├── db.ts               # SQLite schema + CRUD (better-sqlite3)
│   │   └── python-bridge.ts    # Spawn/manage Python child process
│   ├── preload/
│   │   ├── index.ts            # contextBridge.exposeInMainWorld('api', ...)
│   │   └── api.d.ts            # ElectronAPI type declarations (shared with renderer)
│   └── renderer/
│       ├── index.html          # Lives in src/renderer/, not project root
│       ├── main.tsx            # React entry
│       ├── App.tsx             # Root layout (sidebar + main content)
│       ├── types.ts            # Re-exports Song, Playlist types from preload
│       ├── hooks/
│       │   ├── useSongs.ts     # Song list + real-time updates
│       │   ├── usePlaylists.ts # Playlist CRUD + song management
│       │   └── useAnalysis.ts  # Bridge status + analyze actions
│       └── components/
│           ├── Sidebar.tsx     # Playlist nav, create/rename/delete
│           ├── SongTable.tsx   # All-songs table view
│           ├── SongRow.tsx     # Individual song row with actions
│           ├── PlaylistView.tsx # Playlist detail with drag-reorder
│           ├── ImportButton.tsx # Native file picker trigger
│           └── AnalysisStatus.tsx # Bridge health indicator
├── out/                        # Built output (gitignored)
└── dist/                       # Packaged app output (gitignored)
```

## Essential Commands

### Development

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server (electron-vite dev) |
| `npm run build` | Production build (electron-vite build) |
| `npm run package` | Package with electron-builder |
| `mise run desktop` | Same as `npm run dev` (from repo root) |
| `mise run desktop:install` | Install desktop dependencies |

### From Repo Root

| Command | Purpose |
|---------|---------|
| `mise run install` | Install all deps (Python + web + desktop) |
| `mise run api` | Run the FastAPI server (for reference) |

## Architecture

### Process Model

Electron runs three processes, each with its own build target in `electron.vite.config.ts`:

| Process | Entry | Role |
|---------|-------|------|
| **Main** | `src/main/index.ts` | Node.js process — window management, SQLite, IPC handlers, Python bridge |
| **Preload** | `src/preload/index.ts` | Sandboxed bridge — exposes `window.api` via `contextBridge` |
| **Renderer** | `src/renderer/main.tsx` | React UI — can only access main process through `window.api` |

### Security Configuration

The `BrowserWindow` is created with mandatory security settings:

```ts
webPreferences: {
  contextIsolation: true,    // Required — enables contextBridge
  nodeIntegration: false,    // Renderer cannot access Node.js
  sandbox: true,             // Further restricts renderer
  preload: join(__dirname, '../preload/index.js')
}
```

Never weaken these settings. The renderer must only communicate with the main process through the `window.api` exposed by the preload script.

### IPC Patterns

Two distinct patterns are used — don't mix them:

**Invoke/Handle (request-response)** — for CRUD operations:
```ts
// Preload: returns Promise
songs: { list: () => ipcRenderer.invoke('songs:list') }
// Main: registers handler
ipcMain.handle('songs:list', () => listSongs())
```

**Send/On (push)** — for real-time updates from main to renderer:
```ts
// Main: pushes to renderer
mainWindow.webContents.send('songs:updated', song)
// Preload: registers listener, returns unsubscribe
onSongUpdated: (cb) => {
  ipcRenderer.on('songs:updated', (_, song) => cb(song))
  return () => ipcRenderer.removeListener(...)
}
```

### IPC Channels Reference

**Invoke/Handle channels:** `songs:list`, `songs:add`, `songs:remove`, `songs:analyze`, `songs:analyze-all`, `songs:pick-files`, `playlists:list`, `playlists:create`, `playlists:rename`, `playlists:delete`, `playlists:songs`, `playlists:add-song`, `playlists:remove-song`, `playlists:reorder`

**Push channels:** `songs:updated` (Song), `bridge:status` (BridgeStatus)

### Type Safety Across Process Boundary

`src/preload/api.d.ts` declares the `ElectronAPI` interface. The renderer imports types from this file via `src/renderer/types.ts`. When adding a new IPC channel:

1. Add `ipcMain.handle` in `src/main/ipc.ts`
2. Add the method to `src/preload/index.ts`
3. Add the type to `ElectronAPI` in `src/preload/api.d.ts`

### Python Bridge

`bridge/analyzer.py` is a long-running process using JSON-lines over stdin/stdout:

```
Startup:  {"id": "__ready__", "status": "ok"}
Request:  {"id": "uuid", "command": "analyze", "path": "/path/to/song.mp3"}
Response: {"id": "uuid", "status": "ok", "key": {...}, "bpm": {...}}
Error:    {"id": "uuid", "status": "error", "error": "message"}
```

`src/main/python-bridge.ts` manages the process lifecycle:
- **Dev:** spawns via `uv run python apps/desktop/bridge/analyzer.py` from the repo root
- **Production:** spawns a PyInstaller binary from `extraResources`, passes `MODEL_PATH` env pointing to bundled checkpoint
- Checks binary existence (`existsSync`) and sets executable permission (`chmodSync`) before spawning in production
- `waitReady()` has a 30-second timeout to prevent hanging on slow or broken startup
- `analyze()` has a 2-minute per-request timeout to prevent leaked promises from hung analysis
- Auto-restarts on crash (up to 3 attempts with 2-second delay)
- Pending requests are rejected if the process exits
- Shows `dialog.showErrorBox` in packaged app when bridge fails (no DevTools available)

`bridge/analyzer.py` resolves the model checkpoint via `sys._MEIPASS` when running as a PyInstaller frozen binary, falling back to `MODEL_PATH` env var or a relative path for development. Forces UTF-8 encoding on stdin/stdout to prevent encoding errors on non-ASCII file paths.

### Database

SQLite via `better-sqlite3` (synchronous, runs in main process). Stored at `app.getPath('userData')/library.db`.

**Tables:** `songs`, `playlists`, `playlist_songs` (junction with position for ordering)

`better-sqlite3` is a native C++ addon. After `npm install`, run `npx electron-rebuild` to compile it against Electron's Node version. `electron-builder` handles this automatically during packaging.

### Dev vs Production Entry Point

```ts
// Dev: Vite dev server with HMR
if (isDev && process.env.ELECTRON_RENDERER_URL) {
  mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
}
// Production: built static files
else {
  mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
}
```

`electron-vite` sets `ELECTRON_RENDERER_URL` automatically in dev mode.

## Build Toolchain

| Tool | Purpose |
|------|---------|
| `electron-vite` | Builds main/preload/renderer in one config |
| `@vitejs/plugin-react` | JSX transform for renderer |
| `electron-builder` | Packages `.app`/`.dmg` (also rebuilds native modules) |
| `better-sqlite3` | Synchronous SQLite in main process |
| `uuid` | Song/playlist IDs |

## Packaging

`electron-builder.yml` configures the macOS build. The `extraResources` block copies the PyInstaller-built analyzer binary into the packaged app.

```bash
# Build for macOS (directory output, fast for testing)
npx electron-builder --mac --dir

# Build .dmg for distribution
npx electron-builder --mac
```

Output goes to `dist/` (gitignored).

### Code Signing & Notarization

`electron-builder.yml` enables `hardenedRuntime: true` and references `build/entitlements.mac.plist`. The entitlements include `com.apple.security.cs.disable-library-validation`, which is required for PyInstaller binaries that load dynamic libraries (torch, librosa, etc.) under macOS hardened runtime.

For distribution:
1. Set up a Developer ID certificate in your Apple Developer account
2. Configure `CSC_LINK` and `CSC_KEY_PASSWORD` environment variables for electron-builder
3. Add an `afterSign` hook or use `electron-notarize` to submit to Apple's notarization service
4. Without signing, Gatekeeper will block the PyInstaller binary on end-user Macs

For local testing without a certificate, pass `--config.mac.identity=null` to electron-builder.

## UI Conventions

- **Inline styles** — no CSS framework, consistent with `apps/web`
- **React 18** with TypeScript
- **system-ui font stack**
- Dark buttons (`#1a1a1a`), light backgrounds, `#eee` borders
- Status colors: pending `#888`, analyzing `#e6a200`, done `#2d8a4e`, error `#c00`

## Key Files

| File | Purpose |
|------|---------|
| `src/main/index.ts` | App entry — creates window, inits DB, starts bridge, registers IPC |
| `src/main/db.ts` | All database operations — schema, song CRUD, playlist CRUD |
| `src/main/python-bridge.ts` | Python process lifecycle — spawn, protocol, restart |
| `src/main/ipc.ts` | All IPC handlers — bridges renderer requests to DB/bridge |
| `src/preload/api.d.ts` | `ElectronAPI` interface — single source of truth for IPC types |
| `bridge/analyzer.py` | Python analysis process — imports from `key_prediction`, `bpm_analysis` |
| `electron.vite.config.ts` | Build config with `externalizeDepsPlugin` for main/preload |
| `electron-builder.yml` | Packaging config — app metadata, extraResources, macOS target |

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `MODEL_PATH` | Path to `keynet.pt` checkpoint (set in root `mise.toml`) |
| `DEVICE` | PyTorch device: `cpu` or `cuda` (default: `cpu`) |
| `ELECTRON_RENDERER_URL` | Set automatically by electron-vite in dev mode |

## Common Issues

**`better-sqlite3` crashes with ABI mismatch:**
Run `npx electron-rebuild` after `npm install`. The native module must be compiled against Electron's Node version, not the system Node.

**Python bridge fails to start in dev:**
Check that `uv` is installed and `uv sync` has been run from the repo root. The bridge resolves the repo root as 4 levels up from `out/main/` (`join(__dirname, '../../../..')`).

**`index.html` not found during build:**
`electron-vite` expects `index.html` at `src/renderer/index.html`, not the project root.

**Config file name:**
`electron-vite` uses `electron.vite.config.ts`, not `vite.config.ts`. Using the wrong name will silently fall back to defaults.

**`fsevents` build error on macOS:**
Already handled — `electron.vite.config.ts` externalizes `fsevents` in the main/preload rollup config.

**Duplicate song imports:**
Handled by `INSERT OR IGNORE` on the `file_path UNIQUE` constraint. Importing the same file twice is a no-op.
