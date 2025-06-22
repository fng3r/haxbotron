import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import client from '@/lib/client';

export interface NewRole {
  auth: string;
  name: string;
  role: string;
}

export interface PlayerRole {
  auth: string;
  name: string;
  role: string;
}

export enum PlayerRoleEventType {
  addRole = 'addrole',
  removeRole = 'rmrole',
  updateRole = 'updaterole',
}

export interface PlayerRoleEvent {
  type: PlayerRoleEventType;
  auth: string;
  name: string;
  role: string;
  timestamp: number;
}

type Pagination = {
  page: number;
  pagingCount: number;
  searchQuery?: string;
};

const queryKeys = {
  roles: ['roles'],
  rolesEvents: ['roles', 'events'],
};

const queries = {
  getPlayersRoles: ({ page, pagingCount, searchQuery = '' }: Pagination) =>
    useQuery<PlayerRole[]>({
      queryKey: [...queryKeys.roles, { page, pagingCount, searchQuery }],
      queryFn: async () => {
        const index: number = (page - 1) * pagingCount;
        try {
          const result = await client.get(
            `/api/v1/roleslist?searchQuery=${searchQuery}&start=${index}&count=${pagingCount}`,
          );
          return result.data;
        } catch (e: any) {
          throw new Error('Failed to load roles list.');
        }
      },
      placeholderData: keepPreviousData,
    }),

  getPlayersRoleEvents: ({ page, pagingCount, searchQuery = '' }: Pagination) =>
    useQuery<PlayerRoleEvent[]>({
      queryKey: [...queryKeys.rolesEvents, { page, pagingCount, searchQuery }],
      queryFn: async () => {
        const index: number = (page - 1) * pagingCount;
        try {
          const result = await client.get(
            `/api/v1/roleslist/events?searchQuery=${searchQuery}&start=${index}&count=${pagingCount}`,
          );
          console.log(`events: ${result.data}`);
          return result.data;
        } catch (e: any) {
          throw new Error('Failed to load roles events list.');
        }
      },
      placeholderData: keepPreviousData,
    }),
};

const mutations = {
  addRole: () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async (newRole: NewRole) => {
        try {
          await client.post(`/api/v1/roleslist/${newRole.auth}`, {
            name: newRole.name,
            role: newRole.role,
          });
        } catch (error: any) {
          if (error.response.status === 409) {
            throw new Error(`Player '${newRole.name}' (id: ${newRole.auth}) already added.`);
          } else {
            throw new Error(`Failed to add ${newRole.name} (id: ${newRole.auth}).`);
          }
        }
      },

      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.roles });
        queryClient.invalidateQueries({ queryKey: queryKeys.rolesEvents });
      },
    });
  },

  updateRole: () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async (role: PlayerRole) => {
        try {
          await client.put(`/api/v1/roleslist/${role.auth}`, {
            name: role.name,
            role: role.role,
          });
        } catch (error: any) {
          throw new Error(`Failed to update ${role.name}'s role.`);
        }
      },

      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.roles });
        queryClient.invalidateQueries({ queryKey: queryKeys.rolesEvents });
      },
    });
  },

  deleteRole: () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async ({ auth, name }: { auth: string; name: string }) => {
        try {
          await client.delete(`/api/v1/roleslist/${auth}?name=${name}`);
        } catch (error: any) {
          throw new Error(`Failed to delete ${name}'s role.`);
        }
      },

      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.roles });
        queryClient.invalidateQueries({ queryKey: queryKeys.rolesEvents });
      },
    });
  },
};

export { queryKeys, queries, mutations };
