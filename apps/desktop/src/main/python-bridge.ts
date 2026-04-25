import { spawn, ChildProcess } from 'child_process'
import { app } from 'electron'
import { join } from 'path'
import { existsSync, chmodSync } from 'fs'
import { EventEmitter } from 'events'
import { v4 as uuid } from 'uuid'

export interface AnalysisResult {
  key: { camelot: string; key_name: string; key_id: number }
  bpm: { bpm: number; confidence: number; beat_count: number }
}

interface BridgeResponse {
  id: string
  status: 'ok' | 'error'
  key?: AnalysisResult['key']
  bpm?: AnalysisResult['bpm']
  error?: string
}

type PendingRequest = {
  resolve: (result: AnalysisResult) => void
  reject: (error: Error) => void
}

const MAX_RESTARTS = 3
const RESTART_DELAY_MS = 2000
const READY_TIMEOUT_MS = 30_000
const ANALYZE_TIMEOUT_MS = 120_000

export class PythonBridge extends EventEmitter {
  private process: ChildProcess | null = null
  private pending = new Map<string, PendingRequest>()
  private buffer = ''
  private ready = false
  private readyPromise!: Promise<void>
  private resolveReady!: () => void
  private rejectReady!: (err: Error) => void
  private readySettled = false
  private killed = false
  private restartCount = 0

  constructor() {
    super()
    this.resetReadyPromise()
  }

  private resetReadyPromise(): void {
    this.readySettled = false
    this.readyPromise = new Promise((resolve, reject) => {
      this.resolveReady = () => {
        if (!this.readySettled) {
          this.readySettled = true
          resolve()
        }
      }
      this.rejectReady = (err: Error) => {
        if (!this.readySettled) {
          this.readySettled = true
          reject(err)
        }
      }
    })
  }

  start(): void {
    this.killed = false
    const isDev = !app.isPackaged

    let command: string
    let args: string[]
    let cwd: string | undefined
    let env: NodeJS.ProcessEnv = { ...process.env }

    if (isDev) {
      // Dev: __dirname is apps/desktop/out/main/ → repo root is 4 levels up
      const repoRoot = join(__dirname, '../../../..')
      command = 'uv'
      args = ['run', 'python', 'apps/desktop/bridge/analyzer.py']
      cwd = repoRoot
    } else {
      // Production: use PyInstaller binary from extraResources
      const resourcePath = join(process.resourcesPath, 'bridge', 'analyzer')

      if (!existsSync(resourcePath)) {
        const err = new Error(`Analyzer binary not found at: ${resourcePath}`)
        this.rejectReady(err)
        this.emit('status', { status: 'error', error: err.message })
        return
      }

      // Ensure executable permission (may be stripped by CI or git)
      try {
        chmodSync(resourcePath, 0o755)
      } catch {
        // Non-fatal — spawn will surface EACCES if it matters
      }

      command = resourcePath
      args = []
      cwd = undefined

      // Pass MODEL_PATH pointing to the bundled checkpoint in extraResources
      env.MODEL_PATH = join(process.resourcesPath, 'checkpoints', 'keynet.pt')
    }

    this.process = spawn(command, args, {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      env
    })

    this.process.stdout!.on('data', (chunk: Buffer) => {
      this.buffer += chunk.toString()
      const lines = this.buffer.split('\n')
      this.buffer = lines.pop()!
      for (const line of lines) {
        if (line.trim()) this.handleLine(line.trim())
      }
    })

    this.process.stderr!.on('data', (chunk: Buffer) => {
      console.error('[bridge:stderr]', chunk.toString())
    })

    this.process.on('exit', (code) => {
      console.log(`[bridge] process exited with code ${code}`)
      const wasReady = this.ready
      this.ready = false
      this.process = null
      this.buffer = ''

      // Reject all pending requests
      for (const [, req] of this.pending) {
        req.reject(new Error('Python bridge process exited'))
      }
      this.pending.clear()

      if (!wasReady) {
        this.rejectReady(new Error(`Bridge exited with code ${code}`))
      }

      if (!this.killed) {
        this.emit('status', { status: 'exited', code })
        this.tryRestart()
      }
    })

    this.process.on('error', (err) => {
      console.error('[bridge] spawn error:', err)
      this.emit('status', { status: 'error', error: err.message })
      this.rejectReady(err)
    })
  }

  private tryRestart(): void {
    if (this.killed || this.restartCount >= MAX_RESTARTS) {
      if (this.restartCount >= MAX_RESTARTS) {
        console.error(`[bridge] max restarts (${MAX_RESTARTS}) reached, giving up`)
        this.emit('status', { status: 'error', error: 'Bridge crashed too many times' })
      }
      return
    }

    this.restartCount++
    console.log(`[bridge] restarting (attempt ${this.restartCount}/${MAX_RESTARTS})...`)
    this.emit('status', { status: 'restarting' })
    this.resetReadyPromise()

    setTimeout(() => {
      if (!this.killed) {
        this.start()
      }
    }, RESTART_DELAY_MS)
  }

  private handleLine(line: string): void {
    let msg: BridgeResponse
    try {
      msg = JSON.parse(line)
    } catch {
      console.error('[bridge] invalid JSON:', line)
      return
    }

    if (msg.id === '__ready__') {
      if (msg.status === 'ok') {
        this.ready = true
        this.restartCount = 0
        this.emit('status', { status: 'ready' })
        this.resolveReady()
      } else {
        this.rejectReady(new Error(msg.error ?? 'Bridge startup failed'))
        this.emit('status', { status: 'error', error: msg.error })
      }
      return
    }

    const pending = this.pending.get(msg.id)
    if (!pending) {
      console.warn('[bridge] response for unknown request:', msg.id)
      return
    }
    this.pending.delete(msg.id)

    if (msg.status === 'ok' && msg.key && msg.bpm) {
      pending.resolve({ key: msg.key, bpm: msg.bpm })
    } else {
      pending.reject(new Error(msg.error ?? 'Unknown bridge error'))
    }
  }

  async waitReady(timeoutMs = READY_TIMEOUT_MS): Promise<void> {
    return Promise.race([
      this.readyPromise,
      new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error('Bridge startup timed out')), timeoutMs)
      )
    ])
  }

  async analyze(filePath: string, timeoutMs = ANALYZE_TIMEOUT_MS): Promise<AnalysisResult> {
    if (!this.process || !this.ready) {
      throw new Error('Python bridge is not ready')
    }

    const id = uuid()
    const request = JSON.stringify({ id, command: 'analyze', path: filePath }) + '\n'

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id)
        reject(new Error(`Analysis timed out after ${timeoutMs}ms`))
      }, timeoutMs)

      this.pending.set(id, {
        resolve: (result) => {
          clearTimeout(timer)
          resolve(result)
        },
        reject: (err) => {
          clearTimeout(timer)
          reject(err)
        }
      })

      this.process!.stdin!.write(request, (err) => {
        if (err) {
          clearTimeout(timer)
          this.pending.delete(id)
          reject(err)
        }
      })
    })
  }

  isReady(): boolean {
    return this.ready
  }

  kill(): void {
    this.killed = true
    this.restartCount = 0
    if (this.process) {
      this.process.kill()
      this.process = null
      this.ready = false
    }
  }
}
