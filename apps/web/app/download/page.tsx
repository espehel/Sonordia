import Link from 'next/link';
import type { Metadata } from 'next';
import { cacheLife } from 'next/cache';
import { Apple, Download, MonitorDown, Terminal } from 'lucide-react';

import { SiteFooter } from '@/components/site-footer';
import { SiteNav } from '@/components/site-nav';
import { Button } from '@sonordia/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@sonordia/ui/card';

export const metadata: Metadata = {
  title: 'Download Sonordia',
  description: 'Download Sonordia for macOS, Windows, and Linux.',
};

const REPO = 'espehel/Sonordia';

type ReleaseAsset = {
  name: string;
  browser_download_url: string;
};

type Release = {
  tag_name: string;
  html_url: string;
  assets: ReleaseAsset[];
};

async function getLatestRelease(): Promise<Release | null> {
  'use cache';
  cacheLife('hours');
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) return null;
    return (await res.json()) as Release;
  } catch {
    return null;
  }
}

type Build = {
  os: 'macOS' | 'Windows' | 'Linux';
  icon: typeof Apple;
  description: string;
  primary: { label: string; match: (name: string) => boolean };
  secondary?: { label: string; match: (name: string) => boolean };
};

const builds: Build[] = [
  {
    os: 'macOS',
    icon: Apple,
    description: 'Universal build for Apple silicon and Intel. Requires macOS 11 or later.',
    primary: { label: 'Download .dmg', match: (n) => /\.dmg$/i.test(n) },
  },
  {
    os: 'Windows',
    icon: MonitorDown,
    description: 'x64 installer. Requires Windows 10 or later.',
    primary: { label: 'Download .exe', match: (n) => /\.exe$/i.test(n) },
  },
  {
    os: 'Linux',
    icon: Terminal,
    description: 'AppImage runs anywhere; .deb for Debian/Ubuntu.',
    primary: { label: 'Download AppImage', match: (n) => /\.AppImage$/i.test(n) },
    secondary: { label: 'Download .deb', match: (n) => /\.deb$/i.test(n) },
  },
];

export default async function DownloadPage() {
  const release = await getLatestRelease();
  const releasesUrl = `https://github.com/${REPO}/releases`;

  return (
    <main className="flex min-h-screen flex-col items-center">
      <div className="flex w-full flex-1 flex-col items-center">
        <SiteNav />
        <div className="w-full max-w-5xl flex-1 px-5 py-12 lg:py-16">
          <header className="mb-12 flex flex-col items-center gap-4 text-center">
            <div className="bg-background text-foreground/70 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
              <Download className="size-3" />
              {release ? (
                <Link href={release.html_url} className="hover:underline">
                  Latest release · {release.tag_name}
                </Link>
              ) : (
                <span>No release available yet</span>
              )}
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
              const primaryAsset = release?.assets.find((a) => build.primary.match(a.name));
              const secondaryAsset = build.secondary
                ? release?.assets.find((a) => build.secondary!.match(a.name))
                : null;
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
                    {primaryAsset ? (
                      <Button asChild>
                        <a href={primaryAsset.browser_download_url}>
                          <Download className="size-4" />
                          {build.primary.label}
                        </a>
                      </Button>
                    ) : (
                      <Button disabled>{build.primary.label} (unavailable)</Button>
                    )}
                    {build.secondary ? (
                      secondaryAsset ? (
                        <Button asChild variant="outline">
                          <a href={secondaryAsset.browser_download_url}>{build.secondary.label}</a>
                        </Button>
                      ) : (
                        <Button variant="outline" disabled>
                          {build.secondary.label} (unavailable)
                        </Button>
                      )
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
                  <Link href={releasesUrl} className="underline-offset-4 hover:underline">
                    All releases on GitHub
                  </Link>
                </li>
                <li>
                  <Link
                    href={`https://github.com/${REPO}`}
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
