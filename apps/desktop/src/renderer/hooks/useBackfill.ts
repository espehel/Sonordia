import { useEffect, useState } from 'react';
import type { BackfillProgress } from '../types';

const initial: BackfillProgress = { state: 'idle', total: 0, completed: 0 };

export function useBackfill(): BackfillProgress {
  const [progress, setProgress] = useState<BackfillProgress>(initial);

  useEffect(() => {
    window.api.viz
      .getProgress()
      .then(setProgress)
      .catch(() => {});
    const unsub = window.api.onVizProgress((p) => setProgress(p));
    return unsub;
  }, []);

  return progress;
}
