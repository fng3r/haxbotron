import 'server-only';

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, Method } from 'axios';
import socketClient from 'socket.io-client';

import { generateToken } from '@/lib/auth/jwt';

import { getControlPlaneEventBus } from './event-bus';
import { loadControlPlaneState, saveControlPlaneState } from './storage';
import {
  AggregatedSocketEvent,
  AllRoomListItem,
  ClusterSummary,
  ControlPlaneState,
  HostNode,
  HostStatusInfo,
  ManagedRoomInfo,
  RoomInfo,
  RoomInfoItem,
  RoomLocationInfo,
  RoomMapping,
  RuntimeRoomInfo,
  RuntimeSnapshot,
} from './types';

type HostSocketHandle = {
  socket: ReturnType<typeof socketClient>;
};

const HEALTH_TTL_MS = 15_000;
const ROOM_TTL_MS = 5_000;

export class ControlPlaneError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: 'VALIDATION' | 'NOT_FOUND' | 'CONFLICT' | 'UNAVAILABLE' | 'UNSUPPORTED',
  ) {
    super(message);
    this.name = 'ControlPlaneError';
  }
}

export function isControlPlaneError(error: unknown): error is ControlPlaneError {
  return error instanceof ControlPlaneError;
}

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, '');
}

function sortState(state: ControlPlaneState): ControlPlaneState {
  return {
    hosts: [...state.hosts].sort((a, b) => a.name.localeCompare(b.name)),
    mappings: [...state.mappings].sort((a, b) => a.ruid.localeCompare(b.ruid)),
  };
}

function makeDefaultSnapshot(state: ControlPlaneState): RuntimeSnapshot {
  return {
    generatedAt: 0,
    hosts: new Map(
      state.hosts.map((host) => [
        host.id,
        {
          healthy: false,
          lastSeenAt: null,
          onlineRooms: new Set<string>(),
          integrityIssues: 0,
        },
      ]),
    ),
    rooms: new Map(),
    unmappedOnlineRooms: [],
  };
}

function isServerError(error: unknown): error is AxiosError {
  return axios.isAxiosError(error);
}

function validationError(message: string): ControlPlaneError {
  return new ControlPlaneError(message, 400, 'VALIDATION');
}

function notFoundError(message: string): ControlPlaneError {
  return new ControlPlaneError(message, 404, 'NOT_FOUND');
}

function conflictError(message: string): ControlPlaneError {
  return new ControlPlaneError(message, 409, 'CONFLICT');
}

function unavailableError(message: string): ControlPlaneError {
  return new ControlPlaneError(message, 503, 'UNAVAILABLE');
}

function unsupportedError(message: string): ControlPlaneError {
  return new ControlPlaneError(message, 404, 'UNSUPPORTED');
}

class ControlPlaneService {
  private state: ControlPlaneState | null = null;
  private statePromise: Promise<ControlPlaneState> | null = null;
  private runtimeSnapshot: RuntimeSnapshot = { generatedAt: 0, hosts: new Map(), rooms: new Map(), unmappedOnlineRooms: [] };
  private refreshPromise: Promise<RuntimeSnapshot> | null = null;
  private socketHandles = new Map<string, HostSocketHandle>();
  private socketsBootstrapped = false;

  private async loadState(): Promise<ControlPlaneState> {
    if (this.state) return this.state;
    if (!this.statePromise) {
      this.statePromise = loadControlPlaneState().then((loaded) => {
        this.state = sortState({
          hosts: loaded.hosts.map((host) => ({ ...host, baseUrl: normalizeBaseUrl(host.baseUrl) })),
          mappings: loaded.mappings,
        });
        this.runtimeSnapshot = makeDefaultSnapshot(this.state);
        return this.state;
      });
    }

    return this.statePromise;
  }

