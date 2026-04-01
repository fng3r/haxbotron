import { AxiosError } from 'axios';

import { ReactHostRoomInfo } from '@/../core/lib/room/RoomHostConfig';
import getApiClient from '@/lib/api-client';
import {
  AllRoomListItem,
  DiscordWebhookConfig,
  RoomInfo,
  RoomInfoItem,
  SetTeamColoursParams,
  TeamColoursResponse,
} from '@/lib/types/room';

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError && error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export const getRoomsInfoList = async (): Promise<RoomInfoItem[]> => {
  const apiClient = getApiClient();
  const result = await apiClient.get('/api/v1/control/rooms');
  return (result.data as Array<{
    ruid: string;
    roomName?: string;
    roomLink?: string;
    onlinePlayers?: number;
    hostId?: string;
    hostName?: string;
    online: boolean;
  }>)
    .filter((room) => room.online)
    .map((room) => ({
      ruid: room.ruid,
      roomName: room.roomName || room.ruid,
      roomLink: room.roomLink || '',
      onlinePlayers: room.onlinePlayers || 0,
      hostId: room.hostId,
      hostName: room.hostName,
    }));
};

export const getAllRoomsList = async (): Promise<AllRoomListItem[]> => {
  const apiClient = getApiClient();
  const result = await apiClient.get('/api/v1/control/rooms');
  return result.data.map((room: { ruid: string; online: boolean; hostId?: string; hostName?: string }) => ({
    ruid: room.ruid,
    online: room.online,
    hostId: room.hostId,
    hostName: room.hostName,
  }));
};

export const getRoomInfo = async (ruid: string): Promise<RoomInfo> => {
  try {
    const apiClient = getApiClient();
    const result = await apiClient.get(`/api/v1/room/${ruid}/info`);

    return {
      isOnline: true,
      ...result.data,
    };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 404) {
      return {
        ruid,
        isOnline: false,
      } as RoomInfo;
    }
    throw new Error(toErrorMessage(error, 'Unexpected error occured. Please try again.'));
  }
};

export const getRoomFreezeStatus = async (ruid: string): Promise<boolean> => {
  try {
    const apiClient = getApiClient();
    const result = await apiClient.get(`/api/v1/room/${ruid}/info/freeze`);
    return result.data.freezed;
  } catch (error) {
    throw new Error(toErrorMessage(error, 'Failed to load status of chat.'));
  }
};

export const getRoomNoticeMessage = async (ruid: string): Promise<string> => {
  try {
    const apiClient = getApiClient();
    const result = await apiClient.get(`/api/v1/room/${ruid}/social/notice`);
    return result.data.message;
  } catch (error) {
    throw new Error(toErrorMessage(error, 'Failed to load notice message.'));
  }
};

export const getRoomDiscordWebhookConfig = async (ruid: string): Promise<DiscordWebhookConfig> => {
  try {
    const apiClient = getApiClient();
    const result = await apiClient.get(`/api/v1/room/${ruid}/social/discord/webhook`);
    return result.data;
  } catch (error) {
    throw new Error(toErrorMessage(error, 'Failed to load Discord Webhook configuration.'));
  }
};

export const createRoom = async (roomConfig: ReactHostRoomInfo): Promise<void> => {
  try {
    const apiClient = getApiClient();
    await apiClient.post(`/api/v1/room`, roomConfig);
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      switch (error.response.status) {
        case 400:
          throw new Error(toErrorMessage(error, 'Configuration schema is unfulfilled.'));
        case 409:
          throw new Error('Room with the same RUID is already running.');
        case 503:
          throw new Error(toErrorMessage(error, 'Assigned host is unavailable.'));
        default:
          throw new Error(toErrorMessage(error, 'Unexpected error occured. Please try again.'));
      }
    }
    throw new Error(toErrorMessage(error, 'Unexpected error occured. Please try again.'));
  }
};

