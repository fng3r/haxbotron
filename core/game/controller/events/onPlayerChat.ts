import * as Tst from "../Translator";
import * as LangRes from "../../resource/strings";
import { PlayerObject } from "../../model/GameObject/PlayerObject";
import {isCommandString, executeCommand, isTeamChatCommand} from "../commands/CommandParser";
import { getUnixTimestamp } from "../DateTimeUtils";
import { isIncludeBannedWords } from "../TextFilter";
import {PlayerRoles} from "../../model/PlayerRole/PlayerRoles";
import { ServiceContainer } from "../../services/ServiceContainer";

export function onPlayerChatListener(player: PlayerObject, message: string): boolean {
    // Event called when a player sends a chat message.
    // The event function can return false in order to filter the chat message.
    // Then It prevents the chat message from reaching other players in the room.

    //TODO: CHAT FILTERING : https://github.com/web-mech/badwords

    const services = ServiceContainer.getInstance();
    const playerList = services.player.getPlayerList();
    const config = services.config.getConfig();
    
    services.logger.i('onPlayerChat', `[${player.name}#${player.id}] ${message}`);

    // =========

    const roomPlayer = playerList.get(player.id)!;
    if (isCommandString(message)) {
        executeCommand(player, message);
        return !isTeamChatCommand(message) && !roomPlayer.permissions.mute && !services.chat.isAllMuted(); // show message only when it's not team chat command and player is not muted
    }

    // if this message is normal chat
    const playerRole = services.playerRole.getRole(player.id)!;
    const currentTimestamp = getUnixTimestamp();
    if (PlayerRoles.atLeast(playerRole, PlayerRoles.S_ADM)) { // if player is s-adm+ then he can chat anyway
        services.chat.recordChatActivity(player.id, currentTimestamp); // record who said this chat
        return true;
    }

    if (services.chat.isAllMuted() || roomPlayer.permissions.mute) { // if this player is muted or whole chat is frozen
        services.room.sendAnnouncement(LangRes.onChat.mutedChat, player.id, 0xFF0000, "bold", 2); // notify that fact
        return false; // and hide this chat
    }

    // Anti Chat Flood Checking
    if (config.settings.antiChatFlood) { // if anti chat flood options is enabled
        let chatFloodFlag = false;
        services.chat.recordChatActivity(player.id, currentTimestamp); // record who said this chat
        const playerActivity = services.chat.getChatActivity(player.id);

        // if player has more than chatFloodCriterion chats in last chatFloodIntervalMillisecs, mark it as a flood
        if (playerActivity.length >= config.settings.chatFloodCriterion &&
            playerActivity[playerActivity.length - 1] - playerActivity[0] < config.settings.chatFloodIntervalMillisecs) {
            chatFloodFlag = true;
        }
        if (chatFloodFlag && !roomPlayer.permissions.mute) {
            roomPlayer.permissions.mute = true; // mute this player
            roomPlayer.permissions.muteExpire = currentTimestamp + config.settings.muteDefaultMillisecs; //record mute expiration date by unix timestamp
            const placeholder = {
                playerID: player.id,
                playerName: player.name
            };
            services.room.sendAnnouncement(Tst.maketext(LangRes.antitrolling.chatFlood.muteReason, placeholder), null, 0xFF0000, "normal", 1); // notify that fact

            window._emitSIOPlayerStatusChangeEvent(player.id);
            return false;
        }
    }

    // Message Length Limitation Check
    if (message.length > config.settings.chatLengthLimit) {
        services.room.sendAnnouncement(LangRes.onChat.tooLongChat, player.id, 0xFF0000, "bold", 2); // notify that fact
        return false;
    }

    // if this player use seperator (|,|) in chat message
    if (message.includes('|,|')) {
        services.room.sendAnnouncement(LangRes.onChat.includeSeparator, player.id, 0xFF0000, "bold", 2); // notify that fact
        return false;
    }

    // Check if includes banned words
    if (config.settings.chatTextFilter && isIncludeBannedWords(services.config.getBannedWords('chat'), message)) {
        services.room.sendAnnouncement(LangRes.onChat.bannedWords, player.id, 0xFF0000, "bold", 2); // notify that fact
        return false;
    }

    return true;
}
