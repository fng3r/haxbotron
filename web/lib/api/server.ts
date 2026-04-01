import getApiClient from '@/lib/api-client';
import { ServerHostInfo, ServerInfo } from '@/lib/types/server';

export const getServerInfo = async (): Promise<ServerInfo> => {
  try {
    const apiClient = getApiClient();
    const result = await apiClient.get('/api/v1/control/summary');
    return result.data;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to load server info.');
  }
};

export const getServerHosts = async (): Promise<ServerHostInfo[]> => {
  try {
    const apiClient = getApiClient();
    const result = await apiClient.get('/api/v1/control/hosts');
    return result.data;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to load hosts info.');
  }
};
