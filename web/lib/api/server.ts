import { getControlHostsAction, getControlSummaryAction } from '@/lib/actions/control';
import { ServerHostInfo, ServerInfo } from '@/lib/types/server';

export const getServerInfo = async (): Promise<ServerInfo> => {
  try {
    return await getControlSummaryAction();
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to load server info.');
  }
};

export const getServerHosts = async (): Promise<ServerHostInfo[]> => {
  try {
    return await getControlHostsAction();
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to load hosts info.');
  }
};
