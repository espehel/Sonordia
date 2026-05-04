import { useState, useEffect, useRef } from 'react';
import { toast } from '@sonordia/ui/sonner';
import type { BridgeStatus } from '../types';

export function useAnalysis() {
  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus>({ status: 'starting' });
  const prevStatus = useRef<BridgeStatus['status']>('starting');

  useEffect(() => {
    const unsub = window.api.onBridgeStatus((status: BridgeStatus) => {
      const prev = prevStatus.current;
      const next = status.status;

      // Toast only on transitions, not every status push.
      if (prev !== next) {
        if (next === 'exited' || next === 'error') {
          toast.error(`Analysis bridge ${next}`, {
            description: status.error ?? 'Audio analysis is unavailable until it restarts.',
          });
        } else if (next === 'ready' && (prev === 'exited' || prev === 'error')) {
          toast.success('Analysis bridge recovered');
        }
      }

      prevStatus.current = next;
      setBridgeStatus(status);
    });
    return unsub;
  }, []);

  const analyzeOne = async (id: string) => {
    await window.api.songs.analyze(id);
  };

  const analyzeAll = async () => {
    await window.api.songs.analyzeAll();
  };

  return { bridgeStatus, analyzeOne, analyzeAll };
}
