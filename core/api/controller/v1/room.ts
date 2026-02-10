import { Context } from "koa";
import { Player } from "../../../game/model/GameObject/Player";
import { TeamID } from "../../../game/model/GameObject/TeamID";
import { getRoomOperations } from "../../../lib/browser";
import { BrowserHostRoomInitConfig } from '../../../lib/browser.hostconfig';
import { ConflictError, PlayerNotFoundError, RoomNotFoundError, ValidationError } from "../../../lib/errors";
import { formatJoiError } from "../../middleware/errorHandler";
import { discordWebhookConfigSchema } from "../../schema/discordwebhook.validation";
import { nestedHostRoomConfigSchema } from "../../schema/hostroomconfig.validation";
import { teamColourSchema } from "../../schema/teamcolour.validation";

/**
 * create new room
 */
export async function createRoom(ctx: Context) {
    const validationResult = nestedHostRoomConfigSchema.validate(ctx.request.body);

    if (validationResult.error) {
        const formatted = formatJoiError(validationResult.error);
        throw new ValidationError(formatted.message, formatted.details);
    }

    const newRoomConfig: BrowserHostRoomInitConfig = {
        _LaunchDate: new Date()
        , _RUID: ctx.request.body.ruid
        , _config: ctx.request.body._config
        , settings: ctx.request.body.settings
        , rules: ctx.request.body.rules
    }

    if (newRoomConfig._config.password == "") {
        newRoomConfig._config.password = undefined;
    }

    const roomOperations = getRoomOperations();
    if (roomOperations.checkExistRoom(newRoomConfig._RUID)) {
        throw new ConflictError(`Room with RUID '${newRoomConfig._RUID}' already exists`);
    }

    await roomOperations.openNewRoom(newRoomConfig._RUID, newRoomConfig);
    ctx.status = 201;
}

/**
 * close the room
 */
export async function terminateRoom(ctx: Context) {
    const { ruid } = ctx.params;
    const roomOperations = getRoomOperations();
    if (!roomOperations.checkExistRoom(ruid)) {
        throw new RoomNotFoundError(ruid);
    }
    await roomOperations.closeRoom(ruid);
    ctx.status = 204;
}

/**
 * get exist room list
 */
export function getRoomList(ctx: Context) {
    const roomOperations = getRoomOperations();
    const list: string[] = roomOperations.getExistRoomList();
    ctx.status = 200;
    ctx.body = list;
}

/**
 * get the room's information
 */
export async function getRoomInfo(ctx: Context) {
    const { ruid } = ctx.params;
    const roomOperations = getRoomOperations();
    if (!roomOperations.checkExistRoom(ruid)) {
        throw new RoomNotFoundError(ruid);
    }
    ctx.status = 200;
    ctx.body = await roomOperations.getRoomInfo(ruid);
}

/**
 * get the room's information
 */
export async function getRoomDetailInfo(ctx: Context) {
    const { ruid } = ctx.params;
    const roomOperations = getRoomOperations();
    if (!roomOperations.checkExistRoom(ruid)) {
        throw new RoomNotFoundError(ruid);
    }
    ctx.status = 200;
    ctx.body = await roomOperations.getRoomDetailInfo(ruid);
}

/**
 * get online player list
 */
export async function getPlayersList(ctx: Context) {
    const { ruid } = ctx.params;
    const roomOperations = getRoomOperations();
    if (!roomOperations.checkExistRoom(ruid)) {
        throw new RoomNotFoundError(ruid);
    }
    const list: number[] = await roomOperations.getOnlinePlayersIDList(ruid);
    ctx.status = 200;
    ctx.body = list;
}

/**
 * get player's information
 */
export async function getPlayerInfo(ctx: Context) {
    const { ruid, id } = ctx.params;
    const roomOperations = getRoomOperations();
    if (!roomOperations.checkExistRoom(ruid)) {
        throw new RoomNotFoundError(ruid);
    }
    const player: Player | undefined = await roomOperations.getPlayerInfo(ruid, parseInt(id));
    if (player === undefined) {
        throw new PlayerNotFoundError(id);
    }
    ctx.status = 200;
    ctx.body = player;
}

/**
 * Kick this player from the room
 */