  private async persistState(nextState: ControlPlaneState): Promise<ControlPlaneState> {
    const sorted = sortState(nextState);
    await saveControlPlaneState(sorted);
    this.state = sorted;
    this.statePromise = Promise.resolve(sorted);
    this.runtimeSnapshot = makeDefaultSnapshot(sorted);
    await this.refreshSnapshot(true);
    await this.ensureSockets();
    return sorted;
  }

  private validateState(state: ControlPlaneState): void {
    const hostIds = new Set<string>();
    const names = new Set<string>();
    const baseUrls = new Set<string>();

    for (const host of state.hosts) {
      if (!host.id.trim()) throw validationError('Host id is required.');
      if (!host.name.trim()) throw validationError('Host name is required.');
      if (!host.baseUrl.trim()) throw validationError('Host base URL is required.');
      const normalized = normalizeBaseUrl(host.baseUrl);
      try {
        new URL(normalized);
      } catch {
        throw validationError(`Host '${host.name}' has an invalid base URL.`);
      }
      if (hostIds.has(host.id)) throw conflictError(`Host id '${host.id}' already exists.`);
      if (names.has(host.name)) throw conflictError(`Host name '${host.name}' already exists.`);
      if (baseUrls.has(normalized)) throw conflictError(`Host base URL '${normalized}' already exists.`);
      hostIds.add(host.id);
      names.add(host.name);
      baseUrls.add(normalized);
    }

    const ruids = new Set<string>();
    for (const mapping of state.mappings) {
      if (!mapping.ruid.trim()) throw validationError('RUID is required.');
      if (ruids.has(mapping.ruid)) throw conflictError(`RUID '${mapping.ruid}' already has a mapping.`);
      if (!hostIds.has(mapping.hostId)) {
        throw validationError(`RUID '${mapping.ruid}' points to unknown host '${mapping.hostId}'.`);
      }
      ruids.add(mapping.ruid);
    }
  }

  private async getSharedApiKey(): Promise<string> {
    const apiKey = process.env.CORE_API_KEY;
    if (!apiKey) {
      throw unavailableError('CORE_API_KEY environment variable is required for control-plane requests.');
    }
    return apiKey;
  }

  private async getClient(host: HostNode): Promise<AxiosInstance> {
    const apiKey = await this.getSharedApiKey();
    return axios.create({
      baseURL: normalizeBaseUrl(host.baseUrl),
      headers: {
        'x-api-key': apiKey,
      },
      timeout: 8_000,
    });
  }

  private async getAnyHost(): Promise<HostNode> {
    const state = await this.loadState();
    const enabled = state.hosts.filter((host) => host.enabled);
    if (enabled.length === 0) throw unavailableError('No enabled hosts are configured.');

    const snapshot = await this.refreshSnapshot();
    const healthy = enabled.find((host) => snapshot.hosts.get(host.id)?.healthy);
    return healthy || enabled[0];
  }

