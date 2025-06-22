import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { stringify } from 'querystring';

import { Player } from '@/../core/game/model/GameObject/Player';
import client from '@/lib/client';

export interface BanOptions {
  reason?: string;
  seconds: number;
}

export interface NewBanEntry {
  conn: string;
  auth: string;
  reason: string;
  seconds: number;
}

interface BanListItem {
  conn: string;
  auth: string;
  reason: string;
  register: number;
  expire: number;
}

export interface RoomPlayer {
  auth: string;
  conn: string;
  name: string;
  rating: number;
  totals: number;
  disconns: number;
  wins: number;
  goals: number;
  assists: number;
  ogs: number;
  losePoints: number;
  balltouch: number;
  passed: number;
  mute: boolean;
  muteExpire: number;
  rejoinCount: number;
  joinDate: number;
  leftDate: number;
  malActCount: number;
}

type Pagination = {
  page: number;
  pagingCount: number;
  searchQuery?: string;
};

const queryKeys = {
  players: (ruid: string) => ['rooms', ruid, 'players'],
  onlinePlayers: (ruid: string) => ['rooms', ruid, 'players', 'online'],
  playersBans: (ruid: string) => ['rooms', ruid, 'bans'],
};

const queries = {
  getPlayerAccountList: (ruid: string, { page, pagingCount, searchQuery = '' }: Pagination) =>
    useQuery<RoomPlayer[]>({
      queryKey: [...queryKeys.players(ruid), { page, pagingCount, searchQuery }],
      queryFn: async () => {
        const index: number = (page - 1) * pagingCount;
        try {
          const result = await client.get(
            `/api/v1/playerlist/${ruid}?searchQuery=${searchQuery}&start=${index}&count=${pagingCount}`,
          );
          if (result.status === 200) {
            return result.data;
          }
        } catch (e: any) {
          throw new Error('Failed to load players list.');
        }
      },
      placeholderData: keepPreviousData,
    }),

  getOnlinePlayersID: (ruid: string) =>
    useQuery<Player[]>({
      queryKey: queryKeys.onlinePlayers(ruid),
      queryFn: async () => {
        try {
          const result = await client.get(`/api/v1/room/${ruid}/player`);
          const onlinePlayersID: number[] = result.data;
          const onlinePlayersInfoList = await Promise.all(
            onlinePlayersID.map(async (playerID) => {
              const result = await client.get(`/api/v1/room/${ruid}/player/${playerID}`);
              return result.data as Player;
            }),
          );

          return onlinePlayersInfoList;
        } catch (e: any) {
          throw new Error('Failed to load online players list.');
        }
      },
    }),

  getPlayersBans: (ruid: string, { page, pagingCount }: Pagination) =>
    useQuery<BanListItem[]>({
      queryKey: [...queryKeys.playersBans(ruid), { page, pagingCount }],
      queryFn: async () => {
        const index: number = (page - 1) * pagingCount;
        try {
          const result = await client.get(`/api/v1/banlist/${ruid}?start=${index}&count=${pagingCount}`);
          return result.data;
        } catch (error: any) {
          if (error.response.status === 404) {
            throw new Error('Failed to load list.');
          } else {
            throw new Error('Unexpected error is caused. Please try again.');
          }
        }
      },
      placeholderData: keepPreviousData,
    }),
};

const mutations = {
  mutePlayer: () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async ({ ruid, player }: { ruid: string; player: Player }) => {
        try {
          await client.post(`/api/v1/room/${ruid}/player/${player.id}/permission/mute`, { muteExpire: -1 }); // Permanent
        } catch (error: any) {
          throw new Error(`Failed to mute player ${player.name}.`);
        }
      },

      onSettled: (_data, _error, { ruid }) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.players(ruid) });
      },
    });
  },

  unmutePlayer: () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async ({ ruid, player }: { ruid: string; player: Player }) => {
        try {
          await client.delete(`/api/v1/room/${ruid}/player/${player.id}/permission/mute`); // Permanent
        } catch (error: any) {
          throw new Error(`Failed to unmute player ${player.name}.`);
        }
      },

      onSettled: (_data, _error, { ruid }) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.players(ruid) });
      },
    });
  },

  kickPlayer: () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async ({ ruid, player, reason }: { ruid: string; player: Player; reason?: string }) => {
        try {
          await client.delete(`/api/v1/room/${ruid}/player/${player.id}`, {
            data: {
              ban: false,
              seconds: 1,
              message: reason,
            },
          });
        } catch (error: any) {
          throw new Error(`Failed to kick player ${player.name}.`);
        }
      },

      onSettled: (_data, _error, { ruid }) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.players(ruid) });
      },
    });
  },

  banPlayer: () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async ({ ruid, player, banEntry }: { ruid: string; player: Player; banEntry: BanOptions }) => {
        try {
          console.log(banEntry);
          await client.delete(`/api/v1/room/${ruid}/player/${player.id}`, {
            data: {
              ban: true,
              seconds: banEntry.seconds,
              message: banEntry.reason,
            },
          });
        } catch (error: any) {
          throw new Error(`Failed to ban player ${player.name}.`);
        }
      },

      onSettled: (_data, _error, { ruid }) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.players(ruid) });
      },
    });
  },

  addPlayerBan: () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async ({ ruid, banEntry }: { ruid: string; banEntry: NewBanEntry }) => {
        try {
          await client.post(`/api/v1/banlist/${ruid}`, banEntry);
        } catch (error: any) {
          throw new Error('Failed to add new ban.');
        }
      },

      onSettled: (_data, _error, { ruid }) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.players(ruid) });
        queryClient.invalidateQueries({ queryKey: queryKeys.playersBans(ruid) });
      },
    });
  },

  removePlayerBan: () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async ({ ruid, conn }: { ruid: string; conn: string }) => {
        try {
          await client.delete(`/api/v1/banlist/${ruid}/${conn}`);
        } catch (error: any) {
          throw new Error('Failed to remove ban entry.');
        }
      },

      onSettled: (_data, _error, { ruid }) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.players(ruid) });
        queryClient.invalidateQueries({ queryKey: queryKeys.playersBans(ruid) });
      },
    });
  },

  sendWhisper: () => {
    return useMutation({
      mutationFn: async ({ ruid, player, message }: { ruid: string; player: Player; message: string }) => {
        try {
          await client.post(`/api/v1/room/${ruid}/chat/${player.id}`, { message });
        } catch (error: any) {
          let errorMessage = '';
          switch (error.response.status) {
            case 400: {
              errorMessage = 'No message provided.';
              break;
            }
            case 401: {
              errorMessage = 'Insufficient permissions.';
              break;
            }
            case 404: {
              errorMessage = 'Room does not exist or player does not exist.';
              break;
            }
            default: {
              errorMessage = 'Unexpected error occurred. Please try again.';
              break;
            }
          }

          throw new Error(errorMessage);
        }
      },
    });
  },
};

export { queryKeys, queries, mutations };