export async function kickOnlinePlayer(ctx: Context) {
    const { ruid, id } = ctx.params;
    const { ban, seconds, reason } = ctx.request.body;
    if (ban === undefined || !seconds) {
        throw new ValidationError('Missing required fields: ban and seconds');
    }
    const playerId = parseInt(id);
    const roomOperations = getRoomOperations();
    if (!roomOperations.checkExistRoom(ruid)) {
        throw new RoomNotFoundError(ruid);
    }
    if (!(await roomOperations.checkOnlinePlayer(ruid, playerId))) {
        throw new PlayerNotFoundError(id);
    }
    await roomOperations.banPlayerTemporarily(ruid, playerId, ban, reason, seconds);
    ctx.status = 204;
}

/**
 * send broadcast message
 */
export function broadcast(ctx: Context) {
    const { ruid } = ctx.params;
    const message: string | undefined = ctx.request.body.message;
    const roomOperations = getRoomOperations();
    if (!roomOperations.checkExistRoom(ruid)) {
        throw new RoomNotFoundError(ruid);
    }
    if (!message) {
        throw new ValidationError('Message is required');
    }
    roomOperations.broadcast(ruid, message);
    ctx.status = 201;
}

/**
 * send whisper message
 */
export async function whisper(ctx: Context) {
    const { ruid, id } = ctx.params;
    const message: string | undefined = ctx.request.body.message;
    const playerID: number = parseInt(id);
    const roomOperations = getRoomOperations();
    if (!roomOperations.checkExistRoom(ruid)) {
        throw new RoomNotFoundError(ruid);
    }
    if (!(await roomOperations.checkOnlinePlayer(ruid, playerID))) {
        throw new PlayerNotFoundError(id);
    }
    if (!message) {
        throw new ValidationError('Message is required');
    }
    roomOperations.whisper(ruid, playerID, message);
    ctx.status = 201;
}

/**
 * set notice message
 */
export async function setNotice(ctx: Context) {
    const { ruid } = ctx.params;
    const message: string | undefined = ctx.request.body.message;
    const roomOperations = getRoomOperations();
    if (!roomOperations.checkExistRoom(ruid)) {
        throw new RoomNotFoundError(ruid);
    }
    if (!message) {
        throw new ValidationError('Message is required');
    }
    await roomOperations.setNotice(ruid, message);
    ctx.status = 201;
}

/**
 * get notice message
 */
export async function getNotice(ctx: Context) {
    const { ruid } = ctx.params;
    const roomOperations = getRoomOperations();
    if (!roomOperations.checkExistRoom(ruid)) {
        throw new RoomNotFoundError(ruid);
    }
    const message: string | null = await roomOperations.getNotice(ruid);
    ctx.body = { message };
    ctx.status = 200;
}

/**
 * delete notice message
 */
export async function deleteNotice(ctx: Context) {
    const { ruid } = ctx.params;
    const roomOperations = getRoomOperations();
    if (!roomOperations.checkExistRoom(ruid)) {
        throw new RoomNotFoundError(ruid);
    }
    roomOperations.setNotice(ruid, '');
    ctx.status = 204;
}

/**
 * set room's password
 */
export async function setPassword(ctx: Context) {
    const { ruid } = ctx.params;
    const password: string = ctx.request.body.password;

    if (!password) {
        throw new ValidationError('Password is required');
    }

    const roomOperations = getRoomOperations();
    if (!roomOperations.checkExistRoom(ruid)) {
        throw new RoomNotFoundError(ruid);
    }
    roomOperations.setPassword(ruid, password);
    ctx.status = 201;
}

/**
 * Clear room's password
 */
export async function clearPassword(ctx: Context) {
    const { ruid } = ctx.params;

    const roomOperations = getRoomOperations();
    if (!roomOperations.checkExistRoom(ruid)) {
        throw new RoomNotFoundError(ruid);
    }
    roomOperations.setPassword(ruid, '');
    ctx.status = 204;
}

/**
 * Get text filtering pool for nickname
 */
