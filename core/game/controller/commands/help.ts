import * as LangRes from "../../resource/strings";
import { PlayerObject } from "../../model/GameObject/PlayerObject";
import {GameCommands} from "./GameCommands";

export function buildHelpCommand(helpMessages: Map<string, string>) {
    return function cmdHelp(byPlayer: PlayerObject, command?: string): void {
        if (command === undefined || command === null) {
            window.gameRoom._room.sendAnnouncement(LangRes.command.help, byPlayer.id, 0x479947, "normal", 1);
            return;
        }

        if (helpMessages.has(command)) {
            const commandHelp = helpMessages.get(command)!;
            window.gameRoom._room.sendAnnouncement(commandHelp, byPlayer.id, 0x479947, "normal", 1);
        } else {
            window.gameRoom._room.sendAnnouncement(LangRes.command.helpman._ErrorWrongCommand, byPlayer.id, 0xFF7777, "normal", 2);
        }
    }
}
