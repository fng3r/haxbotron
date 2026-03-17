import * as LangRes from "../../resource/strings";
import { CommandExecutor, isCommandString, isTeamChatCommand, parseCommand } from "../commands/CommandRegistry";
import { getUnixTimestamp } from "../DateTimeUtils";
import { RoomRuntime } from "../../runtime/RoomRuntime";
import { emitPlayerStatusChange } from "../../runtime/WorkerEventBridge";
import * as Tst from "../Translator";

export function onPlayerChatListener(runtime: RoomRuntime, commandExecutor: CommandExecutor, player: PlayerObject, message: string): boolean {
    // Event called when a player sends a chat message.
    // The event function can return false in order to filter the chat message.
    // Then It prevents the chat message from reaching other players in the room.

    const playerList = runtime.players.getPlayerList();
    const settings = runtime.config.getSettings();
    runtime.logger.i('onPlayerChat', `[${player.name}#${player.id}] ${message}`);

    const roomPlayer = playerList.get(player.id)!;
    const playerRole = runtime.playerRoles.getRole(player.id)!;
    if (isCommandString(message)) {
        const command = parseCommand(message);
        if (command === null) {
            runtime.room.sendAnnouncement(LangRes.command._ErrorWrongCommand, player.id, 0xFF7777, "normal", 2);
        } else {
            Promise.resolve(commandExecutor.executeCommand(player, command)).catch(() => {
                runtime.logger.e('executeCommand', `Failed to execute command '${command.commandName}'`);
            });
        }

        const isTeamChatCmd = command && isTeamChatCommand(command.commandName);
        return !isTeamChatCmd && !runtime.chat.isMessageBlockedByMute(roomPlayer);
    }

    const currentTimestamp = getUnixTimestamp();
    if (runtime.chat.canBypassChatRestrictions(playerRole)) {
        runtime.chat.recordChatActivity(player.id, currentTimestamp);
        return true;
    }

    if (runtime.chat.isMessageBlockedByMute(roomPlayer)) {
        runtime.room.sendAnnouncement(LangRes.onChat.mutedChat, player.id, 0xFF0000, "bold", 2);
        return false;
    }

    // Anti Chat Flood Checking
    if (settings.antiChatFlood) { // if anti chat flood options is enabled
        const isFlood = runtime.chat.detectChatFlood(
            player.id,
            currentTimestamp,
            settings.chatFloodCriterion,
            settings.chatFloodIntervalMillisecs
        );
        if (isFlood && !roomPlayer.permissions.mute) {
            runtime.chat.applyFloodMute(roomPlayer, currentTimestamp, settings.muteDefaultMillisecs); // record mute expiration date by unix timestamp
            const placeholder = {
                playerID: player.id,
                playerName: player.name
            };
            runtime.room.sendAnnouncement(Tst.maketext(LangRes.antitrolling.chatFlood.muteReason, placeholder), null, 0xFF0000, "normal", 1); // notify that fact

            emitPlayerStatusChange(player.id);
            return false;
        }
    }

    return true;
}
