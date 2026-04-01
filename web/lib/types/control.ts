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
