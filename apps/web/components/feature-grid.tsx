import { Library, ListMusic, AudioWaveform, Zap } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@sonordia/ui/card';

const features = [
  {
    icon: Library,
    title: 'Local library',
    description:
      'Point Sonordia at your music folder and it indexes everything — no cloud, no upload, your files stay yours.',
  },
  {
    icon: ListMusic,
    title: 'Playlists that stick',
    description:
      'Drag, drop, reorder. Playlists save to disk so they stay put across sessions and machines.',
  },
  {
    icon: AudioWaveform,
    title: 'AudioWaveform player',
    description:
      "Scrub through tracks visually with an inline waveform. Hear what you're looking at before you click.",
  },
  {
    icon: Zap,
    title: 'Native performance',
    description:
      'Built on Electron with a tight audio pipeline. Snappy startup, low CPU at idle, no Chromium tax on playback.',
  },
];

export function FeatureGrid() {
  return (
    <section className="grid gap-4 py-8 sm:grid-cols-2">
      {features.map(({ icon: Icon, title, description }) => (
        <Card key={title} className="border-foreground/10">
          <CardHeader>
            <div className="bg-foreground/5 mb-3 flex size-9 items-center justify-center rounded-md">
              <Icon className="text-foreground/80 size-4" />
            </div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="text-sm leading-relaxed">{description}</CardDescription>
          </CardHeader>
          <CardContent />
        </Card>
      ))}
    </section>
  );
}
