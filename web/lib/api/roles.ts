import { AxiosError } from 'axios';

import getApiClient from '@/lib/api-client';
import { DeleteRoleParams, NewRole, PlayerRole, PlayerRoleEvent, RolePagination } from '@/lib/types/roles';

export const getPlayersRoles = async ({
  page,
  pagingCount,
  searchQuery = '',
}: RolePagination): Promise<PlayerRole[]> => {
  const index: number = (page - 1) * pagingCount;
  try {
    const apiClient = getApiClient();
    const result = await apiClient.get(
      `/api/v1/roleslist?searchQuery=${searchQuery}&start=${index}&count=${pagingCount}`,
    );
    return result.data;
  } catch {
    throw new Error('Failed to load roles list.');
  }
};

export const getPlayersRoleEvents = async ({
  page,
  pagingCount,
  searchQuery = '',
}: RolePagination): Promise<PlayerRoleEvent[]> => {
  const index: number = (page - 1) * pagingCount;
  try {
    const apiClient = getApiClient();
    const result = await apiClient.get(
      `/api/v1/roleslist/events?searchQuery=${searchQuery}&start=${index}&count=${pagingCount}`,
    );
    return result.data;
  } catch {
    throw new Error('Failed to load roles events list.');
  }
};

export const addRole = async (newRole: NewRole): Promise<void> => {
  try {
    const apiClient = getApiClient();
    await apiClient.post(`/api/v1/roleslist/${newRole.auth}`, {
      name: newRole.name,
      role: newRole.role,
    });
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      if (error.response.status === 409) {
        throw new Error(`Player '${newRole.name}' (id: ${newRole.auth}) already added.`);
      } else {
        throw new Error(`Failed to add ${newRole.name} (id: ${newRole.auth}).`);
      }
    } else {
      throw new Error('Failed to add role.');
    }
  }
};

export const updateRole = async (role: PlayerRole): Promise<void> => {
  try {
    const apiClient = getApiClient();
    await apiClient.put(`/api/v1/roleslist/${role.auth}`, {
      name: role.name,
      role: role.role,
    });
  } catch {
    throw new Error(`Failed to update ${role.name}'s role.`);
  }
};

export const deleteRole = async ({ auth, name }: DeleteRoleParams): Promise<void> => {
  try {
    const apiClient = getApiClient();
    await apiClient.delete(`/api/v1/roleslist/${auth}?name=${name}`);
  } catch {
    throw new Error(`Failed to delete ${name}'s role.`);
  }
};
