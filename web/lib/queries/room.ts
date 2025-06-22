import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  BrowserHostRoomConfig,
  BrowserHostRoomGameRule,
  BrowserHostRoomSettings,
  ReactHostRoomInfo,
} from '@/../core/lib/browser.hostconfig';
import client from '@/lib/client';

interface RoomInfoItem {
  ruid: string;
  roomName: string;
  roomLink: string;
  onlinePlayers: number;
}

interface RuidListItem {
  ruid: string;
}

interface AllRoomListItem {
  ruid: string;
  online: boolean;
}

interface RoomInfo {
  ruid: string;
  isOnline: boolean;
  roomName: string;
  onlinePlayers: number;
  adminPassword: string;
  _link: string;
  _roomConfig: BrowserHostRoomConfig;
  _settings: BrowserHostRoomSettings;
  _rules: BrowserHostRoomGameRule;
}

type DiscordWebhookConfig = {
  feed: boolean;
  passwordWebhookId: string;
  passwordWebhookToken: string;
  replaysWebhookId: string;
  replaysWebhookToken: string;
  replayUpload: boolean;
};

const queryKeys = {
  room: (ruid: string) => ['room', ruid],
  roomFreezeStatus: (ruid: string) => ['room', ruid, 'freezed'],
  roomNoticeMessage: (ruid: string) => ['room', ruid, 'notice'],
  roomDiscordWebhookConfig: (ruid: string) => ['room', ruid, 'webhook'],
  rooms: ['rooms'],
  allRooms: ['rooms', 'all'],
};

const queries = {
  getRoomsInfoList: () =>
    useQuery<RoomInfoItem[]>({
      queryKey: queryKeys.rooms,
      queryFn: async () => {
        const result = await client.get('/api/v1/room');
        const roomList: string[] = result.data;

        return await Promise.all(
          roomList.map(async (ruid) => {
            const result = await client.get(`/api/v1/room/${ruid}/info`);
            return {
              ruid: ruid,
              roomName: result.data.roomName,
              roomLink: result.data._link,
              onlinePlayers: result.data.onlinePlayers,
            };
          }),
        );
      },
      placeholderData: [],
    }),

  getAllRoomsList: () =>
    useQuery<AllRoomListItem[]>({
      queryKey: queryKeys.allRooms,
      queryFn: async () => {
        const result = await client.get('/api/v1/ruidlist');
        const allRuidList: RuidListItem[] = result.data;
        const onlineRoomList = await client
          .get(`/api/v1/room`)
          .then((response) => {
            return response.data as string[];
          })
          .catch(() => {
            return [] as string[];
          });

        return await Promise.all(
          allRuidList.map(async (item) => {
            return {
              ruid: item.ruid,
              online: onlineRoomList?.includes(item.ruid) || false,
            };
          }),
        );
      },
    }),

  getRoomInfo: (ruid: string) =>
    useQuery<RoomInfo>({
      queryKey: queryKeys.room(ruid),
      queryFn: async () => {
        try {
          const result = await client.get(`/api/v1/room/${ruid}/info`);
          if (result.status === 200) {
            return {
              isOnline: true,
              ...result.data,
            };
          }
        } catch (error: any) {
          if (error.response.status === 404) {
            return {
              ruid: ruid,
              isOnline: false,
            };
          } else {
            throw new Error('Unexpected error occured. Please try again.');
          }
        }
      },
    }),

  getRoomFreezeStatus: (ruid: string) =>
    useQuery<boolean>({
      queryKey: queryKeys.roomFreezeStatus(ruid),
      queryFn: async () => {
        try {
          const result = await client.get(`/api/v1/room/${ruid}/info/freeze`);
          if (result.status === 200) {
            return result.data.freezed;
          }
        } catch (error: any) {
          if (error.response.status === 404) {
            throw new Error('Failed to load status of chat.');
          } else {
            throw new Error('Unexpected error occured. Please try again.');
          }
        }
      },
    }),

  getRoomNoticeMessage: (ruid: string) =>
    useQuery<string>({
      queryKey: queryKeys.roomNoticeMessage(ruid),
      queryFn: async () => {
        try {
          const result = await client.get(`/api/v1/room/${ruid}/social/notice`);
          if (result.status === 200) {
            return result.data.message;
          }
        } catch (error: any) {
          let errorMessage = '';
          if (error.response.status === 404) {
            errorMessage = 'Failed to load notice message.';
          } else {
            errorMessage = 'Unexpected error occured. Please try again.';
          }

          throw new Error(errorMessage);
        }
      },
    }),

  getRoomDiscordWebhookConfig: (ruid: string) =>
    useQuery<DiscordWebhookConfig>({
      queryKey: queryKeys.roomDiscordWebhookConfig(ruid),
      queryFn: async () => {
        try {
          const result = await client.get(`/api/v1/room/${ruid}/social/discord/webhook`);
          if (result.status === 200) {
            return result.data;
          }
        } catch (error: any) {
          let errorMessage = '';
          if (error.response.status === 404) {
            errorMessage = 'Failed to load Discord Webhook configuration.';
          } else {
            errorMessage = 'Unexpected error occurred. Please try again.';
          }

          throw new Error(errorMessage);
        }
      },
    }),
};

