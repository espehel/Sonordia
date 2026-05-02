import Link from "next/link";
import { Download, Github } from "lucide-react";

import { Button } from "@sonordia/ui/button";

export function Hero() {
  return (
    <section className="flex flex-col items-center text-center gap-8 py-16 lg:py-24">
      <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-foreground/70">
        <span className="size-1.5 rounded-full bg-primary" />
        Native desktop music player
      </div>

      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight !leading-[1.1] max-w-3xl">
        Your music library,{" "}
        <span className="bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
          on your desktop
        </span>
        .
      </h1>

      <p className="text-lg lg:text-xl text-foreground/70 max-w-2xl !leading-relaxed">
        Sonordia is an open-source music player for macOS, Windows, and Linux. Browse your local
        library, build playlists, and listen with a clean waveform-driven player — no streaming,
        no accounts required.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="lg">
          <Link href="/download">
            <Download className="size-4" />
            Download
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <a
            href="https://github.com/espenhellerud/Sonordia"
            target="_blank"
            rel="noreferrer"
          >
            <Github className="size-4" />
            View on GitHub
          </a>
        </Button>
      </div>

      <p className="text-xs text-foreground/50">Free and open source · MIT licensed</p>
    </section>
  );
}
