import { emitPlayerStatusChange } from "./WorkerEventBridge";
import { RoomRuntime } from "./RoomRuntime";
import { RoomRpcCommandMap, RoomRpcResultMap, TeamColourInfo } from "../../lib/room/RoomProtocol";

export async function handleRoomCommand(
    runtime: RoomRuntime,
    command: keyof RoomRpcCommandMap,
    payload: RoomRpcCommandMap[keyof RoomRpcCommandMap]
): Promise<unknown> {
    switch (command) {
        case "closeRoom":
            runtime.room.getRoom().stopRecording();
            return;
        case "getRoomLink":
            return runtime.room.getLink();
        case "getRoomInfo":
            return {
                roomName: runtime.config.getConfig()._config.roomName,
                onlinePlayers: runtime.player.getPlayerCount(),
            };
        case "getRoomDetailInfo":
            return {
                roomName: runtime.config.getConfig()._config.roomName,
                onlinePlayers: runtime.player.getPlayerCount(),
                adminPassword: runtime.config.getAdminPassword(),
                link: runtime.room.getLink(),
                _roomConfig: runtime.config.getConfig()._config,
                botSettings: runtime.config.getConfig().settings,
                rules: runtime.config.getConfig().rules,
            };
        case "getOnlinePlayersIDList":
            return Array.from(runtime.player.getPlayerList().keys());
        case "checkOnlinePlayer": {
            const typedPayload = payload as RoomRpcCommandMap["checkOnlinePlayer"];
            return runtime.player.getPlayerList().has(typedPayload.id);
        }
        case "getPlayerInfo": {
            const typedPayload = payload as RoomRpcCommandMap["getPlayerInfo"];
            return runtime.player.getPlayerList().get(typedPayload.id);
        }
        case "banPlayerTemporarily": {
            const typedPayload = payload as RoomRpcCommandMap["banPlayerTemporarily"];
            const player = runtime.player.getPlayerList().get(typedPayload.id);
            if (player) {
                const banItem = runtime.ban.createTemporaryBan(
                    player.conn,
                    player.auth,
                    typedPayload.reason,
                    Math.floor(Date.now()),
                    typedPayload.seconds * 1000
                );
                await runtime.ban.upsertBan(banItem);
                runtime.room.getRoom().kickPlayer(typedPayload.id, typedPayload.reason, typedPayload.ban);
                runtime.logger.i(
                    "system",
                    `[Kick] #${typedPayload.id} has been ${typedPayload.ban ? "banned" : "kicked"} by operator. (duration: ${typedPayload.seconds}secs, reason: ${typedPayload.reason})`
                );
            }
            return;
        }
        case "broadcast": {
            const typedPayload = payload as RoomRpcCommandMap["broadcast"];
            runtime.room.sendAnnouncement(typedPayload.message, null, 0xffff00, "bold", 2);
            runtime.logger.i("system", `[Broadcast] ${typedPayload.message}`);
            return;
        }
        case "whisper": {
            const typedPayload = payload as RoomRpcCommandMap["whisper"];
            const player = runtime.player.getPlayerList().get(typedPayload.id);
            runtime.room.sendAnnouncement(typedPayload.message, typedPayload.id, 0xffff00, "bold", 2);
            runtime.logger.i("system", `[Whisper][to ${player?.name}#${typedPayload.id}] ${typedPayload.message}`);
            return;
        }
        case "getNotice":
            return runtime.notification.getNotice() || null;
        case "setNotice": {
            const typedPayload = payload as RoomRpcCommandMap["setNotice"];
            runtime.notification.setNotice(typedPayload.message);
            return;
        }
        case "setPassword": {
            const typedPayload = payload as RoomRpcCommandMap["setPassword"];
            const convertedPassword = typedPayload.password === "" ? null : typedPayload.password;
            runtime.room.setPassword(convertedPassword);
            runtime.config.setRoomPassword(typedPayload.password || undefined);
            return;
        }
        case "getChatFreeze":
            return runtime.chat.isAllMuted();
        case "setChatFreeze": {
            const typedPayload = payload as RoomRpcCommandMap["setChatFreeze"];
            runtime.chat.setAllMuted(typedPayload.freeze);
            runtime.logger.i("system", `[Freeze] Whole chat is ${typedPayload.freeze ? "muted" : "unmuted"} by Operator.`);
            emitPlayerStatusChange(0);
            return;
        }
        case "setPlayerMute": {
            const typedPayload = payload as RoomRpcCommandMap["setPlayerMute"];
            const player = runtime.player.getPlayerList().get(typedPayload.id);
            if (player) {
                player.permissions.mute = true;
                player.permissions.muteExpire = typedPayload.muteExpireTime;
                runtime.logger.i("system", `[Mute] ${player.name}#${typedPayload.id} is muted by Operator.`);
                emitPlayerStatusChange(typedPayload.id);
            }
            return;
        }
        case "setPlayerUnmute": {
            const typedPayload = payload as RoomRpcCommandMap["setPlayerUnmute"];
            const player = runtime.player.getPlayerList().get(typedPayload.id);
            if (player) {
                player.permissions.mute = false;
                runtime.logger.i("system", `[Mute] ${player.name}#${typedPayload.id} is unmuted by Operator.`);
                emitPlayerStatusChange(typedPayload.id);
            }
            return;
        }
        case "getTeamColours": {
            const typedPayload = payload as RoomRpcCommandMap["getTeamColours"];
            const teamColours = runtime.room.getTeamColours();
            const team = typedPayload.team === 1 ? "red" : "blue";
            return teamColours[team];
        }
        case "setTeamColours": {
            const typedPayload = payload as RoomRpcCommandMap["setTeamColours"];
            const teamColourData: TeamColourInfo = {
                angle: typedPayload.angle,
                textColour: typedPayload.textColour,
                teamColour1: typedPayload.teamColour1,
                teamColour2: typedPayload.teamColour2,
                teamColour3: typedPayload.teamColour3,
            };
            runtime.room.getRoom().setTeamColors(typedPayload.team, typedPayload.angle, typedPayload.textColour, [
                typedPayload.teamColour1,
                typedPayload.teamColour2,
                typedPayload.teamColour3,
            ]);
            runtime.room.setTeamColours(typedPayload.team === 2 ? "blue" : "red", teamColourData);
            runtime.logger.i("system", `[TeamColour] New team colour is set for Team ${typedPayload.team}.`);
            return;
        }
        case "getDiscordWebhookConfig":
            return runtime.social.getDiscordWebhook();
        case "setDiscordWebhookConfig": {
            const typedPayload = payload as RoomRpcCommandMap["setDiscordWebhookConfig"];
            runtime.social.updateDiscordWebhook(typedPayload.config);
            return;
        }
        case "openRoom":
            throw new Error("openRoom must be handled by the worker bootstrap");
    }
}
