'use server';

import { getControlPlaneService } from '@/lib/control-plane/service';
import { ClusterSummary, HostNode, HostStatusInfo, ManagedRoomInfo, RoomLocationInfo, RoomMapping } from '@/lib/types/control';
import { AllRoomListItem, RoomInfoItem } from '@/lib/types/room';

async function getService() {
  const service = getControlPlaneService();
  await service.init();
  return service;
}

export async function getControlSummaryAction(): Promise<ClusterSummary> {
  return await (await getService()).getSummary();
}

export async function getControlHostsAction(): Promise<HostStatusInfo[]> {
  return await (await getService()).listHosts();
}

export async function createHostAction(payload: Pick<HostNode, 'id' | 'name' | 'baseUrl' | 'enabled'>): Promise<void> {
  await (await getService()).createHost(payload);
}

export async function updateHostAction({
  hostId,
  payload,
}: {
  hostId: string;
  payload: Pick<HostNode, 'name' | 'baseUrl' | 'enabled'>;
}): Promise<void> {
  await (await getService()).updateHost(hostId, payload);
}

export async function deleteHostAction(hostId: string): Promise<void> {
  await (await getService()).deleteHost(hostId);
}

export async function getControlMappingsAction(): Promise<Array<RoomMapping & ManagedRoomInfo>> {
  return await (await getService()).listMappings();
}

export async function createMappingAction(payload: Pick<RoomMapping, 'ruid' | 'hostId'>): Promise<void> {
  await (await getService()).createMapping(payload);
}

export async function updateMappingAction({ ruid, hostId }: { ruid: string; hostId: string }): Promise<void> {
  await (await getService()).updateMapping(ruid, hostId);
}

export async function deleteMappingAction(ruid: string): Promise<void> {
  await (await getService()).deleteMapping(ruid);
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
