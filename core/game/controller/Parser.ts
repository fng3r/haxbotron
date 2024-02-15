import * as LangRes from "../resource/strings";
import { PlayerObject } from "../model/GameObject/PlayerObject";
import { cmdAbout } from "./commands/about";
import { cmdHelp } from "./commands/help";
import { cmdList } from "./commands/list";
import { cmdFreeze } from "./commands/freeze";
import { cmdMute } from "./commands/mute";
import { cmdBan } from "./commands/ban";
import {GameCommands} from "./commands/GameCommands";

const COMMANDS_PREFIX = '!';

// if given string is command chat, this function returns true, nor false.
export function isCommandString(message: string): boolean {
    return message.charAt(0) == COMMANDS_PREFIX;
}

// divide into 3 parts by seprator. !COMMAND FIRST-ARG SECOND-ARG
export function getCommandChunk(message: string): string[] { 
    return message.split(" ", 4);
}

// parse command message and excute it (need to check if it's command)
export function executeCommand(byPlayer: PlayerObject, message: string): void {
    message = message.trim();
    let msgChunk: string[] = getCommandChunk(message);
    let commandSign: string = msgChunk[0].substring(1); // remove prefix character(default: !)

    console.log(commandSign);
    console.log(GameCommands.ban);
    switch(commandSign) {
        case GameCommands.help: {
            if(msgChunk[1] !== undefined) {
                cmdHelp(byPlayer, msgChunk[1]);
            } else {
                cmdHelp(byPlayer);
            }
            break;
        }
        case GameCommands.about: {
            cmdAbout(byPlayer);
            break;
        }
        case GameCommands.list: {
            if(msgChunk[1] !== undefined) {
                cmdList(byPlayer, msgChunk[1]);
            } else {
                cmdList(byPlayer);
            }
            break;
        }
        case GameCommands.freeze: {
            cmdFreeze(byPlayer);
            break;
        }
        case GameCommands.mute: {
            const remainingMessage = message.substr(message.indexOf(' ') + 1);
            cmdMute(byPlayer, remainingMessage);
            break;
        }
        case GameCommands.ban: {
            const remainingMessage = message.substr(message.indexOf(' ') + 1);
            cmdBan(byPlayer, remainingMessage);
            break;
        }
        default: {
            window.gameRoom._room.sendAnnouncement(LangRes.command._ErrorWrongCommand, byPlayer.id, 0xFF7777, "normal", 2);
            break;
        }
    }
}
