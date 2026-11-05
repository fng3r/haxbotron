import type { LiveKick } from './types';

type Sound = 'kick' | 'goal';

/** Audio is enabled by a user gesture; sounds are never replayed from history. */
export class BroadcastAudio {
  private context?: AudioContext;
  private gain?: GainNode;
  private volume = 1;
  private buffers = new Map<Sound, AudioBuffer>();
  private loading = new Map<Sound, Promise<AudioBuffer>>();
  private enabled = false;
  private disposed = false;
  private seen = new Set<string>();
  private pending = new Set<ReturnType<typeof setTimeout>>();
  private sources = new Set<AudioBufferSourceNode>();

  async enable(): Promise<boolean> {
    if (this.disposed) return false;
    const context = (this.context ??= new AudioContext());
    if (!this.gain) {
      this.gain = context.createGain();
      this.gain.gain.value = this.volume;
      this.gain.connect(context.destination);
    }
    // Resume immediately inside the click gesture, before fetching/decoding.
    await context.resume();
    await Promise.all((['kick', 'goal'] as const).map((sound) => this.load(sound, context)));
    if (this.disposed) return false;
    this.enabled = context.state === 'running';
    return this.enabled;
  }

  private async load(sound: Sound, context: AudioContext): Promise<void> {
    if (this.buffers.has(sound)) return;
    let loading = this.loading.get(sound);
    if (!loading) {
      loading = fetch(`/audio/haxball-${sound}.wav`)
        .then((response) => {
          if (!response.ok) throw new Error(`${sound} sound unavailable`);
          return response.arrayBuffer();
        })
        .then((data) => context.decodeAudioData(data));
      this.loading.set(sound, loading);
    }
    try {
      this.buffers.set(sound, await loading);
    } finally {
      this.loading.delete(sound);
    }
  }

  mute(): void {
    this.enabled = false;
    this.clear();
  }

  setVolume(volume: number): void {
    if (!Number.isFinite(volume)) return;
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.gain) this.gain.gain.value = this.volume;
  }

  isEnabled(): boolean {
    return this.enabled && this.context?.state === 'running';
  }

  kick(event: LiveKick, delayMs: number): void {
    this.play('kick', event.id, delayMs);
  }

  goal(id: string, delayMs: number): void {
    this.play('goal', id, delayMs);
  }

  private play(sound: Sound, id: string, delayMs: number): void {
    const key = `${sound}:${id}`;
    if (this.seen.has(key)) return;
    this.seen.add(key);
    if (this.seen.size > 128) this.seen.delete(this.seen.values().next().value!);
    if (!this.enabled || this.context?.state !== 'running') return;
    const received = performance.now();
    const timer = setTimeout(() => {
      this.pending.delete(timer);
      // Background throttling must not cause a burst of old sounds on return.
      if (
        !this.enabled ||
        !this.buffers.has(sound) ||
        this.context?.state !== 'running' ||
        performance.now() - received > delayMs + 250
      )
        return;
      const source = this.context.createBufferSource();
      source.buffer = this.buffers.get(sound)!;
      source.connect(this.gain!);
      this.sources.add(source);
      source.onended = () => {
        this.sources.delete(source);
        source.disconnect();
      };
      source.start();
    }, delayMs);
    this.pending.add(timer);
  }

  clear(): void {
    for (const timer of this.pending) clearTimeout(timer);
    this.pending.clear();
    for (const source of this.sources) {
      source.stop();
      source.disconnect();
    }
    this.sources.clear();
  }

  destroy(): void {
    this.disposed = true;
    this.mute();
    void this.context?.close().catch(() => {});
  }
}