  private async refreshSnapshot(force = false): Promise<RuntimeSnapshot> {
    const state = await this.loadState();
    const ttl = Math.min(HEALTH_TTL_MS, ROOM_TTL_MS);
    if (!force && this.runtimeSnapshot.generatedAt && Date.now() - this.runtimeSnapshot.generatedAt < ttl) {
      return this.runtimeSnapshot;
    }
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = (async () => {
      const mappingsByRuid = new Map(state.mappings.map((mapping) => [mapping.ruid, mapping]));
      const snapshot = makeDefaultSnapshot(state);
      const detailByRuid = new Map<string, RuntimeRoomInfo['detail']>();

      await Promise.all(
        state.hosts.map(async (host) => {
          const hostState = snapshot.hosts.get(host.id)!;
          if (!host.enabled) return;

          try {
            const client = await this.getClient(host);
            const [systemResponse, roomsResponse] = await Promise.all([
              client.get('/api/v1/system'),
              client.get('/api/v1/room'),
            ]);
            const onlineRooms = Array.isArray(roomsResponse.data) ? (roomsResponse.data as string[]) : [];
            hostState.healthy = true;
            hostState.lastSeenAt = nowIso();
            hostState.system = systemResponse.data;
            hostState.onlineRooms = new Set(onlineRooms);

            await Promise.all(
              onlineRooms.map(async (ruid) => {
                const mapping = mappingsByRuid.get(ruid);
                if (!mapping) {
                  snapshot.unmappedOnlineRooms.push({ ruid, hostId: host.id });
                  hostState.integrityIssues += 1;
                  return;
                }

                try {
                  const detailResponse = await client.get(`/api/v1/room/${ruid}/info`);
                  detailByRuid.set(ruid, {
                    roomName: detailResponse.data.roomName,
                    link: detailResponse.data.link,
                    onlinePlayers: detailResponse.data.onlinePlayers,
                  });
                } catch {
                  detailByRuid.set(ruid, undefined);
                }
              }),
            );
          } catch {
            hostState.healthy = false;
            hostState.lastSeenAt = null;
            hostState.onlineRooms = new Set();
          }
        }),
      );

      for (const mapping of state.mappings) {
        const ownerHost = snapshot.hosts.get(mapping.hostId);
        const actualHost = state.hosts.find((host) => snapshot.hosts.get(host.id)?.onlineRooms.has(mapping.ruid));
        let room: RuntimeRoomInfo;

        if (!ownerHost || !ownerHost.healthy) {
          room = {
            ownerHostId: mapping.hostId,
            online: false,
            integrity: 'host_unreachable',
          };
        } else if (!actualHost) {
          room = {
            ownerHostId: mapping.hostId,
            online: false,
            integrity: 'offline',
          };
        } else if (actualHost.id !== mapping.hostId) {
          room = {
            ownerHostId: mapping.hostId,
            actualHostId: actualHost.id,
            online: true,
            integrity: 'wrong_host',
            detail: detailByRuid.get(mapping.ruid),
          };
          snapshot.hosts.get(actualHost.id)!.integrityIssues += 1;
        } else {
          room = {
            ownerHostId: mapping.hostId,
            actualHostId: actualHost.id,
            online: true,
            integrity: 'ok',
            detail: detailByRuid.get(mapping.ruid),
          };
        }

        snapshot.rooms.set(mapping.ruid, room);
      }

      snapshot.generatedAt = Date.now();
      this.runtimeSnapshot = snapshot;
      return snapshot;
    })().finally(() => {
      this.refreshPromise = null;
    });

    return this.refreshPromise;
  }

  private async ensureSockets(): Promise<void> {
    if (this.socketsBootstrapped) {
      await this.syncSockets();
      return;
    }

    this.socketsBootstrapped = true;
    await this.syncSockets();
  }

  private async syncSockets(): Promise<void> {
    const state = await this.loadState();
    const validHostIds = new Set(state.hosts.filter((host) => host.enabled).map((host) => host.id));

    for (const [hostId, handle] of this.socketHandles.entries()) {
      if (!validHostIds.has(hostId)) {
        handle.socket.disconnect();
        this.socketHandles.delete(hostId);
      }
    }

    await Promise.all(
      state.hosts
        .filter((host) => host.enabled)
        .map(async (host) => {
          if (this.socketHandles.has(host.id)) return;

          const token = await generateToken('control-plane');
          const socket = socketClient(
            normalizeBaseUrl(host.baseUrl),
            {
              path: '/ws',
              transports: ['websocket'],
              autoConnect: true,
              extraHeaders: {
                cookie: `access_token=${token}`,
              },
            } as any,
          );

          const emit = (event: AggregatedSocketEvent) => {
            getControlPlaneEventBus().emit(event);
          };

          socket.on('roomct', (payload: { ruid: string }) => {
            void this.refreshSnapshot(true);
            emit({ event: 'roomct', hostId: host.id, ruid: payload.ruid });
          });
          socket.on('joinleft', (payload: { ruid: string; playerID: number }) => {
            emit({ event: 'joinleft', hostId: host.id, ruid: payload.ruid, playerID: payload.playerID });
          });
          socket.on('statuschange', (payload: { ruid: string; playerID: number }) => {
            emit({ event: 'statuschange', hostId: host.id, ruid: payload.ruid, playerID: payload.playerID });
          });
          socket.on(
            'log',
            (payload: {
              id: string;
              ruid: string;
              origin: string;
              type: 'info' | 'warn' | 'error';
              message: string;
              timestamp: number;
            }) => {
              emit({
                event: 'log',
                hostId: host.id,
                ruid: payload.ruid,
                id: payload.id,
                origin: payload.origin,
                type: payload.type,
                message: payload.message,
                timestamp: payload.timestamp,
              });
            },
          );

          this.socketHandles.set(host.id, { socket });
        }),
    );
  }

