import { useCallback, useEffect, useRef, useState } from 'react';
import type { FadeBookmark, Song, VizPayload } from '../types';
import { levelAt } from './useBookmarks';

interface PlayerState {
  song: Song | null;
  playlistId: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  viz: VizPayload;
  vizMissing: string[];
  vizLoading: boolean;
}

const initialState: PlayerState = {
  song: null,
  playlistId: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  viz: {},
  vizMissing: [],
  vizLoading: false,
};

export function usePlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const fadesRef = useRef<FadeBookmark[]>([]);
  const isPlayingRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const [state, setState] = useState<PlayerState>(initialState);
  const songIdRef = useRef<string | null>(null);

  if (!audioRef.current && typeof window !== 'undefined') {
    const audio = new Audio();
    audio.preload = 'metadata';
    // CORS opt-in: required for createMediaElementSource to produce audible
    // output from cross-origin streams (audio:// is cross-origin to the
    // renderer's http:// / file:// page).
    audio.crossOrigin = 'anonymous';
    audioRef.current = audio;

    const ctx = new AudioContext();
    const source = ctx.createMediaElementSource(audio);
    const gain = ctx.createGain();
    source.connect(gain).connect(ctx.destination);
    audioCtxRef.current = ctx;
    gainRef.current = gain;
  }

  const applyGainForTime = useCallback((t: number) => {
    const gain = gainRef.current;
    if (!gain) return;
    gain.gain.value = levelAt(t, fadesRef.current) / 100;
  }, []);

  const setFades = useCallback(
    (next: FadeBookmark[]) => {
      fadesRef.current = next;
      // If paused, the rAF tick isn't running — apply now so the user hears the edit.
      if (!isPlayingRef.current && audioRef.current) {
        applyGainForTime(audioRef.current.currentTime);
      }
    },
    [applyGainForTime],
  );

  // Drive currentTime via rAF while playing for a smooth playhead.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMeta = () => {
      setState((s) => ({ ...s, duration: audio.duration || 0 }));
    };
    const onPlay = () => {
      isPlayingRef.current = true;
      setState((s) => ({ ...s, isPlaying: true }));
    };
    const onPause = () => {
      isPlayingRef.current = false;
      setState((s) => ({ ...s, isPlaying: false }));
    };
    const onEnded = () => {
      isPlayingRef.current = false;
      setState((s) => ({ ...s, isPlaying: false, currentTime: 0 }));
    };

    audio.addEventListener('loadedmetadata', onLoadedMeta);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMeta);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
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
      applyGainForTime(audio.currentTime);
      setState((s) => (s.isPlaying ? { ...s, currentTime: audio.currentTime } : s));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [state.isPlaying, applyGainForTime]);

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
        console.error('[player] viz.compute failed:', err);
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
    async (song: Song, playlistId: string | null = null) => {
      const audio = audioRef.current;
      const ctx = audioCtxRef.current;
      if (!audio) return;
      if (songIdRef.current !== song.id) {
        songIdRef.current = song.id;
        audio.src = window.api.viz.audioUrl(song.id);
        setState({
          ...initialState,
          song,
          playlistId,
          vizLoading: true,
        });
        void loadViz(song.id);
      } else {
        setState((s) => ({ ...s, playlistId }));
      }
      if (ctx && ctx.state === 'suspended') {
        try {
          await ctx.resume();
        } catch (err) {
          console.error('[player] AudioContext resume failed:', err);
        }
      }
      applyGainForTime(audio.currentTime);
      try {
        await audio.play();
      } catch (err) {
        console.error('[player] play failed:', err);
      }
    },
    [loadViz, applyGainForTime],
  );

  const toggle = useCallback(async () => {
    const audio = audioRef.current;
    const ctx = audioCtxRef.current;
    if (!audio || !state.song) return;
    if (audio.paused) {
      if (ctx && ctx.state === 'suspended') {
        try {
          await ctx.resume();
        } catch (err) {
          console.error('[player] AudioContext resume failed:', err);
        }
      }
      applyGainForTime(audio.currentTime);
      try {
        await audio.play();
      } catch (err) {
        console.error('[player] play failed:', err);
      }
    } else {
      audio.pause();
    }
  }, [state.song, applyGainForTime]);

  const seek = useCallback(
    (sec: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      const clamped = Math.max(0, Math.min(sec, audio.duration || sec));
      audio.currentTime = clamped;
      applyGainForTime(clamped);
      setState((s) => ({ ...s, currentTime: clamped }));
    },
    [applyGainForTime],
  );

  // Refresh viz when backfill finishes a song we're currently looking at.
  useEffect(() => {
    const unsub = window.api.onVizProgress((progress) => {
      const id = songIdRef.current;
      if (!id) return;
      if (progress.state === 'done' || progress.currentSongId === id) {
        window.api.viz.get(id).then((result) => {
          if (songIdRef.current !== id) return;
          setState((s) => ({ ...s, viz: result.data, vizMissing: result.missing }));
        });
      }
    });
    return unsub;
  }, []);

  return { ...state, play, toggle, seek, setFades };
}
