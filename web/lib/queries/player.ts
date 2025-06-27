import { Pagination } from '../types/common';
import { BanListItem, RoomPlayer } from '../types/player';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Player } from '@/../core/game/model/GameObject/Player';
import {
  addBan,
  banPlayer,
  getOnlinePlayers,
  getPlayerAccountList,
  getPlayersBans,
  kickPlayer,
  mutePlayer,
  removeBan,
  sendMessageToPlayer,
  unmutePlayer,
} from '@/lib/api/player';

const queryKeys = {
  players: (ruid: string) => ['rooms', ruid, 'players'],
  onlinePlayers: (ruid: string) => ['rooms', ruid, 'players', 'online'],
  playersBans: (ruid: string) => ['rooms', ruid, 'bans'],
};

const queries = {
  getPlayerAccountList: (ruid: string, pagination: Pagination) =>
    useQuery<RoomPlayer[]>({
      queryKey: [...queryKeys.players(ruid), pagination],
      queryFn: () => getPlayerAccountList(ruid, pagination),
      placeholderData: keepPreviousData,
    }),

  getOnlinePlayersID: (ruid: string) =>
    useQuery<Player[]>({
      queryKey: queryKeys.onlinePlayers(ruid),
      queryFn: () => getOnlinePlayers(ruid),
    }),

  getPlayersBans: (ruid: string, pagination: Pagination) =>
    useQuery<BanListItem[]>({
      queryKey: [...queryKeys.playersBans(ruid), pagination],
      queryFn: () => getPlayersBans(ruid, pagination),
      placeholderData: keepPreviousData,
    }),
};

const mutations = {
  mutePlayer: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: mutePlayer,
      onSettled: (_data, _error, { ruid }) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.onlinePlayers(ruid) });
      },
    });
  },

  unmutePlayer: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: unmutePlayer,
      onSettled: (_data, _error, { ruid }) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.players(ruid) });
      },
    });
  },

  kickPlayer: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: kickPlayer,
      onSettled: (_data, _error, { ruid }) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.players(ruid) });
      },
    });
  },

  banPlayer: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: banPlayer,
      onSettled: (_data, _error, { ruid }) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.players(ruid) });
      },
    });
  },

  addBan: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: addBan,
      onSettled: (_data, _error, { ruid }) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.players(ruid) });
        queryClient.invalidateQueries({ queryKey: queryKeys.playersBans(ruid) });
      },
    });
  },

  removeBan: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: removeBan,
      onSettled: (_data, _error, { ruid }) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.players(ruid) });
        queryClient.invalidateQueries({ queryKey: queryKeys.playersBans(ruid) });
      },
    });
  },

  sendWhisper: () => {
    return useMutation({
      mutationFn: sendMessageToPlayer,
    });
  },
};

export { mutations, queries, queryKeys };
