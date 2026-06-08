import { Button } from '@sonordia/ui/button';
import type { VizLayer, VizSettings } from '../hooks/useVizSettings';

interface Props {
  settings: VizSettings;
  onToggle: (layer: VizLayer) => void;
}

const LAYERS: { key: VizLayer; label: string }[] = [
  { key: 'waveform', label: 'Wave' },
  { key: 'ruler', label: 'Ruler' },
  { key: 'beats', label: 'Beats' },
  { key: 'rms', label: 'RMS' },
  { key: 'chroma', label: 'Chroma' },
  { key: 'keytrack', label: 'Key' },
  { key: 'bookmarks', label: 'Marks' },
];

export function VizToolbar({ settings, onToggle }: Props) {
  return (
    <div className="flex gap-1">
      {LAYERS.map(({ key, label }) => {
        const active = settings[key];
        return (
          <Button
            key={key}
            variant={active ? 'default' : 'outline'}
            size="xs"
            onClick={() => onToggle(key)}
            className="rounded-full font-semibold"
          >
            {label}
          </Button>
        );
      })}
    </div>
  );
}
