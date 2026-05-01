import { useCallback, useEffect, useRef, useState } from "react";
import type { Song, VizPayload } from "../types";

interface PlayerState {
  song: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  viz: VizPayload;
  vizMissing: string[];
  vizLoading: boolean;
}

const initialState: PlayerState = {
  song: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  viz: {},
  vizMissing: [],
  vizLoading: false,
};

export function usePlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [state, setState] = useState<PlayerState>(initialState);
  const songIdRef = useRef<string | null>(null);

  if (!audioRef.current && typeof window !== "undefined") {
    audioRef.current = new Audio();
    audioRef.current.preload = "metadata";
  }

  // Drive currentTime via rAF while playing for a smooth playhead.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMeta = () => {
      setState((s) => ({ ...s, duration: audio.duration || 0 }));
    };
    const onPlay = () => setState((s) => ({ ...s, isPlaying: true }));
    const onPause = () => setState((s) => ({ ...s, isPlaying: false }));
    const onEnded = () => setState((s) => ({ ...s, isPlaying: false, currentTime: 0 }));

    audio.addEventListener("loadedmetadata", onLoadedMeta);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMeta);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!state.isPlaying) {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }
    const tick = () => {
      setState((s) => (s.isPlaying ? { ...s, currentTime: audio.currentTime } : s));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [state.isPlaying]);

  const loadViz = useCallback(async (songId: string) => {
    setState((s) => ({ ...s, vizLoading: true }));
    const result = await window.api.viz.get(songId);
    if (songIdRef.current !== songId) return;
    setState((s) => ({
      ...s,
      viz: result.data,
      vizMissing: result.missing,
      vizLoading: false,
    }));

    if (result.missing.length > 0) {
      try {
        await window.api.viz.compute(songId);
      } catch (err) {
        console.error("[player] viz.compute failed:", err);
        return;
      }
      if (songIdRef.current !== songId) return;
      const refreshed = await window.api.viz.get(songId);
      if (songIdRef.current !== songId) return;
      setState((s) => ({
        ...s,
        viz: refreshed.data,
        vizMissing: refreshed.missing,
      }));
    }
  }, []);

  const play = useCallback(
    async (song: Song) => {
      const audio = audioRef.current;
      if (!audio) return;
      if (songIdRef.current !== song.id) {
        songIdRef.current = song.id;
        audio.src = window.api.viz.audioUrl(song.id);
        setState({
          ...initialState,
          song,
          vizLoading: true,
        });
        void loadViz(song.id);
      }
      try {
        await audio.play();
      } catch (err) {
        console.error("[player] play failed:", err);
      }
    },
    [loadViz]
  );

  const toggle = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !state.song) return;
    if (audio.paused) {
      try {
        await audio.play();
      } catch (err) {
        console.error("[player] play failed:", err);
      }
    } else {
      audio.pause();
    }
  }, [state.song]);

  const seek = useCallback((sec: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const clamped = Math.max(0, Math.min(sec, audio.duration || sec));
    audio.currentTime = clamped;
    setState((s) => ({ ...s, currentTime: clamped }));
  }, []);

  // Refresh viz when backfill finishes a song we're currently looking at.
  useEffect(() => {
    const unsub = window.api.onVizProgress((progress) => {
      const id = songIdRef.current;
      if (!id) return;
      if (progress.state === "done" || progress.currentSongId === id) {
        window.api.viz.get(id).then((result) => {
          if (songIdRef.current !== id) return;
          setState((s) => ({ ...s, viz: result.data, vizMissing: result.missing }));
        });
      }
    });
    return unsub;
  }, []);

  return { ...state, play, toggle, seek };
}
