import * as LangRes from "../../resource/strings";
import { PlayerObject } from "../../model/GameObject/PlayerObject";
import {GameCommands} from "./GameCommands";

export function cmdHelp(byPlayer: PlayerObject, subCommand?: string): void {
    switch(subCommand) {
        case GameCommands.about: {
            window.gameRoom._room.sendAnnouncement(LangRes.command.helpman.about, byPlayer.id, 0x479947, "normal", 1);
            break;
        }
        case GameCommands.auth: {
            window.gameRoom._room.sendAnnouncement(LangRes.command.helpman.auth, byPlayer.id, 0x479947, "normal", 1);
            break;
        }
        case GameCommands.bb: {
            window.gameRoom._room.sendAnnouncement(LangRes.command.helpman.bb, byPlayer.id, 0x479947, "normal", 1);
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
        case GameCommands.listroles: {
            window.gameRoom._room.sendAnnouncement(LangRes.command.helpman.listroles, byPlayer.id, 0x479947, "normal", 1);
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
        case GameCommands.mutes: {
            window.gameRoom._room.sendAnnouncement(LangRes.command.helpman.mutes, byPlayer.id, 0x479947, "normal", 1);
            break;
        }
        case GameCommands.ban: {
            window.gameRoom._room.sendAnnouncement(LangRes.command.helpman.ban, byPlayer.id, 0x479947, "normal", 1);
            break;
        }
        case GameCommands.bans: {
            window.gameRoom._room.sendAnnouncement(LangRes.command.helpman.bans, byPlayer.id, 0x479947, "normal", 1);
            break;
        }
        case GameCommands.setpassword: {
            window.gameRoom._room.sendAnnouncement(LangRes.command.helpman.setpassword, byPlayer.id, 0x479947, "normal", 1);
            break;
        }
        case GameCommands.staff: {
            window.gameRoom._room.sendAnnouncement(LangRes.command.helpman.staff, byPlayer.id, 0x479947, "normal", 1);
            break;
        }
        case GameCommands.switch: {
            window.gameRoom._room.sendAnnouncement(LangRes.command.helpman.switch, byPlayer.id, 0x479947, "normal", 1);
            break;
        }
        case null: {
            window.gameRoom._room.sendAnnouncement(LangRes.command.help, byPlayer.id, 0x479947, "normal", 1);
            break;
        }
        default: {
            window.gameRoom._room.sendAnnouncement(LangRes.command.helpman._ErrorWrongCommand, byPlayer.id, 0xFF7777, "normal", 2);
            break;
        }
    }
}
