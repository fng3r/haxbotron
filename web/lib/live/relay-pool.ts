import type { LiveFrame, LiveKick, LiveMatchTimeline, LiveStadium } from './types';
import type { Socket as Viewer } from 'socket.io';
import type { Socket as Source } from 'socket.io-client';

export const LIVE_RELAY_GRACE_MS = 30_000;
type Frame = LiveFrame & { ruid: string };
type RoomRelay = {
  viewers: Map<string, Viewer>;
  source?: Source;
  closing?: ReturnType<typeof setTimeout>;
  retry?: ReturnType<typeof setTimeout>;
  frame?: Frame;
  stadium?: LiveStadium;
  timeline?: LiveMatchTimeline;
  ready: boolean;
  error?: string;
};
type RelayOptions = {
  createSource: (ruid: string) => Promise<Source>;
  onCount: (ruid: string, viewers: number) => void;
  onReady: (viewer: Viewer, ruid: string) => void;
  graceMs?: number;
};

/** One upstream per room, independent of browser connection lifetimes. */
export class LiveRelayPool {
  private rooms = new Map<string, RoomRelay>();
  private memberships = new Map<string, string>();

  private options: RelayOptions;
  constructor(options: RelayOptions) {
    this.options = options;
  }

  join(ruid: string, viewer: Viewer): void {
    if (!viewer.connected) return;
    if (this.memberships.get(viewer.id) !== ruid) this.leave(viewer.id);
    let room = this.rooms.get(ruid);
    const fresh = !room;
    if (!room) {
      room = { viewers: new Map(), ready: false };
      this.rooms.set(ruid, room);
    }
    clearTimeout(room.closing);
    room.closing = undefined;
    room.viewers.set(viewer.id, viewer);
    this.memberships.set(viewer.id, ruid);
    this.count(ruid, room);
    if (room.frame) viewer.emit('live', { ...room.frame, stadium: room.stadium, timeline: room.timeline });
    if (room.error) viewer.emit('live:error', room.error);
    if (room.ready) this.options.onReady(viewer, ruid);
    if (fresh) void this.open(ruid, room);
  }

  leave(viewerId: string): void {
    const ruid = this.memberships.get(viewerId);
    if (ruid === undefined) return;
    this.memberships.delete(viewerId);
    const room = this.rooms.get(ruid)!;
    room.viewers.delete(viewerId);
    this.count(ruid, room);
    if (!room.viewers.size && !room.closing) {
      room.closing = setTimeout(() => this.close(ruid, room), this.options.graceMs ?? LIVE_RELAY_GRACE_MS);
      room.closing.unref?.();
    }
  }

  readyRoom(viewerId: string): string | undefined {
    const ruid = this.memberships.get(viewerId);
    return ruid !== undefined && this.rooms.get(ruid)?.ready ? ruid : undefined;
  }

  broadcast(ruid: string, event: string, payload: unknown): void {
    for (const viewer of this.rooms.get(ruid)?.viewers.values() ?? []) viewer.emit(event, payload);
  }

  private count(ruid: string, room: RoomRelay): void {
    const viewers = room.viewers.size;
    this.options.onCount(ruid, viewers);
    this.broadcast(ruid, 'live:viewers', { ruid, viewers });
  }

  private unavailable(ruid: string, room: RoomRelay, error: string): void {
    room.ready = false;
    room.error = error;
    room.frame = undefined;
    room.stadium = undefined;
    room.timeline = undefined;
    this.broadcast(ruid, 'live:error', error);
  }

  private async open(ruid: string, room: RoomRelay): Promise<void> {
    try {
      const source = await this.options.createSource(ruid);
      if (this.rooms.get(ruid) !== room) {
        source.disconnect();
        return;
      }
      room.source = source;
      let subscription = 0;
      const subscribe = () => {
        const revision = ++subscription;
        source.emit('live:subscribe', ruid, (result: { ok: boolean; error?: string }) => {
          if (this.rooms.get(ruid) !== room || !source.connected || revision !== subscription) return;
          if (!result.ok) {
            this.unavailable(ruid, room, result.error || 'Room is offline');
            return;
          }
          room.ready = true;
          room.error = undefined;
          this.count(ruid, room);
          for (const viewer of room.viewers.values()) this.options.onReady(viewer, ruid);
        });
      };
      source.on('connect', subscribe);
      source.on('roomct', (event: { ruid: string }) => {
        if (event.ruid === ruid) subscribe();
      });
      source.on('live', (frame: Frame) => {
        if (frame.ruid !== ruid || this.rooms.get(ruid) !== room) return;
        const newGoal = frame.goal && frame.goal.id !== room.frame?.goal?.id;
        if (room.frame?.matchId !== frame.matchId) room.timeline = undefined;
        if (frame.timeline?.matchId === frame.matchId) room.timeline = frame.timeline;
        if (frame.stadium) room.stadium = frame.stadium;
        room.frame = frame;
        for (const viewer of room.viewers.values()) {
          if (frame.stadium || newGoal || frame.timeline) viewer.emit('live', frame);
          else viewer.volatile.emit('live', frame);
        }
      });
      source.on('live:kick', (kick: LiveKick & { ruid: string }) => {
        if (kick.ruid !== ruid || !room.ready || this.rooms.get(ruid) !== room) return;
        this.broadcast(ruid, 'live:kick', kick);
      });
      source.on('live:offline', (event?: { reason?: string }) => {
        ++subscription;
        this.unavailable(ruid, room, event?.reason || 'Room is offline');
      });
      source.on('disconnect', () => {
        ++subscription;
        this.unavailable(ruid, room, 'Host disconnected. Reconnecting…');
        if (!source.active) this.retry(ruid, room);
      });
      source.on('connect_error', () => {
        this.unavailable(ruid, room, 'Host unavailable. Reconnecting…');
        // Authentication rejection disables Socket.IO's automatic reconnection.
        // Recreate the source so its host mapping and JWT are refreshed as well.
        if (!source.active) this.retry(ruid, room);
      });
      source.connect();
    } catch {
      if (this.rooms.get(ruid) !== room) return;
      this.unavailable(ruid, room, 'Room or host is unavailable');
      this.retry(ruid, room);
    }
  }

  private retry(ruid: string, room: RoomRelay): void {
    room.source?.removeAllListeners();
    room.source?.disconnect();
    room.source = undefined;
    clearTimeout(room.retry);
    room.retry = setTimeout(() => {
      void this.open(ruid, room);
    }, 3000);
    room.retry.unref?.();
  }

  private close(ruid: string, room: RoomRelay): void {
    if (this.rooms.get(ruid) !== room || room.viewers.size) return;
    this.rooms.delete(ruid);
    clearTimeout(room.closing);
    clearTimeout(room.retry);
    room.source?.removeAllListeners();
    room.source?.disconnect();
  }

  dispose(): void {
    for (const [ruid, room] of this.rooms) {
      for (const id of room.viewers.keys()) this.memberships.delete(id);
      room.viewers.clear();
      this.count(ruid, room);
      this.close(ruid, room);
    }
  }
}