export async function getNicknameTextFilteringPool(ctx: Context) {
    const { ruid } = ctx.params;
    const roomOperations = getRoomOperations();
    if (!roomOperations.checkExistRoom(ruid)) {
        throw new RoomNotFoundError(ruid);
    }
    const pool: string[] = await roomOperations.getNicknameTextFilteringPool(ruid);
    ctx.status = 200;
    ctx.body = { pool: pool.join('|,|') };
}

/**
 * Get text filtering pool for chat messages
 */
export async function getChatTextFilteringPool(ctx: Context) {
    const { ruid } = ctx.params;
    const roomOperations = getRoomOperations();
    if (!roomOperations.checkExistRoom(ruid)) {
        throw new RoomNotFoundError(ruid);
    }
    const pool: string[] = await roomOperations.getChatTextFilteringPool(ruid);
    ctx.status = 200;
    ctx.body = { pool: pool.join('|,|') };
}

/**
 * Set text filtering pool for nickname
 */
export async function setNicknameTextFilter(ctx: Context) {
    const { ruid } = ctx.params;
    const pool: string = ctx.request.body.pool;

    if (!pool) {
        throw new ValidationError('Pool is required');
    }

    const roomOperations = getRoomOperations();
    if (!roomOperations.checkExistRoom(ruid)) {
        throw new RoomNotFoundError(ruid);
    }
    roomOperations.setNicknameTextFilter(ruid, pool.split('|,|'));
    ctx.status = 201;
}

/**
 * Set text filtering pool for chat messages
 */
export async function setChatTextFilter(ctx: Context) {
    const { ruid } = ctx.params;
    const pool: string = ctx.request.body.pool;

    if (!pool) {
        throw new ValidationError('Pool is required');
    }

    const roomOperations = getRoomOperations();
    if (!roomOperations.checkExistRoom(ruid)) {
        throw new RoomNotFoundError(ruid);
    }
    roomOperations.setChatTextFilter(ruid, pool.split('|,|'));
    ctx.status = 201;
}

/**
 * Clear text filtering pool for nickname
 */
export async function clearNicknameTextFilter(ctx: Context) {
    const { ruid } = ctx.params;
    const roomOperations = getRoomOperations();
    if (!roomOperations.checkExistRoom(ruid)) {
        throw new RoomNotFoundError(ruid);
    }
    roomOperations.clearNicknameTextFilter(ruid);
    ctx.status = 204;
}

/**
 * Clear text filtering pool for chat messages
 */
export async function clearChatTextFilter(ctx: Context) {
    const { ruid } = ctx.params;
    const roomOperations = getRoomOperations();
    if (!roomOperations.checkExistRoom(ruid)) {
        throw new RoomNotFoundError(ruid);
    }
    roomOperations.clearChatTextFilter(ruid);
    ctx.status = 204;
}

/**
 * Check player's mute status
 */
export async function checkPlayerMuted(ctx: Context) {
    const { ruid, id } = ctx.params;
    const roomOperations = getRoomOperations();
    if (!roomOperations.checkExistRoom(ruid)) {
        throw new RoomNotFoundError(ruid);
    }
    const player: Player | undefined = await roomOperations.getPlayerInfo(ruid, parseInt(id));
    if (player === undefined) {
        throw new PlayerNotFoundError(id);
    }
    ctx.status = 200;
    ctx.body = {
        mute: player.permissions.mute,
        muteExpire: player.permissions.muteExpire
    };
}

/**
 * Mute player
 */
export async function mutePlayer(ctx: Context) {
    const { ruid, id } = ctx.params;
    const { muteExpire } = ctx.request.body;
    const roomOperations = getRoomOperations();
    if (!muteExpire) {
        throw new ValidationError('muteExpire is required');
    }

    if (!roomOperations.checkExistRoom(ruid)) {
        throw new RoomNotFoundError(ruid);
    }
    roomOperations.setPlayerMute(ruid, parseInt(id), muteExpire);
    ctx.status = 201;
}

/**
 * Unmute player
 */
export async function unmutePlayer(ctx: Context) {
    const { ruid, id } = ctx.params;
    const roomOperations = getRoomOperations();
    if (!roomOperations.checkExistRoom(ruid)) {
        throw new RoomNotFoundError(ruid);
    }
    roomOperations.setPlayerUnmute(ruid, parseInt(id));
    ctx.status = 204;
}

/**
 * Check whether the game room's chat is freezed
 */
