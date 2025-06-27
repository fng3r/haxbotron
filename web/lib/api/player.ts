import { Player } from '@/../core/game/model/GameObject/Player';
import getApiClient from '@/lib/api-client';
import { Pagination } from '@/lib/types/common';
import { BanListItem, BanOptions, NewBanEntry, RoomPlayer } from '@/lib/types/player';

export const getPlayerAccountList = async (
  ruid: string,
  { page, pagingCount, searchQuery = '' }: Pagination,
): Promise<RoomPlayer[]> => {
  const index: number = (page - 1) * pagingCount;
  try {
    const apiClient = getApiClient();
    const result = await apiClient.get(
      `/api/v1/playerlist/${ruid}?searchQuery=${searchQuery}&start=${index}&count=${pagingCount}`,
    );
    return result.data;
  } catch {
    throw new Error('Failed to load players list.');
  }
};

export const getOnlinePlayers = async (ruid: string): Promise<Player[]> => {
  try {
    const apiClient = getApiClient();
    const result = await apiClient.get(`/api/v1/room/${ruid}/player`);
    const onlinePlayersID: number[] = result.data;
    const onlinePlayersInfoList = await Promise.all(
      onlinePlayersID.map(async (playerID) => {
        const result = await apiClient.get(`/api/v1/room/${ruid}/player/${playerID}`);
        return result.data as Player;
      }),
    );

    return onlinePlayersInfoList;
  } catch {
    throw new Error('Failed to load online players list.');
  }
};

export const getPlayersBans = async (ruid: string, { page, pagingCount }: Pagination): Promise<BanListItem[]> => {
  const index: number = (page - 1) * pagingCount;
  try {
    const apiClient = getApiClient();
    const result = await apiClient.get(`/api/v1/banlist/${ruid}?start=${index}&count=${pagingCount}`);
    return result.data;
  } catch {
    throw new Error('Failed to load bans list.');
  }
};

export const mutePlayer = async ({ ruid, player }: { ruid: string; player: Player }): Promise<void> => {
  try {
    const apiClient = getApiClient();
    await apiClient.post(`/api/v1/room/${ruid}/player/${player.id}/permission/mute`, { muteExpire: -1 }); // Permanent
  } catch {
    throw new Error(`Failed to mute player ${player.name}.`);
  }
};

export const unmutePlayer = async ({ ruid, player }: { ruid: string; player: Player }): Promise<void> => {
  try {
    const apiClient = getApiClient();
    await apiClient.delete(`/api/v1/room/${ruid}/player/${player.id}/permission/mute`); // Permanent
  } catch {
    throw new Error(`Failed to unmute player ${player.name}.`);
  }
};

export const kickPlayer = async ({
  ruid,
  player,
  reason,
}: {
  ruid: string;
  player: Player;
  reason: string;
}): Promise<void> => {
  try {
    const apiClient = getApiClient();
    await apiClient.delete(`/api/v1/room/${ruid}/player/${player.id}`, {
      data: {
        ban: false,
        reason: reason,
        seconds: 1,
      },
    });
  } catch {
    throw new Error(`Failed to kick player ${player.name}.`);
  }
};

export const banPlayer = async ({
  ruid,
  player,
  banOptions,
}: {
  ruid: string;
  player: Player;
  banOptions: BanOptions;
}): Promise<void> => {
  try {
    const apiClient = getApiClient();
    await apiClient.delete(`/api/v1/room/${ruid}/player/${player.id}`, {
      data: {
        ban: true,
        reason: banOptions.reason,
        seconds: banOptions.seconds,
      },
    });
  } catch {
    throw new Error(`Failed to ban player ${player.name}.`);
  }
};

export const addBan = async ({ ruid, banEntry }: { ruid: string; banEntry: NewBanEntry }): Promise<void> => {
  try {
    const apiClient = getApiClient();
    await apiClient.post(`/api/v1/banlist/${ruid}`, banEntry);
  } catch {
    throw new Error('Failed to add new ban.');
  }
};

export const removeBan = async ({ ruid, conn }: { ruid: string; conn: string }): Promise<void> => {
  try {
    const apiClient = getApiClient();
    await apiClient.delete(`/api/v1/banlist/${ruid}/${conn}`);
  } catch {
    throw new Error('Failed to remove ban entry.');
  }
};

export const sendMessageToPlayer = async ({
  ruid,
  player,
  message,
}: {
  ruid: string;
  player: Player;
  message: string;
}): Promise<void> => {
  try {
    const apiClient = getApiClient();
    await apiClient.post(`/api/v1/room/${ruid}/chat/${player.id}`, { message });
  } catch {
    throw new Error('Failed to send message to player.');
  }
};
