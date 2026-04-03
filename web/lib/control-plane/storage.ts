import nodeStorage from 'node-persist';

import { ControlPlaneState, HostNode } from './types';
import 'server-only';

const CONTROL_PLANE_KEY = 'control-plane-state';

let initialized = false;

async function getStorage() {
  if (!initialized) {
    await nodeStorage.init();
    initialized = true;
  }

  return nodeStorage;
}

export async function loadControlPlaneState(): Promise<ControlPlaneState> {
  const storage = await getStorage();
  const raw = await storage.getItem(CONTROL_PLANE_KEY);
  if (!raw) {
    const emptyState: ControlPlaneState = { hosts: [], mappings: [] };
    await storage.setItem(CONTROL_PLANE_KEY, JSON.stringify(emptyState));
    return emptyState;
  }

  try {
    const parsed = JSON.parse(raw) as {
      hosts?: HostNode[];
      mappings?: Array<{ ruid: string; hostId: string; createdAt: string; updatedAt: string }>;
    };
    return {
      hosts: Array.isArray(parsed.hosts) ? parsed.hosts : [],
      mappings: Array.isArray(parsed.mappings)
        ? parsed.mappings.map((mapping) => ({
            ruid: mapping.ruid,
            createdAt: mapping.createdAt,
            updatedAt: mapping.updatedAt,
            hostId: mapping.hostId,
          }))
        : [],
    };
  } catch {
    const emptyState: ControlPlaneState = { hosts: [], mappings: [] };
    await storage.setItem(CONTROL_PLANE_KEY, JSON.stringify(emptyState));
    return emptyState;
  }
}

export async function saveControlPlaneState(state: ControlPlaneState): Promise<void> {
  const storage = await getStorage();
  await storage.setItem(CONTROL_PLANE_KEY, JSON.stringify(state));
}
