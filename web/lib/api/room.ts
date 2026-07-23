import { AxiosError } from 'axios';

import type { ReactHostRoomInfo } from '@/../core/src/lib/room/RoomHostConfig';
import { getAllRoomsListAction, getRoomsInfoListAction } from '@/lib/actions/control';
import getApiClient from '@/lib/api-client';
import {
  AllRoomListItem,
  DiscordWebhookConfig,
  RoomInfo,
  RoomInfoItem,
  SetTeamColoursParams,
  TeamColoursResponse,
  PersistedRoomConfig,
} from '@/lib/types/room';

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data;
    if (data?.error?.message) return data.error.message;
    if (data?.message) return data.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export const getRoomsInfoList = async (): Promise<RoomInfoItem[]> => {
  return await getRoomsInfoListAction();
};

export const getAllRoomsList = async (): Promise<AllRoomListItem[]> => {
  return await getAllRoomsListAction();
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

export const getRoomConfigs = async (): Promise<PersistedRoomConfig[]> => {
  try {
    return (await getApiClient().get('/api/v1/room-configs')).data;
  } catch (error) {
    throw new Error(toErrorMessage(error, 'Failed to load room configurations.'));
  }
};

export const saveRoomConfig = async (config: ReactHostRoomInfo): Promise<PersistedRoomConfig> => {
  try {
    return (await getApiClient().put(`/api/v1/room-configs/${encodeURIComponent(config.ruid)}`, config)).data;
  } catch (error) {
    throw new Error(toErrorMessage(error, 'Failed to save room configuration.'));
  }
};

export const deleteRoomConfig = async (ruid: string): Promise<void> => {
  try {
    await getApiClient().delete(`/api/v1/room-configs/${encodeURIComponent(ruid)}`);
  } catch (error) {
    throw new Error(toErrorMessage(error, 'Failed to delete room configuration.'));
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

export const relaunchRoom = async (config: ReactHostRoomInfo): Promise<void> => {
  try {
    await getApiClient().post(`/api/v1/room/${encodeURIComponent(config.ruid)}/relaunch`, config);
  } catch (error) {
    throw new Error(toErrorMessage(error, 'Failed to relaunch room.'));
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
