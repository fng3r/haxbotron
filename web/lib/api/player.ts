import getApiClient from '@/lib/api-client';
import { Pagination } from '@/lib/types/common';
import { BanListItem, BanOptions, NewBanEntry, OnlinePlayer, RoomPlayer } from '@/lib/types/player';

function toMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  return fallback;
}

export const getPlayerAccountList = async (
  ruid: string,
  { page, pagingCount, searchQuery = '' }: Pagination,
): Promise<RoomPlayer[]> => {
  const index: number = (page - 1) * pagingCount;
  try {
    const apiClient = getApiClient();
    const result = await apiClient.get(`/api/v1/playerlist/${ruid}?searchQuery=${searchQuery}&start=${index}&count=${pagingCount}`);
    return result.data;
  } catch (error) {
    throw new Error(toMessage(error, 'Failed to load players list.'));
  }
};

export const getOnlinePlayers = async (ruid: string): Promise<OnlinePlayer[]> => {
  try {
    const apiClient = getApiClient();
    const result = await apiClient.get(`/api/v1/room/${ruid}/player`);
    const onlinePlayersID: number[] = result.data;
    const onlinePlayersInfoList = await Promise.all(
      onlinePlayersID.map(async (playerID) => {
        const result = await apiClient.get(`/api/v1/room/${ruid}/player/${playerID}`);
        return result.data as OnlinePlayer;
      }),
    );

    return onlinePlayersInfoList;
  } catch (error) {
    throw new Error(toMessage(error, 'Failed to load online players list.'));
  }
};

export const getPlayersBans = async (ruid: string, { page, pagingCount }: Pagination): Promise<BanListItem[]> => {
  const index: number = (page - 1) * pagingCount;
  try {
    const apiClient = getApiClient();
    const result = await apiClient.get(`/api/v1/banlist/${ruid}?start=${index}&count=${pagingCount}`);
    return result.data;
  } catch (error) {
    throw new Error(toMessage(error, 'Failed to load bans list.'));
  }
};

export const mutePlayer = async ({ ruid, player }: { ruid: string; player: OnlinePlayer }): Promise<void> => {
  try {
    const apiClient = getApiClient();
    await apiClient.post(`/api/v1/room/${ruid}/player/${player.id}/permission/mute`, { muteExpire: -1 });
  } catch (error) {
    throw new Error(toMessage(error, `Failed to mute player ${player.name}.`));
  }
};

export const unmutePlayer = async ({ ruid, player }: { ruid: string; player: OnlinePlayer }): Promise<void> => {
  try {
    const apiClient = getApiClient();
    await apiClient.delete(`/api/v1/room/${ruid}/player/${player.id}/permission/mute`);
  } catch (error) {
    throw new Error(toMessage(error, `Failed to unmute player ${player.name}.`));
  }
};

export const kickPlayer = async ({
  ruid,
  player,
  reason,
}: {
  ruid: string;
  player: OnlinePlayer;
  reason?: string;
}): Promise<void> => {
  const payload = {
    ban: false,
    reason,
    seconds: 1,
  };
  try {
    const apiClient = getApiClient();
    await apiClient.delete(`/api/v1/room/${ruid}/player/${player.id}`, { data: payload });
  } catch (error) {
    throw new Error(toMessage(error, `Failed to kick player ${player.name}.`));
  }
};

export const banPlayer = async ({
  ruid,
  player,
  banOptions,
}: {
  ruid: string;
  player: OnlinePlayer;
  banOptions: BanOptions;
}): Promise<void> => {
  const payload = {
    ban: true,
    reason: banOptions.reason,
    seconds: banOptions.seconds,
  };
  try {
    const apiClient = getApiClient();
    await apiClient.delete(`/api/v1/room/${ruid}/player/${player.id}`, { data: payload });
  } catch (error) {
    throw new Error(toMessage(error, `Failed to ban player ${player.name}.`));
  }
};

export const addBan = async ({ ruid, banEntry }: { ruid: string; banEntry: NewBanEntry }): Promise<void> => {
  try {
    const apiClient = getApiClient();
    await apiClient.post(`/api/v1/banlist/${ruid}`, banEntry);
  } catch (error) {
    throw new Error(toMessage(error, 'Failed to add new ban.'));
  }
};

export const removeBan = async ({ ruid, conn }: { ruid: string; conn: string }): Promise<void> => {
  try {
    const apiClient = getApiClient();
    await apiClient.delete(`/api/v1/banlist/${ruid}/${conn}`);
  } catch (error) {
    throw new Error(toMessage(error, 'Failed to remove ban entry.'));
  }
};

export const sendMessageToPlayer = async ({
  ruid,
  player,
  message,
}: {
  ruid: string;
  player: OnlinePlayer;
  message: string;
}): Promise<void> => {
  try {
    const apiClient = getApiClient();
    await apiClient.post(`/api/v1/room/${ruid}/chat/${player.id}`, { message });
  } catch (error) {
    throw new Error(toMessage(error, 'Failed to send message to player.'));
  }
};
