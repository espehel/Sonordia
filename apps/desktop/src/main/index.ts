import { app, BrowserWindow, dialog, protocol, shell } from 'electron';
import { join, extname } from 'path';
import { createReadStream, statSync } from 'fs';
import { Readable } from 'stream';
import type { ReadableStream as NodeReadableStream } from 'stream/web';
import { initDb, getSong } from './db';
import { PythonBridge } from './python-bridge';
import { registerIpc } from './ipc';
import { VizBackfill } from './viz-backfill';

const isDev = !app.isPackaged;
const bridge = new PythonBridge();
const backfill = new VizBackfill(bridge);

if (process.env.ENABLE_PLAYWRIGHT_DEBUG === '1') {
  app.commandLine.appendSwitch('remote-debugging-port', '9222');
}

// Must be called before app.whenReady() — registers audio:// as a standard,
// secure scheme so <audio src="audio://..."> works under sandbox/CORS rules.
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'audio',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
      bypassCSP: true,
    },
  },
]);

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: join(__dirname, '../preload/index.js'),
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (isDev && process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

const AUDIO_MIME: Record<string, string> = {
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.flac': 'audio/flac',
  '.ogg': 'audio/ogg',
  '.oga': 'audio/ogg',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
};

function registerAudioProtocol(): void {
  protocol.handle('audio', async (request) => {
    let songId: string;
    try {
      const url = new URL(request.url);
      songId = decodeURIComponent(url.hostname || url.pathname.replace(/^\/+/, ''));
    } catch {
      return new Response(null, { status: 400 });
    }

    const song = getSong(songId);
    if (!song) return new Response(null, { status: 404 });

    let stat;
    try {
      stat = statSync(song.file_path);
    } catch {
      return new Response(null, { status: 404 });
    }

    const mime = AUDIO_MIME[extname(song.file_path).toLowerCase()] ?? 'application/octet-stream';
    const total = stat.size;
    const range = request.headers.get('range');

    if (range) {
      const match = /^bytes=(\d+)-(\d*)$/.exec(range);
      if (match) {
        const start = parseInt(match[1], 10);
        const end = match[2] ? Math.min(parseInt(match[2], 10), total - 1) : total - 1;
        if (start >= total || end < start) {
          return new Response(null, {
            status: 416,
            headers: { 'Content-Range': `bytes */${total}` },
          });
        }
        const node = createReadStream(song.file_path, { start, end });
        const web = Readable.toWeb(node) as NodeReadableStream<Uint8Array>;
        return new Response(web as unknown as BodyInit, {
          status: 206,
          headers: {
            'Content-Type': mime,
            'Content-Length': String(end - start + 1),
            'Content-Range': `bytes ${start}-${end}/${total}`,
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'no-cache',
          },
        });
      }
    }

    const node = createReadStream(song.file_path);
    const web = Readable.toWeb(node) as NodeReadableStream<Uint8Array>;
    return new Response(web as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': mime,
        'Content-Length': String(total),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-cache',
      },
    });
  });
}

app.whenReady().then(() => {
  initDb();
  registerAudioProtocol();
  registerIpc(bridge, backfill);
  bridge.start();
  bridge
    .waitReady()
    .then(() => {
      console.log('[main] Python bridge ready');
      void backfill.start();
    })
    .catch((err) => {
      console.error('[main] Python bridge failed to start:', err);
      if (app.isPackaged) {
        dialog.showErrorBox(
          'Analysis Engine Error',
          `The audio analysis engine failed to start.\n\n${err.message}\n\nSong analysis will not be available until the app is restarted.`,
        );
      }
    });
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  backfill.cancel();
  bridge.kill();
});
