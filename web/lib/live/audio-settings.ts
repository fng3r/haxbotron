export type SoundSettings = { volume: number; muted: boolean };
export const SOUND_STORAGE_KEY = 'live-sound-settings';
export const DEFAULT_SOUND_SETTINGS: SoundSettings = { volume: 1, muted: true };
const CHANGE_EVENT = 'live-sound-settings-change';
let fallback: string | null = null;
let storageUnavailable = false;

export function readSoundSettings(): string | null {
  if (storageUnavailable) return fallback;
  try {
    return localStorage.getItem(SOUND_STORAGE_KEY);
  } catch {
    storageUnavailable = true;
    return fallback;
  }
}

export function saveSoundSettings(settings: SoundSettings): void {
  fallback = JSON.stringify(settings);
  try {
    localStorage.setItem(SOUND_STORAGE_KEY, fallback);
    storageUnavailable = false;
  } catch {
    storageUnavailable = true;
    /* Keep the preference in memory. */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeSoundSettings(listener: () => void): () => void {
  const changed = (event: StorageEvent) => {
    if (event.key !== SOUND_STORAGE_KEY && event.key !== null) return;
    storageUnavailable = false;
    listener();
  };
  window.addEventListener('storage', changed);
  window.addEventListener(CHANGE_EVENT, listener);
  return () => {
    window.removeEventListener('storage', changed);
    window.removeEventListener(CHANGE_EVENT, listener);
  };
}

export function parseSoundSettings(value: string | null): SoundSettings {
  try {
    const saved: unknown = JSON.parse(value ?? 'null');
    if (
      saved &&
      typeof saved === 'object' &&
      'volume' in saved &&
      'muted' in saved &&
      typeof saved.volume === 'number' &&
      Number.isFinite(saved.volume) &&
      saved.volume >= 0 &&
      saved.volume <= 1 &&
      typeof saved.muted === 'boolean'
    )
      return { volume: saved.volume, muted: saved.muted };
  } catch {
    /* Ignore invalid or outdated preferences. */
  }
  return { ...DEFAULT_SOUND_SETTINGS };
}
