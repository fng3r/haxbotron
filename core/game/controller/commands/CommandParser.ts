import * as LangRes from "../../resource/strings";
import { PlayerObject } from "../../model/GameObject/PlayerObject";
import {GameCommands} from "./GameCommands";
import {commandExecutor} from "./CommandExecutor";
import {Parser} from "parsimmon";
import * as P from "parsimmon";

const COMMANDS_PREFIX = '!';

const customParsers = {
    command(commandName: string) : Parser<string> {
        return P.string(COMMANDS_PREFIX).then(P.string(commandName))
    }
}

const parserLanguage = P.createLanguage({
    commandExpression: lang => P
        .alt(
            lang.helpCommand,
            lang.aboutCommand,
            lang.authCommand,
            lang.bbCommand,
            lang.freezeCommand,
            lang.listCommand,
            lang.listRolesCommand,
            lang.banCommand,
            lang.bansCommand,
            lang.muteCommand,
            lang.mutesCommand,
            lang.setPasswordCommand,
            lang.staffCommand,
            lang.teamChatCommand,
            lang.switchCommand
        )
        .trim(P.optWhitespace)
        .skip(P.all),

    aboutCommand: _ => customParsers.command(GameCommands.about),

    authCommand: lang => P.seq(
        customParsers.command(GameCommands.auth),
        P.whitespace.then(lang.playerIdNumber).or(P.eof)
    ),

    bbCommand: _ => customParsers.command(GameCommands.bb).or(customParsers.command(GameCommands.bbAlt)),

    helpCommand: _ => P.seq(
        customParsers.command(GameCommands.help),
        P.whitespace.then(P.letter.atLeast(1).tie()).or(P.eof)
    ),

    freezeCommand: _ => customParsers.command(GameCommands.freeze),

    listCommand: _ => P.seq(
        customParsers.command(GameCommands.list),
        P.whitespace.then(P.letter.atLeast(1).tie()).or(P.eof)
    ),

    listRolesCommand: _ => customParsers.command(GameCommands.listroles),

    banCommand: lang => P.seq(
        customParsers.command(GameCommands.ban),
        P.whitespace.then(P.alt(lang.playerId, lang.playerAuth)),
        P.alt(
            P.whitespace.then(P.digits.map(Number)),
            P.eof
        )
    ),

    bansCommand: _ => customParsers.command(GameCommands.bans),

    muteCommand: lang => P.seq(
        customParsers.command(GameCommands.mute),
        P.whitespace.then(P.alt(lang.playerId, lang.playerAuth)),
        P.alt(
            P.whitespace.then(P.digits.map(Number)),
            P.eof
        )
    ),

    mutesCommand: _ => customParsers.command(GameCommands.mutes),

    setPasswordCommand: _ => P.seq(
        customParsers.command(GameCommands.setpassword),
        P.alt(
            P.whitespace.then(P.regex(/\S+/)),
            P.eof
        )
    ),

    staffCommand: _ => customParsers.command(GameCommands.staff),

    switchCommand: _ => customParsers.command(GameCommands.switch),

    teamChatCommand: _ => P.seq(
        customParsers.command(GameCommands.teamChat).or(customParsers.command(GameCommands.teamChatAlt)),
        P.whitespace.then(P.all)
    ),

    command: _ => P.string('!').then(P.letter.atLeast(1).tie()),

    playerIdNumber: _ => P.string('#').then(P.digits).map(Number),

    playerId: _ => P
        .seq(
            P.string('#'),
            P.digits
        )
        .tie(),

    playerAuth: _ => P
        .seq(
            P.string('$'),
            P.regex(/\S+/)
        )
        .tie(),
});

export function executeCommand(byPlayer: PlayerObject, command: string): void {
    command = command.trim();
    const parseCommandResult = parserLanguage.commandExpression.parse(command);
    if (!parseCommandResult.status)
    {
        window.gameRoom._room.sendAnnouncement(LangRes.command._ErrorWrongCommand, byPlayer.id, 0xFF7777, "normal", 2);
        return;
    }

    const [commandName, ...commandArgs] = Array.isArray(parseCommandResult.value) ? parseCommandResult.value : [parseCommandResult.value];

    try {
        commandExecutor.executeCommand(byPlayer, commandName, commandArgs);
    }
    catch (e) {
        window.gameRoom.logger.e('executeCommand', `Failed to execute command '${commandName}'`);
    }
}

export function isCommandString(message: string): boolean {
    return message.charAt(0) == COMMANDS_PREFIX;
}

export function isTeamChatCommand(message: string): boolean {
    return message.startsWith(`${COMMANDS_PREFIX}${GameCommands.teamChat}`) || message.startsWith(`${COMMANDS_PREFIX}${GameCommands.teamChatAlt}`);
}
