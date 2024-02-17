import * as LangRes from "../../resource/strings";
import { PlayerObject } from "../../model/GameObject/PlayerObject";
import {GameCommands} from "./GameCommands";

export function cmdHelp(byPlayer: PlayerObject, subCommand?: string): void {
    switch(subCommand) {
        case GameCommands.about: {
            window.gameRoom._room.sendAnnouncement(LangRes.command.helpman.about, byPlayer.id, 0x479947, "normal", 1);
            break;
        }
        case GameCommands.help: {
            window.gameRoom._room.sendAnnouncement(LangRes.command.helpman.help, byPlayer.id, 0x479947, "normal", 1);
            break;
        }
        case GameCommands.list: {
            window.gameRoom._room.sendAnnouncement(LangRes.command.helpman.list, byPlayer.id, 0x479947, "normal", 1);
            break;
        }
        case GameCommands.freeze: {
            window.gameRoom._room.sendAnnouncement(LangRes.command.helpman.freeze, byPlayer.id, 0x479947, "normal", 1);
            break;
        }
        case GameCommands.mute: {
            window.gameRoom._room.sendAnnouncement(LangRes.command.helpman.mute, byPlayer.id, 0x479947, "normal", 1);
            break;
        }
        case GameCommands.ban: {
            window.gameRoom._room.sendAnnouncement(LangRes.command.helpman.ban, byPlayer.id, 0x479947, "normal", 1);
            break;
        }
        case GameCommands.setpassword: {
            window.gameRoom._room.sendAnnouncement(LangRes.command.helpman.setpassword, byPlayer.id, 0x479947, "normal", 1);
            break;
        }
        case null: {
            window.gameRoom._room.sendAnnouncement(LangRes.command.help, byPlayer.id, 0x479947, "normal", 1);
            break;
        }
        default: {
            window.gameRoom._room.sendAnnouncement(LangRes.command.helpman._ErrorWrongMan, byPlayer.id, 0xFF7777, "normal", 2);
            break;
        }
    }
}