  public async init(): Promise<void> {
    await this.loadState();
    await this.refreshSnapshot();
    await this.ensureSockets();
  }

  public async getState(): Promise<ControlPlaneState> {
    return await this.loadState();
  }

  public async getSummary(): Promise<ClusterSummary> {
    const state = await this.loadState();
    const snapshot = await this.refreshSnapshot();
    const healthyHostCount = Array.from(snapshot.hosts.values()).filter((host) => host.healthy).length;
    const onlineRoomCount = Array.from(snapshot.rooms.values()).filter((room) => room.online).length;
    const integrityIssueCount =
      Array.from(snapshot.rooms.values()).filter((room) => room.integrity === 'wrong_host').length +
      snapshot.unmappedOnlineRooms.length;

    return {
      hostCount: state.hosts.length,
      healthyHostCount,
      configuredRoomCount: state.mappings.length,
      onlineRoomCount,
      integrityIssueCount,
    };
  }

  public async listHosts(): Promise<HostStatusInfo[]> {
    const state = await this.loadState();
    const snapshot = await this.refreshSnapshot();

    return state.hosts.map((host) => {
      const runtime = snapshot.hosts.get(host.id);
      const mappedRoomCount = state.mappings.filter((mapping) => mapping.hostId === host.id).length;
      const onlineMappedRoomCount = state.mappings.filter((mapping) => {
        const room = snapshot.rooms.get(mapping.ruid);
        return mapping.hostId === host.id && room?.online;
      }).length;
      const blockingReason = mappedRoomCount > 0 ? 'Move or delete all mapped rooms before deleting this host.' : undefined;

      return {
        id: host.id,
        name: host.name,
        baseUrl: host.baseUrl,
        enabled: host.enabled,
        healthy: runtime?.healthy ?? false,
        lastSeenAt: runtime?.lastSeenAt ?? null,
        usedMemoryMB: runtime?.system?.usedMemoryMB,
        upTimeSecs: runtime?.system?.upTimeSecs,
        serverVersion: runtime?.system?.serverVersion,
        mappedRoomCount,
        onlineMappedRoomCount,
        integrityIssues: runtime?.integrityIssues ?? 0,
        blockingReason,
      };
    });
  }

  public async listMappings(): Promise<Array<RoomMapping & ManagedRoomInfo>> {
    const state = await this.loadState();
    const rooms = await this.listManagedRooms();
    const roomMap = new Map(rooms.map((room) => [room.ruid, room]));
    return state.mappings.map((mapping) => ({
      ...mapping,
      ...(roomMap.get(mapping.ruid) || {
        ruid: mapping.ruid,
        hostId: mapping.hostId,
        online: false,
        integrity: 'offline',
      }),
    }));
  }

