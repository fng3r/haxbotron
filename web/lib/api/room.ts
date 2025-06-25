import { AxiosError } from 'axios';

import { ReactHostRoomInfo } from '@/../core/lib/browser.hostconfig';
import getApiClient from '@/lib/api-client';
import {
  AllRoomListItem,
  DiscordWebhookConfig,
  RoomInfo,
  RoomInfoItem,
  RuidListItem,
  SetTeamColoursParams,
  TeamColoursResponse,
} from '@/lib/types/room';

export const getRoomsInfoList = async (): Promise<RoomInfoItem[]> => {
  const apiClient = getApiClient();
  const result = await apiClient.get('/api/v1/room');
  const roomList: string[] = result.data;

  return await Promise.all(
    roomList.map(async (ruid) => {
      const apiClient = getApiClient();
      const result = await apiClient.get(`/api/v1/room/${ruid}/info`);
      return {
        ruid: ruid,
        roomName: result.data.roomName,
        roomLink: result.data._link,
        onlinePlayers: result.data.onlinePlayers,
      };
    }),
  );
};

export const getAllRoomsList = async (): Promise<AllRoomListItem[]> => {
  const apiClient = getApiClient();
  const result = await apiClient.get('/api/v1/ruidlist');
  const allRuidList: RuidListItem[] = result.data;
  const onlineRoomList = await apiClient
    .get(`/api/v1/room`)
    .then((response: { data: string[] }) => {
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
    if (error instanceof AxiosError && error.response && error.response.status === 404) {
      return {
        ruid: ruid,
        isOnline: false,
      } as RoomInfo;
    } else {
      throw new Error('Unexpected error occured. Please try again.');
    }
  }
  throw new Error('Unexpected error occured. Please try again.');
};

export const getRoomFreezeStatus = async (ruid: string): Promise<boolean> => {
  try {
    const apiClient = getApiClient();
    const result = await apiClient.get(`/api/v1/room/${ruid}/info/freeze`);
    return result.data.freezed;
  } catch (error) {
    if (error instanceof AxiosError && error.response && error.response.status === 404) {
      throw new Error('Failed to load status of chat.');
    } else {
      throw new Error('Unexpected error occured. Please try again.');
    }
  }
};

export const getRoomNoticeMessage = async (ruid: string): Promise<string> => {
  try {
    const apiClient = getApiClient();
    const result = await apiClient.get(`/api/v1/room/${ruid}/social/notice`);
    return result.data.message;
  } catch (error) {
    let errorMessage = '';
    if (error instanceof AxiosError && error.response && error.response.status === 404) {
      errorMessage = 'Failed to load notice message.';
    } else {
      errorMessage = 'Unexpected error occured. Please try again.';
    }

    throw new Error(errorMessage);
  }
};

export const getRoomDiscordWebhookConfig = async (ruid: string): Promise<DiscordWebhookConfig> => {
  try {
    const apiClient = getApiClient();
    const result = await apiClient.get(`/api/v1/room/${ruid}/social/discord/webhook`);
    return result.data;
  } catch (error) {
    let errorMessage = '';
    if (error instanceof AxiosError && error.response && error.response.status === 404) {
      errorMessage = 'Failed to load Discord Webhook configuration.';
    } else {
      errorMessage = 'Unexpected error occurred. Please try again.';
    }

    throw new Error(errorMessage);
  }
};

export const createRoom = async (roomConfig: ReactHostRoomInfo): Promise<void> => {
  try {
    const apiClient = getApiClient();
    await apiClient.post(`/api/v1/room`, roomConfig);
  } catch (error) {
    let errorMessage = '';
    if (error instanceof AxiosError && error.response) {
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
    } else {
      errorMessage = 'Unexpected error occured. Please try again.';
    }

    throw new Error(errorMessage);
  }
};

export const shutdownRoom = async (ruid: string): Promise<void> => {
  try {
    const apiClient = getApiClient();
    await apiClient.delete(`/api/v1/room/${ruid}`);
  } catch (error) {
    let errorMessage = '';
    if (error instanceof AxiosError && error.response) {
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
    } else {
      errorMessage = 'Unexpected error occurred. Please try again.';
    }

    throw new Error(errorMessage);
  }
};

export const setNoticeMessage = async ({ ruid, message }: { ruid: string; message: string }): Promise<void> => {
  try {
    const apiClient = getApiClient();
    await apiClient.post(`/api/v1/room/${ruid}/social/notice`, { message });
  } catch (error) {
    let errorMessage = '';
    if (error instanceof AxiosError && error.response) {
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
    } else {
      errorMessage = 'Unexpected error occured. Please try again.';
    }

    throw new Error(errorMessage);
  }
};

export const deleteNoticeMessage = async ({ ruid }: { ruid: string }): Promise<void> => {
  try {
    const apiClient = getApiClient();
    await apiClient.delete(`/api/v1/room/${ruid}/social/notice`);
  } catch (error) {
    let errorMessage = '';
    if (error instanceof AxiosError && error.response && error.response.status === 404) {
      errorMessage = 'Failed to delete notice message.';
    } else {
      errorMessage = 'Unexpected error occured. Please try again.';
    }

    throw new Error(errorMessage);
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
    let errorMessage = '';
    if (error instanceof AxiosError && error.response) {
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
    } else {
      errorMessage = 'Unexpected error occured. Please try again.';
    }

    throw new Error(errorMessage);
  }
};

export const sendBroadcastMessage = async ({ ruid, message }: { ruid: string; message: string }): Promise<void> => {
  try {
    const apiClient = getApiClient();
    await apiClient.post(`/api/v1/room/${ruid}/chat`, { message });
  } catch (error) {
    let errorMessage = '';
    if (error instanceof AxiosError && error.response) {
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
    } else {
      errorMessage = 'Unexpected error occurred. Please try again.';
    }

    throw new Error(errorMessage);
  }
};

export const setPassword = async ({ ruid, password }: { ruid: string; password: string }): Promise<void> => {
  try {
    const apiClient = getApiClient();
    await apiClient.post(`/api/v1/room/${ruid}/info/password`, { password });
  } catch (error) {
    let errorMessage = '';
    if (error instanceof AxiosError && error.response) {
      switch (error.response.status) {
        case 400: {
          errorMessage = 'Invalid password format.';
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
          errorMessage = 'Failed to set password.';
          break;
        }
      }
    } else {
      errorMessage = 'Failed to set password.';
    }

    throw new Error(errorMessage);
  }
};

export const clearPassword = async ({ ruid }: { ruid: string }): Promise<void> => {
  try {
    const apiClient = getApiClient();
    await apiClient.delete(`/api/v1/room/${ruid}/info/password`);
  } catch (error) {
    let errorMessage = '';
    if (error instanceof AxiosError && error.response) {
      switch (error.response.status) {
        case 401: {
          errorMessage = 'Insufficient permissions.';
          break;
        }
        case 404: {
          errorMessage = 'Room does not exist.';
          break;
        }
        default: {
          errorMessage = 'Failed to clear password.';
          break;
        }
      }
    } else {
      errorMessage = 'Failed to clear password.';
    }

    throw new Error(errorMessage);
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
    let errorMessage = '';
    if (error instanceof AxiosError && error.response) {
      switch (error.response.status) {
        case 401: {
          errorMessage = 'Insufficient permissions.';
          break;
        }
        case 404: {
          errorMessage = 'Room does not exist.';
          break;
        }
        default: {
          errorMessage = 'Failed to toggle freeze status.';
          break;
        }
      }
    } else {
      errorMessage = 'Failed to toggle freeze status.';
    }

    throw new Error(errorMessage);
  }
};

export const getTeamColours = async (ruid: string): Promise<TeamColoursResponse> => {
  try {
    const apiClient = getApiClient();
    const result = await apiClient.get(`/api/v1/room/${ruid}/asset/team/colour`);
    return result.data;
  } catch (error) {
    let errorMessage = '';
    if (error instanceof AxiosError && error.response) {
      switch (error.response.status) {
        case 401: {
          errorMessage = 'Insufficient permissions.';
          break;
        }
        case 404: {
          errorMessage = 'Failed to load team colours.';
          break;
        }
        default: {
          errorMessage = 'Unexpected error occurred. Please try again.';
          break;
        }
      }
    } else {
      errorMessage = 'Unexpected error occurred. Please try again.';
    }

    throw new Error(errorMessage);
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
    const apiClient = getApiClient();
    await apiClient.post(`/api/v1/room/${ruid}/asset/team/colour`, {
      team,
      angle,
      textColour,
      teamColour1,
      teamColour2,
      teamColour3,
    });
  } catch (error) {
    let errorMessage = '';
    if (error instanceof AxiosError && error.response) {
      switch (error.response.status) {
        case 400: {
          errorMessage = 'Invalid team colour configuration.';
          break;
        }
        case 401: {
          errorMessage = 'Insufficient permissions.';
          break;
        }
        case 404: {
          errorMessage = 'Failed to set team colours.';
          break;
        }
        default: {
          errorMessage = 'Unexpected error occurred. Please try again.';
          break;
        }
      }
    } else {
      errorMessage = 'Unexpected error occurred. Please try again.';
    }

    throw new Error(errorMessage);
  }
};
