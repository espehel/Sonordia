import { useCallback } from 'react';
import { toast } from '@sonordia/ui/sonner';

export function useTags() {
  const attach = useCallback(
    async (songId: string, name: string, playlistId: string | null) => {
      const trimmed = name.trim();
      if (trimmed === '') return null;
      try {
        return await window.api.tags.attach(songId, trimmed, playlistId);
      } catch (e) {
        toast.error("Couldn't add tag", {
          description: e instanceof Error ? e.message : String(e),
        });
        return null;
      }
    },
    [],
  );

  const detach = useCallback(async (songId: string, tagId: string) => {
    try {
      await window.api.tags.detach(songId, tagId);
    } catch (e) {
      toast.error("Couldn't remove tag", {
        description: e instanceof Error ? e.message : String(e),
      });
    }
  }, []);

  return { attach, detach };
}
