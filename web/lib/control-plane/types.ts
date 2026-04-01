import { RoomHostConfig, RoomRules, RoomSettings } from '@/../core/lib/room/RoomHostConfig';

export type HostNode = {
  id: string;
  name: string;
  baseUrl: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type RoomMapping = {
  ruid: string;
  hostId: string;
  createdAt: string;
  updatedAt: string;
};

export type ControlPlaneState = {
  hosts: HostNode[];
  mappings: RoomMapping[];
};

export type HostStatusInfo = {
  id: string;
  name: string;
  baseUrl: string;
  enabled: boolean;
  healthy: boolean;
  lastSeenAt: string | null;
  usedMemoryMB?: number;
  upTimeSecs?: number;
  serverVersion?: string;
  mappedRoomCount: number;
  onlineMappedRoomCount: number;
  integrityIssues: number;
  blockingReason?: string;
};

export type ManagedRoomIntegrity = 'ok' | 'wrong_host' | 'offline' | 'host_unreachable';

export type ManagedRoomInfo = {
  ruid: string;
  hostId: string;
  hostName?: string;
  online: boolean;
  roomName?: string;
  roomLink?: string;
  onlinePlayers?: number;
  integrity: ManagedRoomIntegrity;
  blockingReason?: string;
};

export type RoomLocationInfo = {
  ruid: string;
  hostId: string;
  hostName?: string;
  baseUrl?: string;
  integrity: ManagedRoomIntegrity;
  online: boolean;
};

export type ClusterSummary = {
  hostCount: number;
  healthyHostCount: number;
  configuredRoomCount: number;
  onlineRoomCount: number;
  integrityIssueCount: number;
};

export type HostSystemInfo = {
  usedMemoryMB: number;
  upTimeSecs: number;
  serverVersion: string;
};

export type RuntimeRoomInfo = {
  ownerHostId: string;
  actualHostId?: string;
  online: boolean;
  detail?: {
    roomName: string;
    link: string;
    onlinePlayers: number;
  };
  integrity: ManagedRoomIntegrity;
};

export type RuntimeSnapshot = {
  generatedAt: number;
  hosts: Map<string, {
    healthy: boolean;
    lastSeenAt: string | null;
    system?: HostSystemInfo;
    onlineRooms: Set<string>;
    integrityIssues: number;
  }>;
  rooms: Map<string, RuntimeRoomInfo>;
  unmappedOnlineRooms: Array<{ ruid: string; hostId: string }>;
};

export type RoomInfo = {
  ruid: string;
  isOnline: boolean;
  roomName: string;
  onlinePlayers: number;
  adminPassword: string;
  link: string;
  _roomConfig: RoomHostConfig;
  botSettings: RoomSettings;
  rules: RoomRules;
  hostId?: string;
  hostName?: string;
};

export type RoomInfoItem = {
  ruid: string;
  roomName: string;
  roomLink: string;
  onlinePlayers: number;
  hostId?: string;
  hostName?: string;
};

export type AllRoomListItem = {
  ruid: string;
  online: boolean;
  hostId?: string;
  hostName?: string;
};

export type AggregatedSocketEvent =
  | { event: 'roomct'; hostId: string; ruid: string }
  | { event: 'joinleft'; hostId: string; ruid: string; playerID: number }
  | { event: 'statuschange'; hostId: string; ruid: string; playerID: number }
  | {
      event: 'log';
      hostId: string;
      ruid: string;
      id: string;
      origin: string;
      type: 'info' | 'warn' | 'error';
      message: string;
      timestamp: number;
    };
