import * as LangRes from "../../resource/strings";
import { PlayerObject } from "../../model/GameObject/PlayerObject";
import {GameCommands} from "./GameCommands";
import { ServiceContainer } from "../../services/ServiceContainer";

export function buildHelpCommand(helpMessages: Map<string, string>) {
    return function cmdHelp(byPlayer: PlayerObject, command?: string): void {
        const services = ServiceContainer.getInstance();
        
        if (command === undefined || command === null) {
            services.room.sendAnnouncement(LangRes.command.help, byPlayer.id, 0x479947, "normal", 1);
            return;
        }

        if (helpMessages.has(command)) {
            const commandHelp = helpMessages.get(command)!;
            services.room.sendAnnouncement(commandHelp, byPlayer.id, 0x479947, "normal", 1);
        } else {
            services.room.sendAnnouncement(LangRes.command.helpman._ErrorWrongCommand, byPlayer.id, 0xFF7777, "normal", 2);
        }
    }
}
