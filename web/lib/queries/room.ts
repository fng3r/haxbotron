import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  clearPassword,
  createRoom,
  deleteNoticeMessage,
  getAllRoomsList,
  getRoomDiscordWebhookConfig,
  getRoomFreezeStatus,
  getRoomInfo,
  getRoomNoticeMessage,
  getRoomsInfoList,
  getTeamColours,
  sendBroadcastMessage,
  setDiscordWebhookConfig,
  setNoticeMessage,
  setPassword,
  setTeamColours,
  shutdownRoom,
  toggleFreeze,
  getRoomConfigs,
  saveRoomConfig,
  deleteRoomConfig,
} from '@/lib/api/room';
import { AllRoomListItem, DiscordWebhookConfig, PersistedRoomConfig, RoomInfo, RoomInfoItem, TeamColoursResponse } from '@/lib/types/room';

const queryKeys = {
  room: (ruid: string) => ['room', ruid],
  roomFreezeStatus: (ruid: string) => ['room', ruid, 'freezed'],
  roomNoticeMessage: (ruid: string) => ['room', ruid, 'notice'],
  roomDiscordWebhookConfig: (ruid: string) => ['room', ruid, 'webhook'],
  roomTeamColours: (ruid: string) => ['room', ruid, 'colours'],
  rooms: ['rooms'],
  allRooms: ['rooms', 'all'],
  roomConfigs: ['room-configs'],
};

const queries = {
  getRoomsInfoList: () =>
    useQuery<RoomInfoItem[]>({
      queryKey: queryKeys.rooms,
      queryFn: getRoomsInfoList,
    }),

  getAllRoomsList: () =>
    useQuery<AllRoomListItem[]>({
      queryKey: queryKeys.allRooms,
      queryFn: getAllRoomsList,
    }),

  getRoomInfo: (ruid: string) =>
    useQuery<RoomInfo>({
      queryKey: queryKeys.room(ruid),
      queryFn: () => getRoomInfo(ruid),
    }),

  getRoomFreezeStatus: (ruid: string) =>
    useQuery<boolean>({
      queryKey: queryKeys.roomFreezeStatus(ruid),
      queryFn: () => getRoomFreezeStatus(ruid),
    }),

  getRoomNoticeMessage: (ruid: string) =>
    useQuery<string>({
      queryKey: queryKeys.roomNoticeMessage(ruid),
      queryFn: () => getRoomNoticeMessage(ruid),
    }),

  getRoomDiscordWebhookConfig: (ruid: string) =>
    useQuery<DiscordWebhookConfig>({
      queryKey: queryKeys.roomDiscordWebhookConfig(ruid),
      queryFn: () => getRoomDiscordWebhookConfig(ruid),
    }),

  getTeamColours: (ruid: string) =>
    useQuery<TeamColoursResponse>({
      queryKey: queryKeys.roomTeamColours(ruid),
      queryFn: () => getTeamColours(ruid),
    }),

  getRoomConfigs: (initialData?: PersistedRoomConfig[]) =>
    useQuery<PersistedRoomConfig[]>({ queryKey: queryKeys.roomConfigs, queryFn: getRoomConfigs, initialData }),
};

const mutations = {
  saveRoomConfig: () => {
    const queryClient = useQueryClient();
    return useMutation({ mutationFn: saveRoomConfig, onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.roomConfigs }) });
  },

  deleteRoomConfig: () => {
    const queryClient = useQueryClient();
    return useMutation({ mutationFn: deleteRoomConfig, onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.roomConfigs }) });
  },
  createRoom: () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: createRoom,
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.rooms });
      },
    });
  },

  shutdownRoom: () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: shutdownRoom,
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.rooms });
      },
    });
  },

  setNoticeMessage: () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: setNoticeMessage,
      onSettled: (_data, _error, { ruid }) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.roomNoticeMessage(ruid) });
      },
    });
  },

  deleteNoticeMessage: () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: deleteNoticeMessage,
      onSettled: (_data, _error, { ruid }) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.roomNoticeMessage(ruid) });
      },
    });
  },

  setDiscordWebhookConfig: () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: setDiscordWebhookConfig,
      onSettled: (_data, _error, { ruid }) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.roomDiscordWebhookConfig(ruid) });
      },
    });
  },

  sendBroadcastMessage: () => {
    return useMutation({
      mutationFn: sendBroadcastMessage,
    });
  },

  setPassword: () => {
    return useMutation({
      mutationFn: setPassword,
    });
  },

  clearPassword: () => {
    return useMutation({
      mutationFn: clearPassword,
    });
  },

  toggleFreeze: () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: toggleFreeze,
      onSettled: (_data, _error, { ruid }) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.roomFreezeStatus(ruid) });
      },
    });
  },

  setTeamColours: () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: setTeamColours,
      onSettled: (_data, _error, { ruid }) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.roomTeamColours(ruid) });
      },
    });
  },
};

export { mutations, queries, queryKeys };
