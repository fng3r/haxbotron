import { PlayerObject } from "../../model/GameObject/PlayerObject";
import * as LangRes from "../../resource/strings";
import { ServiceContainer } from "../../services/ServiceContainer";
import { executeCommand, isCommandString, isTeamChatCommand } from "../commands/CommandParser";
import { getUnixTimestamp } from "../DateTimeUtils";
import * as Tst from "../Translator";

export function onPlayerChatListener(player: PlayerObject, message: string): boolean {
    // Event called when a player sends a chat message.
    // The event function can return false in order to filter the chat message.
    // Then It prevents the chat message from reaching other players in the room.

    const services = ServiceContainer.getInstance();
    const playerList = services.player.getPlayerList();
    const config = services.config.getConfig();
    
    services.logger.i('onPlayerChat', `[${player.name}#${player.id}] ${message}`);

    const roomPlayer = playerList.get(player.id)!;
    const playerRole = services.playerRole.getRole(player.id)!;
    if (isCommandString(message)) {
        executeCommand(player, message);
        return !isTeamChatCommand(message) && !services.chat.isMessageBlockedByMute(roomPlayer);
    }

    const currentTimestamp = getUnixTimestamp();
    if (services.chat.canBypassChatRestrictions(playerRole)) {
        services.chat.recordChatActivity(player.id, currentTimestamp);
        return true;
    }

    if (services.chat.isMessageBlockedByMute(roomPlayer)) {
        services.room.sendAnnouncement(LangRes.onChat.mutedChat, player.id, 0xFF0000, "bold", 2);
        return false;
    }

    // Anti Chat Flood Checking
    if (config.settings.antiChatFlood) { // if anti chat flood options is enabled
        const isFlood = services.chat.detectChatFlood(
            player.id,
            currentTimestamp,
            config.settings.chatFloodCriterion,
            config.settings.chatFloodIntervalMillisecs
        );
        if (isFlood && !roomPlayer.permissions.mute) {
            services.chat.applyFloodMute(roomPlayer, currentTimestamp, config.settings.muteDefaultMillisecs); // record mute expiration date by unix timestamp
            const placeholder = {
                playerID: player.id,
                playerName: player.name
            };
            services.room.sendAnnouncement(Tst.maketext(LangRes.antitrolling.chatFlood.muteReason, placeholder), null, 0xFF0000, "normal", 1); // notify that fact

            window._emitSIOPlayerStatusChangeEvent(player.id);
            return false;
        }
    }

    const messageValidation = services.chat.validateMessageContent(
        message,
        config.settings.chatLengthLimit,
        config.settings.chatTextFilter,
        services.config.getBannedWords('chat')
    );
    if (!messageValidation.isValid) {
        if (messageValidation.reason === "too_long") {
            services.room.sendAnnouncement(LangRes.onChat.tooLongChat, player.id, 0xFF0000, "bold", 2);
        } else if (messageValidation.reason === "separator") {
            services.room.sendAnnouncement(LangRes.onChat.includeSeparator, player.id, 0xFF0000, "bold", 2);
        } else if (messageValidation.reason === "banned_words") {
            services.room.sendAnnouncement(LangRes.onChat.bannedWords, player.id, 0xFF0000, "bold", 2);
        }
        return false;
    }

    return true;
}
