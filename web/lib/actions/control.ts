'use server';

import { getControlPlaneService } from '@/lib/control-plane/service';
import { ClusterSummary, HostNode, HostStatusInfo, ManagedRoomInfo, RoomLocationInfo, RoomMapping } from '@/lib/types/control';
import { AllRoomListItem, RoomInfoItem } from '@/lib/types/room';

export type ControlMutationResult =
  | {
      ok: true;
      message: string;
    }
  | {
      ok: false;
      message: string;
    };

async function getService() {
  const service = getControlPlaneService();
  await service.init();
  return service;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export async function getControlSummaryAction(): Promise<ClusterSummary> {
  return await (await getService()).getSummary();
}

export async function getControlHostsAction(): Promise<HostStatusInfo[]> {
  return await (await getService()).listHosts();
}

export async function createHostAction(
  payload: Pick<HostNode, 'id' | 'name' | 'baseUrl' | 'enabled'>,
): Promise<ControlMutationResult> {
  try {
    await (await getService()).createHost(payload);
    return { ok: true, message: `Host '${payload.name}' created.` };
  } catch (error) {
    return { ok: false, message: getErrorMessage(error, 'Failed to create host.') };
  }
}

export async function updateHostAction({
  hostId,
  payload,
}: {
  hostId: string;
  payload: Pick<HostNode, 'name' | 'baseUrl' | 'enabled'>;
}): Promise<ControlMutationResult> {
  try {
    await (await getService()).updateHost(hostId, payload);
    return { ok: true, message: `Host '${payload.name}' updated.` };
  } catch (error) {
    return { ok: false, message: getErrorMessage(error, 'Failed to update host.') };
  }
}

export async function deleteHostAction(hostId: string): Promise<ControlMutationResult> {
  try {
    await (await getService()).deleteHost(hostId);
    return { ok: true, message: `Host '${hostId}' deleted.` };
  } catch (error) {
    return { ok: false, message: getErrorMessage(error, 'Failed to delete host.') };
  }
}

export async function getControlMappingsAction(): Promise<Array<RoomMapping & ManagedRoomInfo>> {
  return await (await getService()).listMappings();
}

export async function createMappingAction(
  payload: Pick<RoomMapping, 'ruid' | 'hostId'>,
): Promise<ControlMutationResult> {
  try {
    await (await getService()).createMapping(payload);
    return { ok: true, message: `Mapping '${payload.ruid}' created.` };
  } catch (error) {
    return { ok: false, message: getErrorMessage(error, 'Failed to create mapping.') };
  }
}

export async function updateMappingAction({
  ruid,
  hostId,
}: {
  ruid: string;
  hostId: string;
}): Promise<ControlMutationResult> {
  try {
    await (await getService()).updateMapping(ruid, hostId);
    return { ok: true, message: `Mapping '${ruid}' updated.` };
  } catch (error) {
    return { ok: false, message: getErrorMessage(error, 'Failed to update mapping.') };
  }
}

export async function deleteMappingAction(ruid: string): Promise<ControlMutationResult> {
  try {
    await (await getService()).deleteMapping(ruid);
    return { ok: true, message: `Mapping '${ruid}' deleted.` };
  } catch (error) {
    return { ok: false, message: getErrorMessage(error, 'Failed to delete mapping.') };
  }
}

export async function getManagedRoomsAction(): Promise<ManagedRoomInfo[]> {
  return await (await getService()).listManagedRooms();
}

export async function getRoomLocationAction(ruid: string): Promise<RoomLocationInfo> {
  return await (await getService()).getRoomLocation(ruid);
}

export async function getRoomsInfoListAction(): Promise<RoomInfoItem[]> {
  return await (await getService()).listRoomInfoItems();
}

export async function getAllRoomsListAction(): Promise<AllRoomListItem[]> {
  return await (await getService()).listAllRooms();
}