export const shutdownRoom = async (ruid: string): Promise<void> => {
  try {
    const apiClient = getApiClient();
    await apiClient.delete(`/api/v1/room/${ruid}`);
  } catch (error) {
    throw new Error(toErrorMessage(error, 'Unexpected error occurred. Please try again.'));
  }
};

export const setNoticeMessage = async ({ ruid, message }: { ruid: string; message: string }): Promise<void> => {
  try {
    const apiClient = getApiClient();
    await apiClient.post(`/api/v1/room/${ruid}/social/notice`, { message });
  } catch (error) {
    throw new Error(toErrorMessage(error, 'Unexpected error occured. Please try again.'));
  }
};

export const deleteNoticeMessage = async ({ ruid }: { ruid: string }): Promise<void> => {
  try {
    const apiClient = getApiClient();
    await apiClient.delete(`/api/v1/room/${ruid}/social/notice`);
  } catch (error) {
    throw new Error(toErrorMessage(error, 'Failed to delete notice message.'));
  }
};

export const setDiscordWebhookConfig = async ({
  ruid,
  config,
}: {
  ruid: string;
  config: DiscordWebhookConfig;
}): Promise<void> => {
  try {
    const apiClient = getApiClient();
    await apiClient.post(`/api/v1/room/${ruid}/social/discord/webhook`, config);
  } catch (error) {
    throw new Error(toErrorMessage(error, 'Unexpected error occured. Please try again.'));
  }
};

export const sendBroadcastMessage = async ({ ruid, message }: { ruid: string; message: string }): Promise<void> => {
  try {
    const apiClient = getApiClient();
    await apiClient.post(`/api/v1/room/${ruid}/chat`, { message });
  } catch (error) {
    throw new Error(toErrorMessage(error, 'Unexpected error occurred. Please try again.'));
  }
};

export const setPassword = async ({ ruid, password }: { ruid: string; password: string }): Promise<void> => {
  try {
    const apiClient = getApiClient();
    await apiClient.post(`/api/v1/room/${ruid}/info/password`, { password });
  } catch (error) {
    throw new Error(toErrorMessage(error, 'Failed to set password.'));
  }
};

export const clearPassword = async ({ ruid }: { ruid: string }): Promise<void> => {
  try {
    const apiClient = getApiClient();
    await apiClient.delete(`/api/v1/room/${ruid}/info/password`);
  } catch (error) {
    throw new Error(toErrorMessage(error, 'Failed to clear password.'));
  }
};

export const toggleFreeze = async ({ ruid, freezeStatus }: { ruid: string; freezeStatus: boolean }): Promise<void> => {
  try {
    const apiClient = getApiClient();
    if (freezeStatus) {
      await apiClient.delete(`/api/v1/room/${ruid}/info/freeze`);
    } else {
      await apiClient.post(`/api/v1/room/${ruid}/info/freeze`);
    }
  } catch (error) {
    throw new Error(toErrorMessage(error, 'Failed to toggle freeze status.'));
  }
};

export const getTeamColours = async (ruid: string): Promise<TeamColoursResponse> => {
  try {
    const apiClient = getApiClient();
    const result = await apiClient.get(`/api/v1/room/${ruid}/asset/team/colour`);
    return result.data;
  } catch (error) {
    throw new Error(toErrorMessage(error, 'Failed to load team colours.'));
  }
};

export const setTeamColours = async ({
  ruid,
  team,
  angle,
  textColour,
  teamColour1,
  teamColour2,
  teamColour3,
}: SetTeamColoursParams): Promise<void> => {
  try {
    const payload = {
      team,
      angle,
      textColour,
      teamColour1,
      teamColour2,
      teamColour3,
    };
    const apiClient = getApiClient();
    await apiClient.post(`/api/v1/room/${ruid}/asset/team/colour`, payload);
  } catch (error) {
    throw new Error(toErrorMessage(error, 'Unexpected error occurred. Please try again.'));
  }
};
