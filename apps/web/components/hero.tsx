import Link from 'next/link';
import { Download, Github } from 'lucide-react';

import { Button } from '@sonordia/ui/button';
import { LogoMarkAnimated } from '@sonordia/ui/logo-mark-animated';

export function Hero() {
  return (
    <section className="flex flex-col items-center gap-8 py-16 text-center lg:py-24">
      <LogoMarkAnimated className="size-20 lg:size-24" />

      <div className="bg-background text-foreground/70 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
        <span className="bg-primary size-1.5 rounded-full" />
        Native desktop music player
      </div>

      <h1 className="max-w-3xl text-4xl !leading-[1.1] font-semibold tracking-tight sm:text-5xl lg:text-6xl">
        Your music library,{' '}
        <span className="from-foreground to-foreground/60 bg-gradient-to-r bg-clip-text text-transparent">
          on your desktop
        </span>
        .
      </h1>

      <p className="text-foreground/70 max-w-2xl text-lg !leading-relaxed lg:text-xl">
        Sonordia is an open-source music player for macOS, Windows, and Linux. Browse your local
        library, build playlists, and listen with a clean waveform-driven player — no streaming, no
        accounts required.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="lg">
          <Link href="/download">
            <Download className="size-4" />
            Download
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <a href="https://github.com/espenhellerud/Sonordia" target="_blank" rel="noreferrer">
            <Github className="size-4" />
            View on GitHub
          </a>
        </Button>
      </div>

      <p className="text-foreground/50 text-xs">Free and open source · MIT licensed</p>
    </section>
  );
}
