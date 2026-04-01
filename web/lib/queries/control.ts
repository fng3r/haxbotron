import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createHost,
  createMapping,
  deleteHost,
  deleteMapping,
  getControlHosts,
  getControlMappings,
  getControlSummary,
  getManagedRooms,
  updateHost,
  updateMapping,
} from '@/lib/api/control';
import { queryKeys as roomQueryKeys } from '@/lib/queries/room';
import { ClusterSummary, HostNode, HostStatusInfo, ManagedRoomInfo, RoomMapping } from '@/lib/types/control';

const queryKeys = {
  summary: ['control', 'summary'],
  hosts: ['control', 'hosts'],
  mappings: ['control', 'mappings'],
  rooms: ['control', 'rooms'],
};

const queries = {
  getSummary: () =>
    useQuery<ClusterSummary>({
      queryKey: queryKeys.summary,
      queryFn: getControlSummary,
    }),
  getHosts: () =>
    useQuery<HostStatusInfo[]>({
      queryKey: queryKeys.hosts,
      queryFn: getControlHosts,
    }),
  getMappings: () =>
    useQuery<Array<RoomMapping & ManagedRoomInfo>>({
      queryKey: queryKeys.mappings,
      queryFn: getControlMappings,
    }),
  getManagedRooms: () =>
    useQuery<ManagedRoomInfo[]>({
      queryKey: queryKeys.rooms,
      queryFn: getManagedRooms,
    }),
};

function invalidateControlQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: queryKeys.summary });
  queryClient.invalidateQueries({ queryKey: queryKeys.hosts });
  queryClient.invalidateQueries({ queryKey: queryKeys.mappings });
  queryClient.invalidateQueries({ queryKey: queryKeys.rooms });
  queryClient.invalidateQueries({ queryKey: roomQueryKeys.rooms });
  queryClient.invalidateQueries({ queryKey: roomQueryKeys.allRooms });
}

const mutations = {
  createHost: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (payload: Pick<HostNode, 'id' | 'name' | 'baseUrl' | 'enabled'>) => createHost(payload),
      onSettled: () => invalidateControlQueries(queryClient),
    });
  },
  updateHost: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ hostId, payload }: { hostId: string; payload: Pick<HostNode, 'name' | 'baseUrl' | 'enabled'> }) =>
        updateHost({ hostId, payload }),
      onSettled: () => invalidateControlQueries(queryClient),
    });
  },
  deleteHost: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (hostId: string) => deleteHost(hostId),
      onSettled: () => invalidateControlQueries(queryClient),
    });
  },
  createMapping: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (payload: Pick<RoomMapping, 'ruid' | 'hostId'>) => createMapping(payload),
      onSettled: () => invalidateControlQueries(queryClient),
    });
  },
  updateMapping: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ ruid, hostId }: { ruid: string; hostId: string }) => updateMapping({ ruid, hostId }),
      onSettled: () => invalidateControlQueries(queryClient),
    });
  },
  deleteMapping: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (ruid: string) => deleteMapping(ruid),
      onSettled: () => invalidateControlQueries(queryClient),
    });
  },
};

export { mutations, queries, queryKeys };
