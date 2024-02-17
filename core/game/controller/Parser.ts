import * as LangRes from "../resource/strings";
import { PlayerObject } from "../model/GameObject/PlayerObject";
import { cmdAbout } from "./commands/about";
import { cmdHelp } from "./commands/help";
import { cmdList } from "./commands/list";
import { cmdFreeze } from "./commands/freeze";
import { cmdMute } from "./commands/mute";
import { cmdBan } from "./commands/ban";
import {cmdSetPassword} from "./commands/setpassword";
import {GameCommands} from "./commands/GameCommands";
import parserLanguage from "./ParserLanguage";

const COMMANDS_PREFIX = '!';

// if given string is command chat, this function returns true, nor false.
export function isCommandString(message: string): boolean {
    return message.charAt(0) == COMMANDS_PREFIX;
}

// parse command message and execute it (need to check if it's command)
export function executeCommand(byPlayer: PlayerObject, message: string): void {
    message = message.trim();
    const parseCommandResult = parserLanguage.commandExpression.parse(message);
    if (!parseCommandResult.status)
    {
        window.gameRoom._room.sendAnnouncement(LangRes.command._ErrorWrongCommand, byPlayer.id, 0xFF7777, "normal", 2);
        return;
    }

    const [commandName, ...commandArgs] = Array.isArray(parseCommandResult.value) ? parseCommandResult.value : [parseCommandResult.value];
    switch(commandName) {
        case GameCommands.help: {
            const [subCommand] = commandArgs
            cmdHelp(byPlayer, subCommand);
            break;
        }
        case GameCommands.about: {
            cmdAbout(byPlayer);
            break;
        }
        case GameCommands.list: {
            const [playerGroup] = commandArgs;
            cmdList(byPlayer, playerGroup)
            break;
        }
        case GameCommands.freeze: {
            cmdFreeze(byPlayer);
            break;
        }
        case GameCommands.mute: {
            const [playerIdentifier, muteDuration] = commandArgs;
            cmdMute(byPlayer, playerIdentifier, muteDuration);
            break;
        }
        case GameCommands.ban: {
            const [playerIdentifier, banDuration] = commandArgs;
            cmdBan(byPlayer, playerIdentifier, banDuration);
            break;
        }
        case GameCommands.setpassword: {
            const [password] = commandArgs;
            cmdSetPassword(byPlayer, password);
            break;
        }
    }
}
