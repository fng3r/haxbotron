import { useQuery } from '@tanstack/react-query';

import { getServerHosts, getServerInfo } from '@/lib/api/server';
import { ServerHostInfo, ServerInfo } from '@/lib/types/server';

const queryKeys = {
  info: ['server', 'info'],
  hosts: ['server', 'hosts'],
};

const queries = {
  getInfo: () =>
    useQuery<ServerInfo>({
      queryKey: queryKeys.info,
      queryFn: getServerInfo,
    }),
  getHosts: () =>
    useQuery<ServerHostInfo[]>({
      queryKey: queryKeys.hosts,
      queryFn: getServerHosts,
    }),
};

export { queries, queryKeys };
