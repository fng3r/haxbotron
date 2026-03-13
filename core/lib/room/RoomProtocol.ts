import { Player } from "../../game/model/GameObject/Player";
import { TeamID } from "../../game/model/GameObject/TeamID";
import { RoomInitConfig } from "../room.hostconfig";
import { DiscordWebhookConfig } from "../room.interface";

export interface RoomInfo {
    roomName: string;
    onlinePlayers: number;
}

export interface RoomDetailInfo extends RoomInfo {
    adminPassword: string;
    link: string;
    _roomConfig: any;
    botSettings: any;
    rules: any;
}

export interface TeamColourInfo {
    angle: number;
    textColour: number;
    teamColour1: number;
    teamColour2: number;
    teamColour3: number;
}

export type RoomRpcCommandMap = {
    openRoom: { ruid: string; initConfig: RoomInitConfig };
    closeRoom: undefined;
    getRoomLink: undefined;
    getRoomInfo: undefined;
    getRoomDetailInfo: undefined;
    getOnlinePlayersIDList: undefined;
    checkOnlinePlayer: { id: number };
    getPlayerInfo: { id: number };
    banPlayerTemporarily: { id: number; ban: boolean; reason: string; seconds: number };
    broadcast: { message: string };
    whisper: { id: number; message: string };
    getNotice: undefined;
    setNotice: { message: string };
    setPassword: { password: string };
    getChatFreeze: undefined;
    setChatFreeze: { freeze: boolean };
    setPlayerMute: { id: number; muteExpireTime: number };
    setPlayerUnmute: { id: number };
    getTeamColours: { team: TeamID };
    setTeamColours: {
        team: TeamID;
        angle: number;
        textColour: number;
        teamColour1: number;
        teamColour2: number;
        teamColour3: number;
    };
    getDiscordWebhookConfig: undefined;
    setDiscordWebhookConfig: { config: DiscordWebhookConfig };
};

export type RoomRpcResultMap = {
    openRoom: void;
    closeRoom: void;
    getRoomLink: string;
    getRoomInfo: RoomInfo;
    getRoomDetailInfo: RoomDetailInfo;
    getOnlinePlayersIDList: number[];
    checkOnlinePlayer: boolean;
    getPlayerInfo: Player | undefined;
    banPlayerTemporarily: void;
    broadcast: void;
    whisper: void;
    getNotice: string | null;
    setNotice: void;
    setPassword: void;
    getChatFreeze: boolean;
    setChatFreeze: void;
    setPlayerMute: void;
    setPlayerUnmute: void;
    getTeamColours: TeamColourInfo;
    setTeamColours: void;
    getDiscordWebhookConfig: DiscordWebhookConfig;
    setDiscordWebhookConfig: void;
};

export type RoomRpcCommand = keyof RoomRpcCommandMap;
export type RuntimeRoomRpcCommand = Exclude<RoomRpcCommand, "openRoom">;

export type RoomWorkerEvent =
    | {
          type: "event";
          event: "roomReady";
          payload: { link: string };
      }
    | {
          type: "event";
          event: "log";
          payload: { origin: string; level: "info" | "error" | "warn"; message: string; timestamp: number };
      }
    | {
          type: "event";
          event: "joinleft";
          payload: { playerID: number };
      }
    | {
          type: "event";
          event: "statuschange";
          payload: { playerID: number };
      };

export type RoomRpcRequest<C extends RoomRpcCommand = RoomRpcCommand> = {
    type: "request";
    requestId: string;
    command: C;
    payload: RoomRpcCommandMap[C];
};

export type AnyRoomRpcRequest = {
    [C in RoomRpcCommand]: RoomRpcRequest<C>;
}[RoomRpcCommand];

export type RuntimeRoomRpcRequest<C extends RuntimeRoomRpcCommand = RuntimeRoomRpcCommand> = RoomRpcRequest<C>;

export type AnyRuntimeRoomRpcRequest = {
    [C in RuntimeRoomRpcCommand]: RuntimeRoomRpcRequest<C>;
}[RuntimeRoomRpcCommand];

export type RoomRpcSuccessResponse<C extends RoomRpcCommand = RoomRpcCommand> = {
    type: "response";
    requestId: string;
    command: C;
    success: true;
    result: RoomRpcResultMap[C];
};

export type RoomRpcErrorResponse<C extends RoomRpcCommand = RoomRpcCommand> = {
    type: "response";
    requestId: string;
    command: C;
    success: false;
    error: {
        message: string;
        code?: string;
    };
};

export type RoomRpcResponse<C extends RoomRpcCommand = RoomRpcCommand> =
    | RoomRpcSuccessResponse<C>
    | RoomRpcErrorResponse<C>;

export type AnyRoomRpcResponse = {
    [C in RoomRpcCommand]: RoomRpcResponse<C>;
}[RoomRpcCommand];

export type RoomWorkerMessage = AnyRoomRpcResponse | RoomWorkerEvent;

export function isRoomRpcRequest(message: unknown): message is AnyRoomRpcRequest {
    if (!message || typeof message !== "object") {
        return false;
    }

    return "type" in message && message.type === "request" && "requestId" in message && "command" in message;
}

export function isRoomRpcResponseForCommand<C extends RoomRpcCommand>(
    response: AnyRoomRpcResponse,
    command: C
): response is Extract<AnyRoomRpcResponse, { command: C }> {
    return response.command === command;
}
