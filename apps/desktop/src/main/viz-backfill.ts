import { BrowserWindow } from "electron";
import { listSongs } from "./db";
import { PythonBridge } from "./python-bridge";
import { ensureVizDir, listMissingFeatures, VizFeature } from "./viz-cache";

export interface BackfillProgress {
  state: "idle" | "running" | "done";
  total: number;
  completed: number;
  currentSongId?: string;
  error?: string;
}

export class VizBackfill {
  private running = false;
  private cancelled = false;
  private progress: BackfillProgress = { state: "idle", total: 0, completed: 0 };

  constructor(private bridge: PythonBridge) {}

  getProgress(): BackfillProgress {
    return this.progress;
  }

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    this.cancelled = false;

    const candidates = listSongs()
      .filter((s) => s.analysis_status === "done")
      .map((s) => ({ id: s.id, file_path: s.file_path, missing: listMissingFeatures(s.id) }))
      .filter((c) => c.missing.length > 0);

    if (candidates.length === 0) {
      this.progress = { state: "idle", total: 0, completed: 0 };
      this.emit();
      this.running = false;
      return;
    }

    this.progress = { state: "running", total: candidates.length, completed: 0 };
    this.emit();

    for (const c of candidates) {
      if (this.cancelled) break;
      this.progress = { ...this.progress, currentSongId: c.id };
      this.emit();

      try {
        const outDir = ensureVizDir(c.id);
        await this.bridge.computeViz(c.file_path, outDir, c.missing as VizFeature[]);
      } catch (err) {
        console.error(`[viz-backfill] failed for ${c.id}:`, err);
      }

      this.progress = { ...this.progress, completed: this.progress.completed + 1 };
      this.emit();
    }

    this.progress = {
      state: "done",
      total: this.progress.total,
      completed: this.progress.completed,
    };
    this.emit();
    this.running = false;
  }

  cancel(): void {
    this.cancelled = true;
  }

  private emit(): void {
    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.send("viz:progress", this.progress);
    }
  }
}