export async function checkChatFreezed(ctx: Context) {
    const { ruid } = ctx.params;
    const roomOperations = getRoomOperations();
    if (!roomOperations.checkExistRoom(ruid)) {
        throw new RoomNotFoundError(ruid);
    }
    ctx.status = 200;
    ctx.body = {
        freezed: await roomOperations.getChatFreeze(ruid)
    };
}

/**
 * Freeze whole chat
 */
export async function freezeChat(ctx: Context) {
    const { ruid } = ctx.params;
    const roomOperations = getRoomOperations();
    if (!roomOperations.checkExistRoom(ruid)) {
        throw new RoomNotFoundError(ruid);
    }
    roomOperations.setChatFreeze(ruid, true);
    ctx.status = 204;
}

/**
 * Unfreeze whole chat
 */
export async function unfreezeChat(ctx: Context) {
    const { ruid } = ctx.params;
    const roomOperations = getRoomOperations();
    if (!roomOperations.checkExistRoom(ruid)) {
        throw new RoomNotFoundError(ruid);
    }
    roomOperations.setChatFreeze(ruid, false);
    ctx.status = 204;
}

/**
 * Get team colours
 */
export async function getTeamColours(ctx: Context) {
    const { ruid } = ctx.params;
    const roomOperations = getRoomOperations();
    if (!roomOperations.checkExistRoom(ruid)) {
        throw new RoomNotFoundError(ruid);
    }
    ctx.status = 200;
    ctx.body = {
        red: await roomOperations.getTeamColours(ruid, TeamID.Red),
        blue: await roomOperations.getTeamColours(ruid, TeamID.Blue)
    };
}

/**
 * Set team colours
 */
export async function setTeamColours(ctx: Context) {
    const { ruid } = ctx.params;
    const { team, angle, textColour, teamColour1, teamColour2, teamColour3 } = ctx.request.body;
    const roomOperations = getRoomOperations();
    const validationResult = teamColourSchema.validate(ctx.request.body);

    if (validationResult.error) {
        const formatted = formatJoiError(validationResult.error);
        throw new ValidationError(formatted.message, formatted.details);
    }

    if (team !== TeamID.Red && team !== TeamID.Blue) {
        throw new ValidationError('Team must be 1 (Red) or 2 (Blue)');
    }

    if (!roomOperations.checkExistRoom(ruid)) {
        throw new RoomNotFoundError(ruid);
    }
    roomOperations.setTeamColours(ruid, team, angle, textColour, teamColour1, teamColour2, teamColour3);
    ctx.status = 201;
}

/**
 * Get discord webhook configuration
 */
export async function getDiscordWebhookConfig(ctx: Context) {
    const { ruid } = ctx.params;
    const roomOperations = getRoomOperations();
    if (!roomOperations.checkExistRoom(ruid)) {
        throw new RoomNotFoundError(ruid);
    }
    const config = await roomOperations.getDiscordWebhookConfig(ruid);
    ctx.status = 200;
    ctx.body = {
        feed: config.feed,
        passwordWebhookId: config.passwordWebhookId,
        passwordWebhookToken: config.passwordWebhookToken,
        replaysWebhookId: config.replaysWebhookId,
        replaysWebhookToken: config.replaysWebhookToken,
        replayUpload: config.replayUpload
    };
}

/**
 * Set discord webhook configuration
 */
export async function setDiscordWebhookConfig(ctx: Context) {
    const { ruid } = ctx.params;
    const { feed, replaysWebhookId, replaysWebhookToken, replayUpload, passwordWebhookId, passwordWebhookToken } = ctx.request.body;
    const roomOperations = getRoomOperations();
    const validationResult = discordWebhookConfigSchema.validate(ctx.request.body);

    if (validationResult.error) {
        const formatted = formatJoiError(validationResult.error);
        throw new ValidationError(formatted.message, formatted.details);
    }

    if (!roomOperations.checkExistRoom(ruid)) {
        throw new RoomNotFoundError(ruid);
    }
    await roomOperations.setDiscordWebhookConfig(ruid, { feed, replaysWebhookId, replaysWebhookToken, replayUpload, passwordWebhookId, passwordWebhookToken });
    ctx.status = 201;
}
