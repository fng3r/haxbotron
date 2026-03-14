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
    payload: RoomRpcPayload<C>;
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
    result: RoomRpcResult<C>;
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

type RoomRpcDefinition<Payload, Result> = {
    payloadSchema: Joi.Schema;
    resultSchema: Joi.Schema;
    __types?: {
        payload: Payload;
        result: Result;
    };
};

function defineRoomRpcCommand<Payload, Result>(
    payloadSchema: Joi.Schema,
    resultSchema: Joi.Schema
): RoomRpcDefinition<Payload, Result> {
    return {
        payloadSchema,
        resultSchema,
    };
}

export const roomRpcDefinitions = {
    openRoom: defineRoomRpcCommand<{ ruid: string; initConfig: RoomInitConfig }, void>(
        Joi.object({
            ruid: Joi.string().required(),
            initConfig: Joi.object<RoomInitConfig>().required(),
        }).required(),
        undefinedSchema
    ),
    closeRoom: defineRoomRpcCommand<undefined, void>(undefinedSchema, undefinedSchema),
    getRoomLink: defineRoomRpcCommand<undefined, string>(undefinedSchema, Joi.string().required()),
    getRoomInfo: defineRoomRpcCommand<undefined, RoomInfo>(undefinedSchema, roomInfoSchema),
    getRoomDetailInfo: defineRoomRpcCommand<undefined, RoomDetailInfo>(undefinedSchema, roomDetailInfoSchema),
    getOnlinePlayersIDList: defineRoomRpcCommand<undefined, number[]>(
        undefinedSchema,
        Joi.array().items(Joi.number().required()).required()
    ),
    checkOnlinePlayer: defineRoomRpcCommand<{ id: number }, boolean>(
        Joi.object({ id: Joi.number().required() }).required(),
        Joi.boolean().required()
    ),
    getPlayerInfo: defineRoomRpcCommand<{ id: number }, Player | undefined>(
        Joi.object({ id: Joi.number().required() }).required(),
        Joi.any()
    ),
    banPlayerTemporarily: defineRoomRpcCommand<{ id: number; ban: boolean; reason: string; seconds: number }, void>(
        Joi.object({
            id: Joi.number().required(),
            ban: Joi.boolean().required(),
            reason: Joi.string().required(),
            seconds: Joi.number().required(),
        }).required(),
        undefinedSchema
    ),
    broadcast: defineRoomRpcCommand<{ message: string }, void>(
        Joi.object({ message: Joi.string().required() }).required(),
        undefinedSchema
    ),
    whisper: defineRoomRpcCommand<{ id: number; message: string }, void>(
        Joi.object({
            id: Joi.number().required(),
            message: Joi.string().required(),
        }).required(),
        undefinedSchema
    ),
    getNotice: defineRoomRpcCommand<undefined, string | null>(
        undefinedSchema,
        Joi.alternatives(Joi.string(), Joi.valid(null)).required()
    ),
    setNotice: defineRoomRpcCommand<{ message: string }, void>(
        Joi.object({ message: Joi.string().required() }).required(),
        undefinedSchema
    ),
    setPassword: defineRoomRpcCommand<{ password: string }, void>(
        Joi.object({ password: Joi.string().required() }).required(),
        undefinedSchema
    ),
    getChatFreeze: defineRoomRpcCommand<undefined, boolean>(undefinedSchema, Joi.boolean().required()),
    setChatFreeze: defineRoomRpcCommand<{ freeze: boolean }, void>(
        Joi.object({ freeze: Joi.boolean().required() }).required(),
        undefinedSchema
    ),
    setPlayerMute: defineRoomRpcCommand<{ id: number; muteExpireTime: number }, void>(
        Joi.object({
            id: Joi.number().required(),
            muteExpireTime: Joi.number().required(),
        }).required(),
        undefinedSchema
    ),
    setPlayerUnmute: defineRoomRpcCommand<{ id: number }, void>(
        Joi.object({ id: Joi.number().required() }).required(),
        undefinedSchema
    ),
    getTeamColours: defineRoomRpcCommand<{ team: TeamID }, TeamColourInfo>(
        Joi.object({ team: teamIdSchema.required() }).required(),
        teamColourInfoSchema
    ),
    setTeamColours: defineRoomRpcCommand<{
        team: TeamID;
        angle: number;
        textColour: number;
        teamColour1: number;
        teamColour2: number;
        teamColour3: number;
    }, void>(
        Joi.object({
            team: teamIdSchema.required(),
            angle: Joi.number().required(),
            textColour: Joi.number().required(),
            teamColour1: Joi.number().required(),
            teamColour2: Joi.number().required(),
            teamColour3: Joi.number().required(),
        }).required(),
        undefinedSchema
    ),
    getDiscordWebhookConfig: defineRoomRpcCommand<undefined, DiscordWebhookConfig>(
        undefinedSchema,
        discordWebhookConfigSchema
    ),
    setDiscordWebhookConfig: defineRoomRpcCommand<{ config: DiscordWebhookConfig }, void>(
        Joi.object({ config: discordWebhookConfigSchema }).required(),
        undefinedSchema
    ),
};

export type RoomRpcContract = {
    [C in keyof typeof roomRpcDefinitions]: typeof roomRpcDefinitions[C] extends RoomRpcDefinition<
        infer Payload,
        infer Result
    >
        ? {
              payload: Payload;
              result: Result;
          }
        : never;
};

export type RoomRpcCommand = keyof typeof roomRpcDefinitions;
export type RuntimeRoomRpcCommand = Exclude<RoomRpcCommand, "openRoom">;
export type RoomRpcPayload<C extends RoomRpcCommand> = RoomRpcContract[C]["payload"];
export type RoomRpcResult<C extends RoomRpcCommand> = RoomRpcContract[C]["result"];

const roomRpcCommands = Object.keys(roomRpcDefinitions) as RoomRpcCommand[];

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

    const payloadValidation = validate(
        roomRpcDefinitions[envelopeValidation.value.command].payloadSchema,
        envelopeValidation.value.payload
    );
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
        const resultValidation = validate(roomRpcDefinitions[response.command].resultSchema, response.result);
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