  public async listManagedRooms(): Promise<ManagedRoomInfo[]> {
    const state = await this.loadState();
    const snapshot = await this.refreshSnapshot();
    const hostMap = new Map(state.hosts.map((host) => [host.id, host]));

    return state.mappings.map((mapping) => {
      const runtime = snapshot.rooms.get(mapping.ruid);
      const host = hostMap.get(mapping.hostId);
      const base: ManagedRoomInfo = {
        ruid: mapping.ruid,
        hostId: mapping.hostId,
        hostName: host?.name,
        online: runtime?.online ?? false,
        roomName: runtime?.detail?.roomName,
        roomLink: runtime?.detail?.link,
        onlinePlayers: runtime?.detail?.onlinePlayers,
        integrity: runtime?.integrity ?? 'offline',
      };

      if (runtime?.integrity === 'wrong_host') {
        return {
          ...base,
          blockingReason: `Room is online on '${runtime.actualHostId}' instead of '${mapping.hostId}'.`,
        };
      }
      if (runtime?.integrity === 'host_unreachable') {
        return {
          ...base,
          blockingReason: 'Assigned host is disabled or unreachable.',
        };
      }

      return base;
    });
  }

  public async getRoomLocation(ruid: string): Promise<RoomLocationInfo> {
    const state = await this.loadState();
    const mapping = state.mappings.find((item) => item.ruid === ruid);
    if (!mapping) {
      throw notFoundError(`Room '${ruid}' has no configured mapping.`);
    }
    const host = state.hosts.find((item) => item.id === mapping.hostId);
    const room = (await this.listManagedRooms()).find((item) => item.ruid === ruid);

    return {
      ruid,
      hostId: mapping.hostId,
      hostName: host?.name,
      baseUrl: host?.baseUrl,
      integrity: room?.integrity ?? 'offline',
      online: room?.online ?? false,
    };
  }

  private async getMapping(ruid: string): Promise<RoomMapping> {
    const state = await this.loadState();
    const mapping = state.mappings.find((item) => item.ruid === ruid);
    if (!mapping) throw notFoundError(`Room '${ruid}' is not assigned to any host.`);
    return mapping;
  }

  private async getMappedHost(ruid: string): Promise<HostNode> {
    const state = await this.loadState();
    const mapping = await this.getMapping(ruid);
    const host = state.hosts.find((item) => item.id === mapping.hostId);
    if (!host) throw unavailableError(`Room '${ruid}' points to missing host '${mapping.hostId}'.`);
    if (!host.enabled) throw unavailableError(`Assigned host '${host.name}' is disabled.`);
    return host;
  }

  private async assertHostCanChangeAddress(hostId: string): Promise<void> {
    const snapshot = await this.refreshSnapshot(true);
    const state = await this.loadState();
    const onlineMappedRooms = state.mappings.filter((mapping) => {
      if (mapping.hostId !== hostId) return false;
      return snapshot.rooms.get(mapping.ruid)?.online;
    });
    if (onlineMappedRooms.length > 0) {
      throw conflictError('Cannot change the host URL while one of its mapped rooms is online.');
    }
  }

