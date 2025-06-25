import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { addRole, deleteRole, getPlayersRoleEvents, getPlayersRoles, updateRole } from '@/lib/api/roles';
import { PlayerRole, PlayerRoleEvent, RolePagination } from '@/lib/types/roles';

const queryKeys = {
  roles: ['roles'],
  rolesEvents: ['roles', 'events'],
};

const queries = {
  getPlayersRoles: (pagination: RolePagination) =>
    useQuery<PlayerRole[]>({
      queryKey: [...queryKeys.roles, pagination],
      queryFn: () => getPlayersRoles(pagination),
      placeholderData: keepPreviousData,
    }),

  getPlayersRoleEvents: (pagination: RolePagination) =>
    useQuery<PlayerRoleEvent[]>({
      queryKey: [...queryKeys.rolesEvents, pagination],
      queryFn: () => getPlayersRoleEvents(pagination),
      placeholderData: keepPreviousData,
    }),
};

const mutations = {
  addRole: () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: addRole,
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.roles });
        queryClient.invalidateQueries({ queryKey: queryKeys.rolesEvents });
      },
    });
  },

  updateRole: () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: updateRole,
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.roles });
        queryClient.invalidateQueries({ queryKey: queryKeys.rolesEvents });
      },
    });
  },

  deleteRole: () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: deleteRole,
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.roles });
        queryClient.invalidateQueries({ queryKey: queryKeys.rolesEvents });
      },
    });
  },
};

export { mutations, queries, queryKeys };
