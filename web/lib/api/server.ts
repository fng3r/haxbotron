import getApiClient from '@/lib/api-client';
import { ServerInfo } from '@/lib/types/server';

export const getServerInfo = async (): Promise<ServerInfo> => {
  try {
    const apiClient = getApiClient();
    const result = await apiClient.get('/api/v1/system');
    return result.data;
  } catch {
    throw new Error('Failed to load server info.');
  }
};