const mutations = {
  createRoom: () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async (roomConfig: ReactHostRoomInfo) => {
        try {
          await client.post(`/api/v1/room`, roomConfig);
        } catch (error: any) {
          let errorMessage = '';
          switch (error.response.status) {
            case 400: {
              errorMessage = 'Configuration schema is unfulfilled.';
              break;
            }
            case 401: {
              errorMessage = 'Rejected.';
              break;
            }
            case 409: {
              errorMessage = 'Room with the same RUID is already running.';
              break;
            }
            default: {
              errorMessage = 'Unexpected error occured. Please try again.';
              break;
            }
          }

          throw new Error(errorMessage);
        }
      },

      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.rooms });
      },
    });
  },

  shutdownRoom: () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async (ruid: string) => {
        try {
          await client.delete(`/api/v1/room/${ruid}`);
        } catch (error: any) {
          let errorMessage = '';
          switch (error.response.status) {
            case 401: {
              errorMessage = 'No permission.';
              break;
            }
            case 404: {
              errorMessage = 'Room does not exist.';
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

      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.rooms });
      },
    });
  },

  setNoticeMessage: () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async ({ ruid, message }: { ruid: string; message: string }) => {
        try {
          await client.post(`/api/v1/room/${ruid}/social/notice`, { message });
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
              errorMessage = 'Room does not exist.';
              break;
            }
            default: {
              errorMessage = 'Unexpected error occured. Please try again.';
              break;
            }
          }

          throw new Error(errorMessage);
        }
      },

      onSettled: (_data, _error, { ruid }) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.roomNoticeMessage(ruid) });
      },
    });
  },

  deleteNoticeMessage: () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async ({ ruid }: { ruid: string }) => {
        try {
          await client.delete(`/api/v1/room/${ruid}/social/notice`);
        } catch (error: any) {
          let errorMessage = '';
          if (error.response.status === 404) {
            errorMessage = 'Failed to delete notice message.';
          } else {
            errorMessage = 'Unexpected error occured. Please try again.';
          }

          throw new Error(errorMessage);
        }
      },

      onSettled: (_data, _error, { ruid }) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.roomNoticeMessage(ruid) });
      },
    });
  },

  setDiscordWebhookConfig: () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async ({ ruid, config }: { ruid: string; config: DiscordWebhookConfig }) => {
        try {
          await client.post(`/api/v1/room/${ruid}/social/discord/webhook`, config);
        } catch (error: any) {
          let errorMessage = '';
          switch (error.response.status) {
            case 400: {
              errorMessage = 'Request body for Discord Webhook is invalid.';
              break;
            }
            case 401: {
              errorMessage = 'Insufficient permissions.';
              break;
            }
            case 404: {
              errorMessage = 'Room does not exist.';
              break;
            }
            default: {
              errorMessage = 'Unexpected error occured. Please try again.';
              break;
            }
          }

          throw new Error(errorMessage);
        }
      },

      onSettled: (_data, _error, { ruid }) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.roomDiscordWebhookConfig(ruid) });
      },
    });
  },

  sendBroadcastMessage: () => {
    return useMutation({
      mutationFn: async ({ ruid, message }: { ruid: string; message: string }) => {
        try {
          await client.post(`/api/v1/room/${ruid}/chat`, { message });
        } catch (error: any) {
          let errorMessage = '';
          switch (error.response.status) {
            case 400: {
              errorMessage = 'No message.';
              break;
            }
            case 401: {
              errorMessage = 'Insufficient permissions.';
              break;
            }
            case 404: {
              errorMessage = 'Room does not exist.';
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
