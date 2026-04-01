import getApiClient from '@/lib/api-client';
import { ClusterSummary, HostNode, HostStatusInfo, ManagedRoomInfo, RoomLocationInfo, RoomMapping } from '@/lib/types/control';

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  return fallback;
}

export const getControlSummary = async (): Promise<ClusterSummary> => {
  const apiClient = getApiClient();
  const result = await apiClient.get('/api/v1/control/summary');
  return result.data;
};

export const getControlHosts = async (): Promise<HostStatusInfo[]> => {
  const apiClient = getApiClient();
  const result = await apiClient.get('/api/v1/control/hosts');
  return result.data;
};

export const createHost = async (payload: Pick<HostNode, 'id' | 'name' | 'baseUrl' | 'enabled'>): Promise<void> => {
  try {
    const apiClient = getApiClient();
    await apiClient.post('/api/v1/control/hosts', payload);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to create host.'));
  }
};

export const updateHost = async ({
  hostId,
  payload,
}: {
  hostId: string;
  payload: Pick<HostNode, 'name' | 'baseUrl' | 'enabled'>;
}): Promise<void> => {
  try {
    const apiClient = getApiClient();
    await apiClient.put(`/api/v1/control/hosts/${hostId}`, payload);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to update host.'));
  }
};

export const deleteHost = async (hostId: string): Promise<void> => {
  try {
    const apiClient = getApiClient();
    await apiClient.delete(`/api/v1/control/hosts/${hostId}`);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to delete host.'));
  }
};

export const getControlMappings = async (): Promise<Array<RoomMapping & ManagedRoomInfo>> => {
  const apiClient = getApiClient();
  const result = await apiClient.get('/api/v1/control/mappings');
  return result.data;
};

export const createMapping = async (payload: Pick<RoomMapping, 'ruid' | 'hostId'>): Promise<void> => {
  try {
    const apiClient = getApiClient();
    await apiClient.post('/api/v1/control/mappings', payload);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to create mapping.'));
  }
};

export const updateMapping = async ({ ruid, hostId }: { ruid: string; hostId: string }): Promise<void> => {
  try {
    const apiClient = getApiClient();
    await apiClient.put(`/api/v1/control/mappings/${ruid}`, { hostId });
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to update mapping.'));
  }
};

export const deleteMapping = async (ruid: string): Promise<void> => {
  try {
    const apiClient = getApiClient();
    await apiClient.delete(`/api/v1/control/mappings/${ruid}`);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to delete mapping.'));
  }
};

export const getManagedRooms = async (): Promise<ManagedRoomInfo[]> => {
  const apiClient = getApiClient();
  const result = await apiClient.get('/api/v1/control/rooms');
  return result.data;
};

export const getRoomLocation = async (ruid: string): Promise<RoomLocationInfo> => {
  const apiClient = getApiClient();
  const result = await apiClient.get(`/api/v1/control/rooms/${ruid}/location`);
  return result.data;
};