  public async createHost(input: Omit<HostNode, 'createdAt' | 'updatedAt'>): Promise<HostNode> {
    const state = await this.loadState();
    const timestamp = nowIso();
    const host: HostNode = {
      ...input,
      baseUrl: normalizeBaseUrl(input.baseUrl),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const nextState = {
      ...state,
      hosts: [...state.hosts, host],
    };
    this.validateState(nextState);
    await this.persistState(nextState);
    return host;
  }

  public async updateHost(hostId: string, input: Pick<HostNode, 'name' | 'baseUrl' | 'enabled'>): Promise<HostNode> {
    const state = await this.loadState();
    const target = state.hosts.find((host) => host.id === hostId);
    if (!target) throw notFoundError(`Host '${hostId}' was not found.`);
    if (normalizeBaseUrl(target.baseUrl) !== normalizeBaseUrl(input.baseUrl)) {
      await this.assertHostCanChangeAddress(hostId);
    }
    if (!input.enabled) {
      const rooms = await this.listManagedRooms();
      const onlineMapped = rooms.filter((room) => room.hostId === hostId && room.online);
      if (onlineMapped.length > 0) {
        throw conflictError('Cannot disable a host while one of its mapped rooms is online.');
      }
    }

    const updated: HostNode = {
      ...target,
      name: input.name,
      baseUrl: normalizeBaseUrl(input.baseUrl),
      enabled: input.enabled,
      updatedAt: nowIso(),
    };
    const nextState = {
      ...state,
      hosts: state.hosts.map((host) => (host.id === hostId ? updated : host)),
    };
    this.validateState(nextState);
    await this.persistState(nextState);
    return updated;
  }

  public async deleteHost(hostId: string): Promise<void> {
    const state = await this.loadState();
    const target = state.hosts.find((host) => host.id === hostId);
    if (!target) throw notFoundError(`Host '${hostId}' was not found.`);
    const mappingCount = state.mappings.filter((mapping) => mapping.hostId === hostId).length;
    if (mappingCount > 0) {
      throw conflictError('Cannot delete a host while room mappings still reference it.');
    }
    const nextState = {
      ...state,
      hosts: state.hosts.filter((host) => host.id !== hostId),
    };
    await this.persistState(nextState);
  }

  public async createMapping(input: { ruid: string; hostId: string }): Promise<RoomMapping> {
    const state = await this.loadState();
    const timestamp = nowIso();
    const mapping: RoomMapping = {
      ...input,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const nextState = {
      ...state,
      mappings: [...state.mappings, mapping],
    };
    this.validateState(nextState);
    await this.persistState(nextState);
    return mapping;
  }

  public async updateMapping(ruid: string, hostId: string): Promise<RoomMapping> {
    const state = await this.loadState();
    const target = state.mappings.find((mapping) => mapping.ruid === ruid);
    if (!target) throw notFoundError(`RUID '${ruid}' was not found.`);
    const room = (await this.listManagedRooms()).find((item) => item.ruid === ruid);
    if (room?.online) {
      throw conflictError('Cannot move a mapping while the room is currently online.');
    }
    const updated: RoomMapping = {
      ...target,
      hostId,
      updatedAt: nowIso(),
    };
    const nextState = {
      ...state,
      mappings: state.mappings.map((mapping) => (mapping.ruid === ruid ? updated : mapping)),
    };
    this.validateState(nextState);
    await this.persistState(nextState);
    return updated;
  }

  public async deleteMapping(ruid: string): Promise<void> {
    const state = await this.loadState();
    const target = state.mappings.find((mapping) => mapping.ruid === ruid);
    if (!target) throw notFoundError(`RUID '${ruid}' was not found.`);
    const room = (await this.listManagedRooms()).find((item) => item.ruid === ruid);
    if (room?.online) {
      throw conflictError('Cannot delete the mapping while the room is currently online.');
    }
    const nextState = {
      ...state,
      mappings: state.mappings.filter((mapping) => mapping.ruid !== ruid),
    };
    await this.persistState(nextState);
  }

  public async listRoomInfoItems(): Promise<RoomInfoItem[]> {
    const rooms = await this.listManagedRooms();
    return rooms
      .filter((room) => room.online)
      .map((room) => ({
        ruid: room.ruid,
        roomName: room.roomName || room.ruid,
        roomLink: room.roomLink || '',
        onlinePlayers: room.onlinePlayers || 0,
        hostId: room.hostId,
        hostName: room.hostName,
      }));
  }

  public async listAllRooms(): Promise<AllRoomListItem[]> {
    const rooms = await this.listManagedRooms();
    return rooms.map((room) => ({
      ruid: room.ruid,
      online: room.online,
      hostId: room.hostId,
      hostName: room.hostName,
    }));
  }

  public async getRoomInfo(ruid: string): Promise<RoomInfo> {
    const host = await this.getMappedHost(ruid);
    const roomLocation = await this.getRoomLocation(ruid);
    const client = await this.getClient(host);

    try {
      const result = await client.get(`/api/v1/room/${ruid}/info`);
      return {
        isOnline: true,
        ...result.data,
        hostId: roomLocation.hostId,
        hostName: roomLocation.hostName,
      };
    } catch (error) {
      if (isServerError(error) && error.response?.status === 404) {
        return {
          ruid,
          isOnline: false,
          hostId: roomLocation.hostId,
          hostName: roomLocation.hostName,
        } as RoomInfo;
      }
      throw error;
    }
  }

  public async requestGlobal<T = unknown>(config: AxiosRequestConfig): Promise<T> {
    const host = await this.getAnyHost();
    const client = await this.getClient(host);
    const response = await client.request<T>(config);
    if (response.status === 204) return undefined as T;
    return response.data;
  }

  public async requestRoom<T = unknown>(ruid: string, config: AxiosRequestConfig): Promise<T> {
    const host = await this.getMappedHost(ruid);
    const snapshot = await this.refreshSnapshot();
    const hostState = snapshot.hosts.get(host.id);
    if (!host.enabled || hostState?.healthy === false) {
      throw unavailableError(`Assigned host '${host.name}' is unavailable.`);
    }

    const client = await this.getClient(host);
    const response = await client.request<T>(config);
    if (response.status === 204) return undefined as T;
    return response.data;
  }

  public async proxyRequest(method: Method, pathSegments: string[], search: URLSearchParams, body?: unknown) {
    if (pathSegments[0] === 'room') {
      if (pathSegments.length === 1) {
        if (method === 'GET') return await this.listManagedRooms().then((rooms) => rooms.filter((room) => room.online).map((room) => room.ruid));
        if (method === 'POST') {
          const payload = body as { ruid?: string };
          if (!payload?.ruid) throw validationError('RUID is required.');
          return await this.requestRoom(payload.ruid, {
            url: '/api/v1/room',
            method,
            data: body,
          });
        }
      }

      const ruid = pathSegments[1];
      if (!ruid) throw validationError('RUID is required.');

      if (method === 'GET' && pathSegments.length === 3 && pathSegments[2] === 'info') {
        return await this.getRoomInfo(ruid);
      }

      return await this.requestRoom(ruid, {
        url: `/api/v1/${pathSegments.join('/')}${search.toString() ? `?${search.toString()}` : ''}`,
        method,
        data: body,
      });
    }

    if (pathSegments[0] === 'playerlist' || pathSegments[0] === 'banlist' || pathSegments[0] === 'roleslist' || pathSegments[0] === 'ruidlist') {
      return await this.requestGlobal({
        url: `/api/v1/${pathSegments.join('/')}${search.toString() ? `?${search.toString()}` : ''}`,
        method,
        data: body,
      });
    }

    throw unsupportedError(`Unsupported API path '/api/v1/${pathSegments.join('/')}'.`);
  }
}

const globalForControlPlane = globalThis as typeof globalThis & {
  __controlPlaneService?: ControlPlaneService;
  __controlPlaneServiceVersion?: string;
};

const CONTROL_PLANE_SERVICE_VERSION = 'hosts-v3';

export function getControlPlaneService(): ControlPlaneService {
  const existing = globalForControlPlane.__controlPlaneService as ControlPlaneService | undefined;
  const version = globalForControlPlane.__controlPlaneServiceVersion;

  const isCurrentShape =
    existing &&
    typeof existing.listHosts === 'function' &&
    typeof existing.createHost === 'function' &&
    typeof existing.updateHost === 'function' &&
    typeof existing.deleteHost === 'function' &&
    version === CONTROL_PLANE_SERVICE_VERSION;

  if (!isCurrentShape) {
    globalForControlPlane.__controlPlaneService = new ControlPlaneService();
    globalForControlPlane.__controlPlaneServiceVersion = CONTROL_PLANE_SERVICE_VERSION;
  }

  return globalForControlPlane.__controlPlaneService as ControlPlaneService;
}
