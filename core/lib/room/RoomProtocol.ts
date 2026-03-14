import Joi from "joi";
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

type ValidationResult<T> =
    | {
          success: true;
          value: T;
      }
    | {
          success: false;
          error: string;
      };

const roomRpcCommands: RoomRpcCommand[] = [
    "openRoom",
    "closeRoom",
    "getRoomLink",
    "getRoomInfo",
    "getRoomDetailInfo",
    "getOnlinePlayersIDList",
    "checkOnlinePlayer",
    "getPlayerInfo",
    "banPlayerTemporarily",
    "broadcast",
    "whisper",
    "getNotice",
    "setNotice",
    "setPassword",
    "getChatFreeze",
    "setChatFreeze",
    "setPlayerMute",
    "setPlayerUnmute",
    "getTeamColours",
    "setTeamColours",
    "getDiscordWebhookConfig",
    "setDiscordWebhookConfig",
];

const roomWorkerEvents: RoomWorkerEvent["event"][] = ["roomReady", "log", "joinleft", "statuschange"];

const undefinedSchema = Joi.any().custom((value, helpers) => {
    if (value !== undefined) {
        return helpers.error("any.invalid");
    }

    return value;
}, "undefined value");

const teamIdSchema = Joi.number()
    .valid(TeamID.Spec, TeamID.Red, TeamID.Blue);

const discordWebhookConfigSchema = Joi.object<DiscordWebhookConfig>({
    feed: Joi.boolean().required(),
    replayUpload: Joi.boolean().required(),
    replaysWebhookId: Joi.string().required(),
    replaysWebhookToken: Joi.string().required(),
    passwordWebhookId: Joi.string().required(),
    passwordWebhookToken: Joi.string().required(),
}).required();

const teamColourInfoSchema = Joi.object<TeamColourInfo>({
    angle: Joi.number().required(),
    textColour: Joi.number().required(),
    teamColour1: Joi.number().required(),
    teamColour2: Joi.number().required(),
    teamColour3: Joi.number().required(),
}).required();

const roomInfoSchema = Joi.object<RoomInfo>({
    roomName: Joi.string().required(),
    onlinePlayers: Joi.number().required(),
}).required();

const roomDetailInfoSchema = Joi.object<RoomDetailInfo>({
    roomName: Joi.string().required(),
    onlinePlayers: Joi.number().required(),
    adminPassword: Joi.string().required(),
    link: Joi.string().required(),
    _roomConfig: Joi.any().required(),
    botSettings: Joi.any().required(),
    rules: Joi.any().required(),
}).required();

const requestPayloadSchemas: { [C in RoomRpcCommand]: Joi.Schema } = {
    openRoom: Joi.object({
        ruid: Joi.string().required(),
        initConfig: Joi.object<RoomInitConfig>().required(),
    }).required(),
    closeRoom: undefinedSchema,
    getRoomLink: undefinedSchema,
    getRoomInfo: undefinedSchema,
    getRoomDetailInfo: undefinedSchema,
    getOnlinePlayersIDList: undefinedSchema,
    checkOnlinePlayer: Joi.object({ id: Joi.number().required() }).required(),
    getPlayerInfo: Joi.object({ id: Joi.number().required() }).required(),
    banPlayerTemporarily: Joi.object({
        id: Joi.number().required(),
        ban: Joi.boolean().required(),
        reason: Joi.string().required(),
        seconds: Joi.number().required(),
    }).required(),
    broadcast: Joi.object({ message: Joi.string().required() }).required(),
    whisper: Joi.object({
        id: Joi.number().required(),
        message: Joi.string().required(),
    }).required(),
    getNotice: undefinedSchema,
    setNotice: Joi.object({ message: Joi.string().required() }).required(),
    setPassword: Joi.object({ password: Joi.string().required() }).required(),
    getChatFreeze: undefinedSchema,
    setChatFreeze: Joi.object({ freeze: Joi.boolean().required() }).required(),
    setPlayerMute: Joi.object({
        id: Joi.number().required(),
        muteExpireTime: Joi.number().required(),
    }).required(),
    setPlayerUnmute: Joi.object({ id: Joi.number().required() }).required(),
    getTeamColours: Joi.object({ team: teamIdSchema.required() }).required(),
    setTeamColours: Joi.object({
        team: teamIdSchema.required(),
        angle: Joi.number().required(),
        textColour: Joi.number().required(),
        teamColour1: Joi.number().required(),
        teamColour2: Joi.number().required(),
        teamColour3: Joi.number().required(),
    }).required(),
    getDiscordWebhookConfig: undefinedSchema,
    setDiscordWebhookConfig: Joi.object({ config: discordWebhookConfigSchema }).required(),
};

const responseResultSchemas: { [C in RoomRpcCommand]: Joi.Schema } = {
    openRoom: undefinedSchema,
    closeRoom: undefinedSchema,
    getRoomLink: Joi.string().required(),
    getRoomInfo: roomInfoSchema,
    getRoomDetailInfo: roomDetailInfoSchema,
    getOnlinePlayersIDList: Joi.array().items(Joi.number().required()).required(),
    checkOnlinePlayer: Joi.boolean().required(),
    getPlayerInfo: Joi.any(),
    banPlayerTemporarily: undefinedSchema,
    broadcast: undefinedSchema,
    whisper: undefinedSchema,
    getNotice: Joi.alternatives(Joi.string(), Joi.valid(null)).required(),
    setNotice: undefinedSchema,
    setPassword: undefinedSchema,
    getChatFreeze: Joi.boolean().required(),
    setChatFreeze: undefinedSchema,
    setPlayerMute: undefinedSchema,
    setPlayerUnmute: undefinedSchema,
    getTeamColours: teamColourInfoSchema,
    setTeamColours: undefinedSchema,
    getDiscordWebhookConfig: discordWebhookConfigSchema,
    setDiscordWebhookConfig: undefinedSchema,
};

