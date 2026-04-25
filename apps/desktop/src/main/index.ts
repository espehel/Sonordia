import { app, BrowserWindow, dialog, shell } from 'electron'
import { join } from 'path'
import { initDb } from './db'
import { PythonBridge } from './python-bridge'
import { registerIpc } from './ipc'

const isDev = !app.isPackaged
const bridge = new PythonBridge()

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
      preload: join(__dirname, '../preload/index.js')
    }
  })

  // Open external links in the default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (isDev && process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  initDb()
  registerIpc(bridge)
  bridge.start()
  bridge.waitReady().then(() => {
    console.log('[main] Python bridge ready')
  }).catch((err) => {
    console.error('[main] Python bridge failed to start:', err)
    if (app.isPackaged) {
      dialog.showErrorBox(
        'Analysis Engine Error',
        `The audio analysis engine failed to start.\n\n${err.message}\n\nSong analysis will not be available until the app is restarted.`
      )
    }
  })
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  bridge.kill()
})
