import 'server-only';

import { DiscordWebhookConfig, TeamColoursResponse } from '@/lib/types/room';
import { getControlPlaneService } from '@/lib/control-plane/service';
import { ClusterSummary, HostStatusInfo, ManagedRoomInfo, RoomLocationInfo, RoomMapping } from '@/lib/types/control';
import { AllRoomListItem, RoomInfo, RoomInfoItem } from '@/lib/types/room';
import { BanListItem, OnlinePlayer, RoomPlayer } from '@/lib/types/player';
import { PlayerRole, PlayerRoleEvent, RolePagination } from '@/lib/types/roles';

async function getService() {
  const service = getControlPlaneService();
  await service.init();
  return service;
}

export async function getServerControlSummary(): Promise<ClusterSummary> {
  return await (await getService()).getSummary();
}

export async function getServerControlHosts(): Promise<HostStatusInfo[]> {
  return await (await getService()).listHosts();
}

export async function getServerControlMappings(): Promise<Array<RoomMapping & ManagedRoomInfo>> {
  return await (await getService()).listMappings();
}

export async function getServerManagedRooms(): Promise<ManagedRoomInfo[]> {
  return await (await getService()).listManagedRooms();
}

export async function getServerRoomLocation(ruid: string): Promise<RoomLocationInfo> {
  return await (await getService()).getRoomLocation(ruid);
}

export async function getServerRoomsInfoList(): Promise<RoomInfoItem[]> {
  return await (await getService()).listRoomInfoItems();
}

export async function getServerAllRoomsList(): Promise<AllRoomListItem[]> {
  return await (await getService()).listAllRooms();
}

export async function getServerRoomInfo(ruid: string): Promise<RoomInfo> {
  return await (await getService()).getRoomInfo(ruid);
}

export async function getServerRoomFreezeStatus(ruid: string): Promise<boolean> {
  const result = await (await getService()).requestRoom<{ freezed: boolean }>(ruid, {
    url: `/api/v1/room/${ruid}/info/freeze`,
    method: 'GET',
  });
  return result.freezed;
}

export async function getServerRoomNoticeMessage(ruid: string): Promise<string> {
  const result = await (await getService()).requestRoom<{ message: string }>(ruid, {
    url: `/api/v1/room/${ruid}/social/notice`,
    method: 'GET',
  });
  return result.message;
}

export async function getServerRoomDiscordWebhookConfig(ruid: string): Promise<DiscordWebhookConfig> {
  return await (await getService()).requestRoom<DiscordWebhookConfig>(ruid, {
    url: `/api/v1/room/${ruid}/social/discord/webhook`,
    method: 'GET',
  });
}

export async function getServerTeamColours(ruid: string): Promise<TeamColoursResponse> {
  return await (await getService()).requestRoom<TeamColoursResponse>(ruid, {
    url: `/api/v1/room/${ruid}/asset/team/colour`,
    method: 'GET',
  });
}

export async function getServerPlayerAccountList(
  ruid: string,
  { page, pagingCount, searchQuery = '' }: { page: number; pagingCount: number; searchQuery?: string },
): Promise<RoomPlayer[]> {
  const index: number = (page - 1) * pagingCount;
  return await (await getService()).requestGlobal<RoomPlayer[]>({
    url: `/api/v1/playerlist/${ruid}?searchQuery=${searchQuery}&start=${index}&count=${pagingCount}`,
    method: 'GET',
  });
}

export async function getServerOnlinePlayers(ruid: string): Promise<OnlinePlayer[]> {
  const service = await getService();
  const onlinePlayersID = await service.requestRoom<number[]>(ruid, {
    url: `/api/v1/room/${ruid}/player`,
    method: 'GET',
  });
  return await Promise.all(
    onlinePlayersID.map(async (playerID) => {
      return await service.requestRoom<OnlinePlayer>(ruid, {
        url: `/api/v1/room/${ruid}/player/${playerID}`,
        method: 'GET',
      });
    }),
  );
}

export async function getServerPlayersBans(
  ruid: string,
  { page, pagingCount }: { page: number; pagingCount: number },
): Promise<BanListItem[]> {
  const index: number = (page - 1) * pagingCount;
  return await (await getService()).requestGlobal<BanListItem[]>({
    url: `/api/v1/banlist/${ruid}?start=${index}&count=${pagingCount}`,
    method: 'GET',
  });
}

export async function getServerPlayersRoles({
  page,
  pagingCount,
  searchQuery = '',
}: RolePagination): Promise<PlayerRole[]> {
  const index: number = (page - 1) * pagingCount;
  return await (await getService()).requestGlobal<PlayerRole[]>({
    url: `/api/v1/roleslist?searchQuery=${searchQuery}&start=${index}&count=${pagingCount}`,
    method: 'GET',
  });
}

export async function getServerPlayersRoleEvents({
  page,
  pagingCount,
  searchQuery = '',
}: RolePagination): Promise<PlayerRoleEvent[]> {
  const index: number = (page - 1) * pagingCount;
  return await (await getService()).requestGlobal<PlayerRoleEvent[]>({
    url: `/api/v1/roleslist/events?searchQuery=${searchQuery}&start=${index}&count=${pagingCount}`,
    method: 'GET',
  });
}
