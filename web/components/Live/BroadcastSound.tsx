'use client';

import { type RefObject, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';

import { Volume2, VolumeX } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { BroadcastAudio } from '@/lib/live/audio';
import {
  DEFAULT_SOUND_SETTINGS,
  type SoundSettings,
  parseSoundSettings,
  readSoundSettings,
  saveSoundSettings,
  subscribeSoundSettings,
} from '@/lib/live/audio-settings';

export default function BroadcastSound({ audioRef }: { audioRef: RefObject<BroadcastAudio | null> }) {
  const stored = useSyncExternalStore(subscribeSoundSettings, readSoundSettings, () => null);
  const settings = useMemo(() => parseSoundSettings(stored), [stored]);
  const preference = useRef<SoundSettings>(DEFAULT_SOUND_SETTINGS);
  const [error, setError] = useState('');
  const activate = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    const player = new BroadcastAudio();
    audioRef.current = player;
    let disposed = false;
    const enable = async () => {
      if (disposed || preference.current.muted || preference.current.volume === 0) return;
      if (player.isEnabled()) return;
      try {
        const enabled = await player.enable();
        if (disposed) return;
        if (preference.current.muted || preference.current.volume === 0) {
          player.mute();
          return;
        }
        if (enabled) setError('');
      } catch {
        if (!disposed) {
          setError('Unable to enable audio. Adjust the volume to retry.');
        }
      }
    };
    activate.current = enable;
    const unlock = () => {
      void enable();
    };
    // Restored audio can be blocked until a trusted gesture; retain the saved preference.
    document.addEventListener('pointerdown', unlock);
    document.addEventListener('keydown', unlock);
    return () => {
      disposed = true;
      document.removeEventListener('pointerdown', unlock);
      document.removeEventListener('keydown', unlock);
      if (audioRef.current === player) audioRef.current = null;
      player.destroy();
    };
  }, [audioRef]);

  useEffect(() => {
    preference.current = settings;
    audioRef.current?.setVolume(settings.volume);
    if (settings.muted || settings.volume === 0) audioRef.current?.mute();
    else void activate.current();
  }, [audioRef, settings]);

  function update(next: SoundSettings) {
    preference.current = next;
    setError('');
    saveSoundSettings(next);
    audioRef.current?.setVolume(next.volume);
    if (next.muted || next.volume === 0) audioRef.current?.mute();
    else void activate.current();
  }

  const muted = settings.muted || settings.volume === 0;
  const percent = muted ? 0 : Math.round(settings.volume * 100);
  const label = muted ? 'Unmute broadcast sounds' : 'Mute broadcast sounds';
  return (
    <div className="group/sound relative">
      <div
        role="group"
        aria-label="Broadcast sound"
        className="flex size-9 items-center justify-center rounded-md border border-white/15 bg-black/65 text-white"
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 hover:bg-white/15 hover:text-white focus-visible:ring-white/70"
          aria-label={label}
          title={label}
          aria-pressed={!muted}
          onPointerDown={(event) => {
            if (event.pointerType === 'touch') event.currentTarget.focus();
          }}
          onClick={() => {
            update({ volume: settings.volume || 1, muted: !muted });
          }}
        >
          {muted ? (
            <VolumeX className="size-4" aria-hidden="true" />
          ) : (
            <Volume2 className="size-4" aria-hidden="true" />
          )}
        </Button>
        <div className="invisible absolute left-full top-0 flex h-9 w-40 items-center gap-2 rounded-md border border-white/15 bg-black/80 px-3 opacity-0 transition-opacity group-hover/sound:visible group-hover/sound:opacity-100 group-focus-within/sound:visible group-focus-within/sound:opacity-100 motion-reduce:transition-none">
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={percent}
            aria-label="Broadcast sound volume"
            aria-valuetext={muted ? 'Muted' : `${percent}%`}
            title={`Broadcast sound volume: ${percent}%`}
            className="h-4 min-w-0 flex-1 cursor-pointer accent-emerald-500"
            onChange={(event) => {
              const volume = Number(event.target.value) / 100;
              update({ volume: volume || settings.volume, muted: volume === 0 });
            }}
          />
          <span className="w-7 shrink-0 text-right font-mono text-[10px] tabular-nums text-white/75" aria-hidden="true">
            {percent}%
          </span>
        </div>
      </div>
      {error && (
        <p
          role="alert"
          className="absolute bottom-full left-0 z-10 mb-2 w-56 rounded-md border bg-card p-2 text-xs text-destructive shadow-md"
        >
          {error}
        </p>
      )}
    </div>
  );
}
