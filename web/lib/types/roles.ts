export type NewRole = {
  auth: string;
  name: string;
  role: string;
};

export type PlayerRole = {
  auth: string;
  name: string;
  role: string;
};

export enum PlayerRoleEventType {
  addRole = 'addrole',
  removeRole = 'rmrole',
  updateRole = 'updaterole',
}

export type PlayerRoleEvent = {
  type: PlayerRoleEventType;
  auth: string;
  name: string;
  role: string;
  timestamp: number;
};

export type RolePagination = {
  page: number;
  pagingCount: number;
  searchQuery?: string;
};

export interface DeleteRoleParams {
  auth: string;
  name: string;
}
