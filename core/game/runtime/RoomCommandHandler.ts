import {
    RoomRpcPayload,
    RoomRpcResult,
    RuntimeRoomRpcCommand,
    RuntimeRoomRpcRequest,
    TeamColourInfo,
} from "../../lib/room/RoomProtocol";
import { RoomRuntime } from "./RoomRuntime";
import { emitPlayerStatusChange } from "./WorkerEventBridge";

type RuntimeRoomCommandHandlerMap = {
    [C in RuntimeRoomRpcCommand]: (
        runtime: RoomRuntime,
        payload: RoomRpcPayload<C>
    ) => Promise<RoomRpcResult<C>> | RoomRpcResult<C>;
};

const roomCommandHandlers: RuntimeRoomCommandHandlerMap = {
    closeRoom: async (runtime) => {
        runtime.room.getRoom().stopRecording();
    },
    getRoomLink: (runtime) => runtime.room.getLink(),
    getRoomInfo: (runtime) => ({
        roomName: runtime.config.getRoomName(),
        onlinePlayers: runtime.players.getPlayerCount(),
    }),
    getRoomDetailInfo: (runtime) => ({
        roomName: runtime.config.getRoomName(),
        onlinePlayers: runtime.players.getPlayerCount(),
        adminPassword: runtime.config.getAdminPassword(),
        link: runtime.room.getLink(),
        _roomConfig: runtime.config.getRoomConfig(),
        botSettings: runtime.config.getSettings(),
        rules: runtime.config.getRules(),
    }),
    getOnlinePlayersIDList: (runtime) => Array.from(runtime.players.getPlayerList().keys()),
    checkOnlinePlayer: (runtime, payload) => runtime.players.getPlayerList().has(payload.id),
    getPlayerInfo: (runtime, payload) => runtime.players.getPlayerList().get(payload.id),
    banPlayerTemporarily: async (runtime, payload) => {
        const player = runtime.players.getPlayerList().get(payload.id);
        if (!player) {
            return;
        }

        const reason = payload.reason ?? "";
        const banItem = runtime.bans.createTemporaryBan(
            player.conn,
            player.auth,
            reason,
            Math.floor(Date.now()),
            payload.seconds * 1000
        );

        await runtime.bans.upsertBan(banItem);
        runtime.room.getRoom().kickPlayer(payload.id, reason, payload.ban);
        runtime.logger.i(
            "system",
            `[Kick] #${payload.id} has been ${payload.ban ? "banned" : "kicked"} by operator. (duration: ${payload.seconds}secs, reason: ${reason})`
        );
    },
    broadcast: (runtime, payload) => {
        runtime.room.sendAnnouncement(payload.message, null, 0xffff00, "bold", 2);
        runtime.logger.i("system", `[Broadcast] ${payload.message}`);
    },
    whisper: (runtime, payload) => {
        const player = runtime.players.getPlayerList().get(payload.id);
        runtime.room.sendAnnouncement(payload.message, payload.id, 0xffff00, "bold", 2);
        runtime.logger.i("system", `[Whisper][to ${player?.name}#${payload.id}] ${payload.message}`);
    },
    getNotice: (runtime) => runtime.notifications.getNotice() || null,
    setNotice: (runtime, payload) => {
        runtime.notifications.setNotice(payload.message);
    },
    setPassword: (runtime, payload) => {
        const convertedPassword = payload.password === "" ? null : payload.password;
        runtime.room.setPassword(convertedPassword);
        runtime.config.setRoomPassword(convertedPassword ?? undefined);
    },
    getChatFreeze: (runtime) => runtime.chat.isAllMuted(),
    setChatFreeze: (runtime, payload) => {
        runtime.chat.setAllMuted(payload.freeze);
        runtime.logger.i("system", `[Freeze] Whole chat is ${payload.freeze ? "muted" : "unmuted"} by Operator.`);
        emitPlayerStatusChange(0);
    },
    setPlayerMute: (runtime, payload) => {
        const player = runtime.players.getPlayerList().get(payload.id);
        if (!player) {
            return;
        }

        player.permissions.mute = true;
        player.permissions.muteExpire = payload.muteExpireTime;
        runtime.logger.i("system", `[Mute] ${player.name}#${payload.id} is muted by Operator.`);
        emitPlayerStatusChange(payload.id);
    },
    setPlayerUnmute: (runtime, payload) => {
        const player = runtime.players.getPlayerList().get(payload.id);
        if (!player) {
            return;
        }

        player.permissions.mute = false;
        runtime.logger.i("system", `[Mute] ${player.name}#${payload.id} is unmuted by Operator.`);
        emitPlayerStatusChange(payload.id);
    },
    getTeamColours: (runtime, payload) => {
        const teamColours = runtime.room.getTeamColours();
        const team = payload.team === 1 ? "red" : "blue";
        return teamColours[team];
    },
    setTeamColours: (runtime, payload) => {
        const teamColourData: TeamColourInfo = {
            angle: payload.angle,
            textColour: payload.textColour,
            teamColour1: payload.teamColour1,
            teamColour2: payload.teamColour2,
            teamColour3: payload.teamColour3,
        };

        runtime.room.setTeamColours(payload.team === 2 ? "blue" : "red", teamColourData);
        runtime.logger.i("system", `[TeamColour] New team colour is set for Team ${payload.team}.`);
    },
    getDiscordWebhookConfig: (runtime) => runtime.social.getDiscordWebhookConfig(),
    setDiscordWebhookConfig: (runtime, payload) => {
        runtime.social.updateDiscordWebhookConfig(payload.config);
    },
};

export async function handleRoomCommand<C extends RuntimeRoomRpcCommand>(
    runtime: RoomRuntime,
    request: RuntimeRoomRpcRequest<C>
): Promise<RoomRpcResult<C>> {
    return await roomCommandHandlers[request.command](runtime, request.payload);
}
