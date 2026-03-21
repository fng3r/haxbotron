import * as LangRes from "../../resource/strings";
import { RoomRuntime } from "../../runtime/RoomRuntime";

export function buildHelpCommand(helpMessages: Map<string, string>) {
    return function cmdHelp(runtime: RoomRuntime, byPlayer: PlayerObject, command?: string): void {
        if (command === undefined || command === null) {
            runtime.room.sendAnnouncement(LangRes.command.help, byPlayer.id, 0x479947, "normal", 1);
            return;
        }

        if (helpMessages.has(command)) {
            const commandHelp = helpMessages.get(command)!;
            runtime.room.sendAnnouncement(commandHelp, byPlayer.id, 0x479947, "normal", 1);
        } else {
            runtime.room.sendAnnouncement(LangRes.command.helpman._ErrorWrongCommand, byPlayer.id, 0xFF7777, "normal", 2);
        }
    }
}
