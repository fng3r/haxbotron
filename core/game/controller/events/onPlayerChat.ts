import * as Tst from "../Translator";
import * as LangRes from "../../resource/strings";
import { PlayerObject } from "../../model/GameObject/PlayerObject";
import {isCommandString, executeCommand, isTeamChatCommand} from "../Parser";
import { getUnixTimestamp } from "../DateTimeUtils";
import { isIncludeBannedWords } from "../TextFilter";
import {PlayerRoles} from "../../model/PlayerRole/PlayerRoles";

export function onPlayerChatListener(player: PlayerObject, message: string): boolean {
    // Event called when a player sends a chat message.
    // The event function can return false in order to filter the chat message.
    // Then It prevents the chat message from reaching other players in the room.

    //TODO: CHAT FILTERING : https://github.com/web-mech/badwords

    window.gameRoom.logger.i('onPlayerChat', `[${player.name}#${player.id}] ${message}`);

    var placeholderChat = {
        playerID: player.id,
        playerName: player.name,
        gameRuleName: window.gameRoom.config.rules.ruleName,
        gameRuleLimitTime: window.gameRoom.config.rules.requisite.timeLimit,
        gameRuleLimitScore: window.gameRoom.config.rules.requisite.scoreLimit,
        gameRuleNeedMin: window.gameRoom.config.rules.requisite.minimumPlayers
    };

    // =========

    if (isCommandString(message)) {
        executeCommand(player, message);
        return !isTeamChatCommand(message); // show message only when it's not team chat command
    } else { // if this message is normal chat
        const playerRole = window.gameRoom.playerRoles.get(player.id)!;
        if (PlayerRoles.atLeast(playerRole, PlayerRoles.S_ADM)) { // if player is s-adm+ then he can chat anyway
            window.gameRoom.antiTrollingChatFloodCount.push(player.id); // record who said this chat
            return true;
        } else {
            if (window.gameRoom.isMuteAll || window.gameRoom.playerList.get(player.id)!.permissions.mute) { // if this player is muted or whole chat is frozen
                window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.onChat.mutedChat, placeholderChat), player.id, 0xFF0000, "bold", 2); // notify that fact
                return false; // and hide this chat
            } else {
                // Anti Chat Flood Checking
                if (window.gameRoom.config.settings.antiChatFlood) { // if anti chat flood options is enabled
                    let chatFloodCritFlag: boolean = false;
                    window.gameRoom.antiTrollingChatFloodCount.push(player.id); // record who said this chat
                    for (let floodCritCount = 1; floodCritCount <= window.gameRoom.config.settings.chatFloodCriterion; floodCritCount++) {
                        let floodID: number = window.gameRoom.antiTrollingChatFloodCount[window.gameRoom.antiTrollingChatFloodCount.length - floodCritCount] || 0;
                        if (floodID === player.id) {
                            chatFloodCritFlag = true;
                        } else {
                            chatFloodCritFlag = false;
                            break; // abort loop
                        }
                    }
                    if (chatFloodCritFlag && !window.gameRoom.playerList.get(player.id)!.permissions.mute) { // after complete loop, check flag
                        const nowTimeStamp: number = getUnixTimestamp(); //get timestamp
                        // judge as chat flood.
                        window.gameRoom.playerList.get(player.id)!.permissions.mute = true; // mute this player
                        window.gameRoom.playerList.get(player.id)!.permissions.muteExpire = nowTimeStamp + window.gameRoom.config.settings.muteDefaultMillisecs; //record mute expiration date by unix timestamp
                        window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.antitrolling.chatFlood.muteReason, placeholderChat), null, 0xFF0000, "normal", 1); // notify that fact
                        
                        window._emitSIOPlayerStatusChangeEvent(player.id);
                        return false;
                    }
                }
                // Message Length Limitation Check
                if(message.length > window.gameRoom.config.settings.chatLengthLimit) {
                    window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.onChat.tooLongChat, placeholderChat), player.id, 0xFF0000, "bold", 2); // notify that fact
                    return false;
                }
                // if this player use seperator (|,|) in chat message
                if(message.includes('|,|')) {
                    window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.onChat.includeSeperator, placeholderChat), player.id, 0xFF0000, "bold", 2); // notify that fact
                    return false;
                }
                // Check if includes banned words
                if(window.gameRoom.config.settings.chatTextFilter && isIncludeBannedWords(window.gameRoom.bannedWordsPool.chat, message)) {
                    window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.onChat.bannedWords, placeholderChat), player.id, 0xFF0000, "bold", 2); // notify that fact
                    return false;
                }
                // otherwise, send to room
                return true;
            }
        }
    }
}
