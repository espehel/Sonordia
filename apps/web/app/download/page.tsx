import Link from 'next/link';
import type { Metadata } from 'next';
import { Apple, Download, MonitorDown, Terminal } from 'lucide-react';

import { SiteFooter } from '@/components/site-footer';
import { SiteNav } from '@/components/site-nav';
import { Button } from '@sonordia/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@sonordia/ui/card';

export const metadata: Metadata = {
  title: 'Download Sonordia',
  description: 'Download Sonordia for macOS, Windows, and Linux.',
};

// TODO: replace with real release URLs once the desktop app ships.
// Convention: GitHub Releases provides a `/latest/download/<asset>` redirect that
// always points to the most recent published artifact.
const RELEASES_BASE = 'https://github.com/espenhellerud/Sonordia/releases/latest/download';
const LATEST_VERSION = '0.1.0';

type Build = {
  os: 'macOS' | 'Windows' | 'Linux';
  icon: typeof Apple;
  description: string;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
};

const builds: Build[] = [
  {
    os: 'macOS',
    icon: Apple,
    description: 'Universal build for Apple silicon and Intel. Requires macOS 11 or later.',
    primary: {
      label: 'Download .dmg',
      href: `${RELEASES_BASE}/Sonordia-${LATEST_VERSION}-universal.dmg`,
    },
  },
  {
    os: 'Windows',
    icon: MonitorDown,
    description: 'x64 installer. Requires Windows 10 or later.',
    primary: {
      label: 'Download .exe',
      href: `${RELEASES_BASE}/Sonordia-${LATEST_VERSION}-x64.exe`,
    },
  },
  {
    os: 'Linux',
    icon: Terminal,
    description: 'AppImage runs anywhere; .deb for Debian/Ubuntu.',
    primary: {
      label: 'Download AppImage',
      href: `${RELEASES_BASE}/Sonordia-${LATEST_VERSION}.AppImage`,
    },
    secondary: {
      label: 'Download .deb',
      href: `${RELEASES_BASE}/sonordia_${LATEST_VERSION}_amd64.deb`,
    },
  },
];

export default function DownloadPage() {
  return (
    <main className="flex min-h-screen flex-col items-center">
      <div className="flex w-full flex-1 flex-col items-center">
        <SiteNav />
        <div className="w-full max-w-5xl flex-1 px-5 py-12 lg:py-16">
          <header className="mb-12 flex flex-col items-center gap-4 text-center">
            <div className="bg-background text-foreground/70 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
              <Download className="size-3" />
              Latest release · v{LATEST_VERSION}
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              Download Sonordia
            </h1>
            <p className="text-foreground/70 max-w-xl">
              Pick your platform. Sonordia is free and open-source — no account, no telemetry.
            </p>
          </header>

          <section aria-label="Downloads by platform" className="grid gap-4 md:grid-cols-3">
            {builds.map((build) => {
              const Icon = build.icon;
              return (
                <Card key={build.os} className="flex flex-col">
                  <CardHeader>
                    <div className="bg-foreground/5 mb-3 flex size-10 items-center justify-center rounded-md">
                      <Icon className="text-foreground/80 size-5" />
                    </div>
                    <CardTitle>{build.os}</CardTitle>
                    <CardDescription className="leading-relaxed">
                      {build.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto flex flex-col gap-2">
                    <Button asChild>
                      <a href={build.primary.href}>
                        <Download className="size-4" />
                        {build.primary.label}
                      </a>
                    </Button>
                    {build.secondary ? (
                      <Button asChild variant="outline">
                        <a href={build.secondary.href}>{build.secondary.label}</a>
                      </Button>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </section>

          <section className="mt-16 grid gap-8 md:grid-cols-2">
            <div>
              <h2 className="mb-2 text-lg font-semibold tracking-tight">System requirements</h2>
              <ul className="text-foreground/70 list-disc space-y-1.5 pl-5 text-sm">
                <li>macOS 11 (Big Sur) or later — Apple silicon or Intel</li>
                <li>Windows 10 (64-bit) or later</li>
                <li>Linux: AppImage works on any distro; .deb tested on Ubuntu 22.04+</li>
                <li>~250 MB disk space</li>
              </ul>
            </div>
            <div>
              <h2 className="mb-2 text-lg font-semibold tracking-tight">Other ways to get it</h2>
              <ul className="text-foreground/70 space-y-1.5 text-sm">
                <li>
                  <Link
                    href="https://github.com/espenhellerud/Sonordia/releases"
                    className="underline-offset-4 hover:underline"
                  >
                    All releases on GitHub
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://github.com/espenhellerud/Sonordia"
                    className="underline-offset-4 hover:underline"
                  >
                    Build from source
                  </Link>
                </li>
              </ul>
            </div>
          </section>
        </div>
        <SiteFooter />
      </div>
    </main>
  );
}
