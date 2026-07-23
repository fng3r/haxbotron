import { Context } from "koa";
import { Player } from "../../../game/model/GameObject/Player.js";
import { TeamID } from "../../../game/model/GameObject/TeamID.js";
import { apiDbAdapter } from "../../../lib/db/adapters/ApiDbAdapter.js";
import { ConflictError, PlayerNotFoundError, RoomNotFoundError, ValidationError } from "../../../lib/errors.js";
import { RoomOperationsAPI } from "../../../lib/room/index.js";
import { RoomInitConfig } from "../../../lib/room/RoomHostConfig.js";
import { formatJoiError } from "../../middleware/errorHandler.js";
import { discordWebhookConfigSchema } from "../../schema/discordwebhook.validation.js";
import { nestedHostRoomConfigSchema } from "../../schema/hostroomconfig.validation.js";
import { teamColourSchema } from "../../schema/teamcolour.validation.js";
import { getRequestBody } from "../requestBody.js";

interface KickPlayerBody {
    ban: boolean;
    seconds: number;
    reason?: string;
}

interface MessageBody {
    message: string;
}

interface PasswordBody {
    password: string;
}

interface MutePlayerBody {
    muteExpire: number;
}

export type RoomController = ReturnType<typeof createRoomController>;

export function createRoomController(roomOperations: RoomOperationsAPI) {
    const ensureRoomExists = (ruid: string): void => {
        if (!roomOperations.checkExistRoom(ruid)) {
            throw new RoomNotFoundError(ruid);
        }
    };

    const ensurePlayerExists = async (ruid: string, id: string): Promise<number> => {
        const playerId = parseInt(id);
        if (!(await roomOperations.checkOnlinePlayer(ruid, playerId))) {
            throw new PlayerNotFoundError(id);
        }
        return playerId;
    };

    return {
        async createRoom(ctx: Context) {
            const validationResult = nestedHostRoomConfigSchema.validate(ctx.request.body);

            if (validationResult.error) {
                const formatted = formatJoiError(validationResult.error);
                throw new ValidationError(formatted.message, formatted.details);
            }

            const body = validationResult.value;

            const newRoomConfig: RoomInitConfig = {
                _LaunchDate: new Date(),
                _RUID: body.ruid,
                _config: body._config,
                settings: body.settings,
                rules: body.rules,
                discordWebhook: body.discordWebhook,
            };

            if (newRoomConfig._config.password == "") {
                newRoomConfig._config.password = undefined;
            }

            if (roomOperations.checkExistRoom(newRoomConfig._RUID)) {
                throw new ConflictError(`Room with RUID '${newRoomConfig._RUID}' already exists`);
            }

            await apiDbAdapter.saveRoomConfig(body);
            await roomOperations.openNewRoom(newRoomConfig._RUID, newRoomConfig);
            ctx.status = 201;
        },

        async terminateRoom(ctx: Context) {
            const { ruid } = ctx.params;
            ensureRoomExists(ruid);
            await roomOperations.closeRoom(ruid);
            ctx.status = 204;
        },

        getRoomList(ctx: Context) {
            ctx.status = 200;
            ctx.body = roomOperations.getExistRoomList();
        },

        async getRoomInfo(ctx: Context) {
            const { ruid } = ctx.params;
            ensureRoomExists(ruid);
            ctx.status = 200;
            ctx.body = await roomOperations.getRoomInfo(ruid);
        },

        async getRoomDetailInfo(ctx: Context) {
            const { ruid } = ctx.params;
            ensureRoomExists(ruid);
            ctx.status = 200;
            ctx.body = await roomOperations.getRoomDetailInfo(ruid);
        },

        async getPlayersList(ctx: Context) {
            const { ruid } = ctx.params;
            ensureRoomExists(ruid);
            const list = await roomOperations.getOnlinePlayersIDList(ruid);
            ctx.status = 200;
            ctx.body = list;
        },

        async getPlayerInfo(ctx: Context) {
            const { ruid, id } = ctx.params;
            ensureRoomExists(ruid);
            const player = await roomOperations.getPlayerInfo(ruid, parseInt(id));
            if (player === undefined) {
                throw new PlayerNotFoundError(id);
            }
            ctx.status = 200;
            ctx.body = player;
        },

        async kickOnlinePlayer(ctx: Context) {
            const { ruid, id } = ctx.params;
            const { ban, seconds, reason } = getRequestBody<KickPlayerBody>(ctx);
            if (ban === undefined || !seconds) {
                throw new ValidationError("Missing required fields: ban and seconds");
            }

            ensureRoomExists(ruid);
            const playerId = await ensurePlayerExists(ruid, id);
            await roomOperations.banPlayerTemporarily(ruid, playerId, ban, reason ?? "", seconds);
            ctx.status = 204;
        },

        async broadcast(ctx: Context) {
            const { ruid } = ctx.params;
            const { message } = getRequestBody<MessageBody>(ctx);
            ensureRoomExists(ruid);
            if (!message) {
                throw new ValidationError("Message is required");
            }
            await roomOperations.broadcast(ruid, message);
            ctx.status = 201;
        },

        async whisper(ctx: Context) {
            const { ruid, id } = ctx.params;
            const { message } = getRequestBody<MessageBody>(ctx);
            ensureRoomExists(ruid);
            const playerID = await ensurePlayerExists(ruid, id);
            if (!message) {
                throw new ValidationError("Message is required");
            }
            await roomOperations.whisper(ruid, playerID, message);
            ctx.status = 201;
        },

        async setNotice(ctx: Context) {
            const { ruid } = ctx.params;
            const { message } = getRequestBody<MessageBody>(ctx);
            ensureRoomExists(ruid);
            if (!message) {
                throw new ValidationError("Message is required");
            }
            await roomOperations.setNotice(ruid, message);
            ctx.status = 201;
        },

        async getNotice(ctx: Context) {
            const { ruid } = ctx.params;
            ensureRoomExists(ruid);
            const message = await roomOperations.getNotice(ruid);
            ctx.body = { message };
            ctx.status = 200;
        },

        async deleteNotice(ctx: Context) {
            const { ruid } = ctx.params;
            ensureRoomExists(ruid);
            await roomOperations.setNotice(ruid, "");
            ctx.status = 204;
        },

        async setPassword(ctx: Context) {
            const { ruid } = ctx.params;
            const { password } = getRequestBody<PasswordBody>(ctx);

            if (!password) {
                throw new ValidationError("Password is required");
            }

            ensureRoomExists(ruid);
            await roomOperations.setPassword(ruid, password);
            ctx.status = 201;
        },

        async clearPassword(ctx: Context) {
            const { ruid } = ctx.params;
            ensureRoomExists(ruid);
            await roomOperations.setPassword(ruid, "");
            ctx.status = 204;
        },

        async checkPlayerMuted(ctx: Context) {
            const { ruid, id } = ctx.params;
            ensureRoomExists(ruid);
            const player: Player | undefined = await roomOperations.getPlayerInfo(ruid, parseInt(id));
            if (player === undefined) {
                throw new PlayerNotFoundError(id);
            }
            ctx.status = 200;
            ctx.body = {
                mute: player.permissions.mute,
                muteExpire: player.permissions.muteExpire,
            };
        },

        async mutePlayer(ctx: Context) {
            const { ruid, id } = ctx.params;
            const { muteExpire } = getRequestBody<MutePlayerBody>(ctx);
            if (!muteExpire) {
                throw new ValidationError("muteExpire is required");
            }

            ensureRoomExists(ruid);
            await roomOperations.setPlayerMute(ruid, parseInt(id), muteExpire);
            ctx.status = 201;
        },

        async unmutePlayer(ctx: Context) {
            const { ruid, id } = ctx.params;
            ensureRoomExists(ruid);
            await roomOperations.setPlayerUnmute(ruid, parseInt(id));
            ctx.status = 204;
        },

        async checkChatFreezed(ctx: Context) {
            const { ruid } = ctx.params;
            ensureRoomExists(ruid);
            ctx.status = 200;
            ctx.body = {
                freezed: await roomOperations.getChatFreeze(ruid),
            };
        },

        async freezeChat(ctx: Context) {
            const { ruid } = ctx.params;
            ensureRoomExists(ruid);
            await roomOperations.setChatFreeze(ruid, true);
            ctx.status = 204;
        },

        async unfreezeChat(ctx: Context) {
            const { ruid } = ctx.params;
            ensureRoomExists(ruid);
            await roomOperations.setChatFreeze(ruid, false);
            ctx.status = 204;
        },

        async getTeamColours(ctx: Context) {
            const { ruid } = ctx.params;
            ensureRoomExists(ruid);
            ctx.status = 200;
            ctx.body = {
                red: await roomOperations.getTeamColours(ruid, TeamID.Red),
                blue: await roomOperations.getTeamColours(ruid, TeamID.Blue),
            };
        },

        async setTeamColours(ctx: Context) {
            const { ruid } = ctx.params;
            const validationResult = teamColourSchema.validate(ctx.request.body);

            if (validationResult.error) {
                const formatted = formatJoiError(validationResult.error);
                throw new ValidationError(formatted.message, formatted.details);
            }

            const { team, angle, textColour, teamColour1, teamColour2, teamColour3 } = validationResult.value;

            if (team !== TeamID.Red && team !== TeamID.Blue) {
                throw new ValidationError("Team must be 1 (Red) or 2 (Blue)");
            }

            ensureRoomExists(ruid);
            await roomOperations.setTeamColours(ruid, team, angle, textColour, teamColour1, teamColour2, teamColour3);
            ctx.status = 201;
        },

        async getDiscordWebhookConfig(ctx: Context) {
            const { ruid } = ctx.params;
            ensureRoomExists(ruid);
            const config = await roomOperations.getDiscordWebhookConfig(ruid);
            ctx.status = 200;
            ctx.body = {
                feed: config.feed,
                passwordWebhookId: config.passwordWebhookId,
                passwordWebhookToken: config.passwordWebhookToken,
                replaysWebhookId: config.replaysWebhookId,
                replaysWebhookToken: config.replaysWebhookToken,
                replayUpload: config.replayUpload,
            };
        },

        async setDiscordWebhookConfig(ctx: Context) {
            const { ruid } = ctx.params;
            const validationResult = discordWebhookConfigSchema.validate(ctx.request.body);

            if (validationResult.error) {
                const formatted = formatJoiError(validationResult.error);
                throw new ValidationError(formatted.message, formatted.details);
            }

            const { feed, replaysWebhookId, replaysWebhookToken, replayUpload, passwordWebhookId, passwordWebhookToken } = validationResult.value;

            ensureRoomExists(ruid);
            await roomOperations.setDiscordWebhookConfig(ruid, {
                feed,
                replaysWebhookId,
                replaysWebhookToken,
                replayUpload,
                passwordWebhookId,
                passwordWebhookToken,
            });

            const persisted = await apiDbAdapter.getRoomConfig(ruid);
            await apiDbAdapter.saveRoomConfig({
                ...persisted,
                discordWebhook: { feed, replaysWebhookId, replaysWebhookToken, replayUpload, passwordWebhookId, passwordWebhookToken },
            });
            ctx.status = 201;
        },
    };
}