const eventPayloadSchemas: Record<RoomWorkerEvent["event"], Joi.Schema> = {
    roomReady: Joi.object({
        link: Joi.string().required(),
    }).required(),
    log: Joi.object({
        origin: Joi.string().required(),
        level: Joi.string().valid("info", "error", "warn").required(),
        message: Joi.string().required(),
        timestamp: Joi.number().required(),
    }).required(),
    joinleft: Joi.object({
        playerID: Joi.number().required(),
    }).required(),
    statuschange: Joi.object({
        playerID: Joi.number().required(),
    }).required(),
};

const requestEnvelopeSchema = Joi.object({
    type: Joi.string().valid("request").required(),
    requestId: Joi.string().required(),
    command: Joi.string()
        .valid(...roomRpcCommands)
        .required(),
    payload: Joi.any(),
}).required();

const responseEnvelopeSchema = Joi.object({
    type: Joi.string().valid("response").required(),
    requestId: Joi.string().required(),
    command: Joi.string()
        .valid(...roomRpcCommands)
        .required(),
    success: Joi.boolean().required(),
    result: Joi.any(),
    error: Joi.object({
        message: Joi.string().required(),
        code: Joi.string().optional(),
    }),
}).required();

const eventEnvelopeSchema = Joi.object({
    type: Joi.string().valid("event").required(),
    event: Joi.string()
        .valid(...roomWorkerEvents)
        .required(),
    payload: Joi.any().required(),
}).required();

function validate<T>(schema: Joi.Schema, value: unknown): ValidationResult<T> {
    const { error, value: parsedValue } = schema.validate(value);

    if (error) {
        return {
            success: false,
            error: error.message,
        };
    }

    return {
        success: true,
        value: parsedValue as T,
    };
}

export function parseRoomRpcRequest(message: unknown): ValidationResult<AnyRoomRpcRequest> {
    const envelopeValidation = validate<{
        type: "request";
        requestId: string;
        command: RoomRpcCommand;
        payload: unknown;
    }>(requestEnvelopeSchema, message);

    if (!envelopeValidation.success) {
        return envelopeValidation;
    }

    const payloadValidation = validate(requestPayloadSchemas[envelopeValidation.value.command], envelopeValidation.value.payload);
    if (!payloadValidation.success) {
        return {
            success: false,
            error: `Invalid payload for '${envelopeValidation.value.command}': ${payloadValidation.error}`,
        };
    }

    return {
        success: true,
        value: {
            ...envelopeValidation.value,
            payload: payloadValidation.value,
        } as AnyRoomRpcRequest,
    };
}

export function parseRoomWorkerMessage(message: unknown): ValidationResult<RoomWorkerMessage> {
    if (!message || typeof message !== "object" || !("type" in message)) {
        return {
            success: false,
            error: "Message must be an object with a type field",
        };
    }

    if (message.type === "event") {
        const eventValidation = validate<{
            type: "event";
            event: RoomWorkerEvent["event"];
            payload: unknown;
        }>(eventEnvelopeSchema, message);
        if (!eventValidation.success) {
            return eventValidation;
        }

        const payloadValidation = validate(eventPayloadSchemas[eventValidation.value.event], eventValidation.value.payload);
        if (!payloadValidation.success) {
            return {
                success: false,
                error: `Invalid event payload for '${eventValidation.value.event}': ${payloadValidation.error}`,
            };
        }

        return {
            success: true,
            value: {
                ...eventValidation.value,
                payload: payloadValidation.value,
            } as RoomWorkerEvent,
        };
    }

    const responseValidation = validate<{
        type: "response";
        requestId: string;
        command: RoomRpcCommand;
        success: boolean;
        result?: unknown;
        error?: { message: string; code?: string };
    }>(responseEnvelopeSchema, message);
    if (!responseValidation.success) {
        return responseValidation;
    }

    const response = responseValidation.value;
    if (response.success) {
        const resultValidation = validate(responseResultSchemas[response.command], response.result);
        if (!resultValidation.success) {
            return {
                success: false,
                error: `Invalid response result for '${response.command}': ${resultValidation.error}`,
            };
        }

        return {
            success: true,
            value: {
                type: "response",
                requestId: response.requestId,
                command: response.command,
                success: true,
                result: resultValidation.value,
            } as AnyRoomRpcResponse,
        };
    }

    if (!response.error) {
        return {
            success: false,
            error: `Error response for '${response.command}' is missing error payload`,
        };
    }

    return {
        success: true,
        value: {
            type: "response",
            requestId: response.requestId,
            command: response.command,
            success: false,
            error: response.error,
        } as AnyRoomRpcResponse,
    };
}

export function isRoomRpcRequest(message: unknown): message is AnyRoomRpcRequest {
    return parseRoomRpcRequest(message).success;
}

export function isRoomRpcResponseForCommand<C extends RoomRpcCommand>(
    response: AnyRoomRpcResponse,
    command: C
): response is Extract<AnyRoomRpcResponse, { command: C }> {
    return response.command === command;
}
