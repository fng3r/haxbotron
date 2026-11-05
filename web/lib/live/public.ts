import type { ManagedRoomInfo } from '../control-plane/types';

export interface PublicLiveRoom {
  ruid: string;
  roomName: string;
  onlinePlayers: number;
  viewers: number;
}

export function selectPublicLiveRooms(
  rooms: ManagedRoomInfo[],
  supportedHostIds: ReadonlySet<string>,
): PublicLiveRoom[] {
  return rooms
    .filter((room) => room.online && !room.blockingReason && supportedHostIds.has(room.hostId))
    .map((room) => ({
      ruid: room.ruid,
      roomName: room.roomName || room.ruid,
      onlinePlayers: room.onlinePlayers ?? 0,
      viewers: 0,
    }))
    .sort((a, b) => a.roomName.localeCompare(b.roomName));
}

/** Only these read-only endpoints bypass the administrative API authentication. */
export function isPublicLivePath(pathname: string): boolean {
  return pathname === '/api/public/rooms' || pathname === '/api/public/live';
}
