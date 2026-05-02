import { useState, useRef } from "react";
import { Button } from "@sonordia/ui/button";
import { Card, CardContent } from "@sonordia/ui/card";
import { Toaster, toast } from "@sonordia/ui/sonner";
import { ThemeToggle } from "@sonordia/ui/theme-toggle";
import { cn } from "@sonordia/ui/utils";

interface KeyResult {
  file: string;
  camelot: string;
  key: string;
  id: number;
}

interface BpmResult {
  file: string;
  bpm: number;
  [key: string]: unknown;
}

type Status = "idle" | "loading" | "done";

export default function App() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [keyResult, setKeyResult] = useState<KeyResult | null>(null);
  const [bpmResult, setBpmResult] = useState<BpmResult | null>(null);

  async function analyze() {
    if (!file) return;
    setStatus("loading");
    setKeyResult(null);
    setBpmResult(null);

    const form1 = new FormData();
    form1.append("file", file);
    const form2 = new FormData();
    form2.append("file", file);

    try {
      const [keyRes, bpmRes] = await Promise.all([
        fetch("/predict", { method: "POST", body: form1 }),
        fetch("/analyze/bpm", { method: "POST", body: form2 }),
      ]);

      const [key, bpm] = await Promise.all([
        keyRes.ok
          ? keyRes.json()
          : keyRes.json().then((e: { detail: string }) => Promise.reject(e.detail)),
        bpmRes.ok
          ? bpmRes.json()
          : bpmRes.json().then((e: { detail: string }) => Promise.reject(e.detail)),
      ]);

      setKeyResult(key);
      setBpmResult(bpm);
      setStatus("done");
    } catch (e) {
      toast.error("Analysis failed", { description: String(e) });
      setStatus("idle");
    }
  }

  return (
    <div className="mx-auto mt-20 max-w-[520px] px-4 font-sans">
      <div className="mb-2 flex items-start justify-between">
        <h1 className="text-2xl font-semibold">Sonordia</h1>
        <ThemeToggle />
      </div>
      <p className="text-muted-foreground mb-8">Predict the key and BPM of an audio file.</p>

      <input
        ref={inputRef}
        type="file"
        accept=".mp3,.wav,.flac,.aiff,.ogg"
        className="hidden"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />

      <div
        onClick={() => inputRef.current?.click()}
        className={cn(
          "mb-4 cursor-pointer rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors",
          file ? "border-emerald-300 bg-emerald-50" : "border-border bg-muted/30 hover:bg-muted/50"
        )}
      >
        {file ? file.name : "Click to select an audio file"}
      </div>

      <Button
        onClick={analyze}
        disabled={!file || status === "loading"}
        size="lg"
        className="w-full"
      >
        {status === "loading" ? "Analyzing..." : "Analyze"}
      </Button>

      {status === "done" && keyResult && bpmResult && (
        <Card className="mt-8">
          <CardContent className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-muted-foreground text-xs tracking-wider uppercase">Key</div>
              <div className="mt-1 text-3xl font-bold">{keyResult.key}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs tracking-wider uppercase">Camelot</div>
              <div className="mt-1 text-3xl font-bold">{keyResult.camelot}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs tracking-wider uppercase">BPM</div>
              <div className="mt-1 text-3xl font-bold">{bpmResult.bpm}</div>
            </div>
          </CardContent>
        </Card>
      )}

      <Toaster richColors position="bottom-right" />
    </div>
  );
}
