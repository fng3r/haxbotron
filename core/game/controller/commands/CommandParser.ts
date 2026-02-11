import * as P from "parsimmon";
import { Parser } from "parsimmon";
import { GameCommandKey, GameCommands } from "./GameCommands";

const COMMANDS_PREFIX = '!';

const command = (commandKey: GameCommandKey): Parser<GameCommandKey> => {
    const commandDef = GameCommands[commandKey];
    const names = [commandDef.primaryName, ...commandDef.altNames];
    const nameParsers = names.map((name) => P.string(name));
    return P.string(COMMANDS_PREFIX)
        .then(P.alt(...nameParsers))
        .skip(P.lookahead(P.alt(P.whitespace, P.eof)))
        .map(() => commandKey);
};

const optional = <T>(parser: Parser<T>): Parser<T | undefined> => parser.or(P.of(undefined));

const parserLanguage = P.createLanguage({
    commandExpression: lang => P
        .alt(
            lang.helpCommand,
            lang.aboutCommand,
            lang.admCommand,
            lang.authCommand,
            lang.bbCommand,
            lang.deanonCommand,
            lang.freezeCommand,
            lang.listCommand,
            lang.listRolesCommand,
            lang.mapCommand,
            lang.banCommand,
            lang.bansCommand,
            lang.muteCommand,
            lang.mutesCommand,
            lang.setPasswordCommand,
            lang.staffCommand,
            lang.teamChatCommand,
            lang.switchCommand
        )
        .trim(P.optWhitespace),

    aboutCommand: _ => command("about"),

    admCommand: _ => command("adm"),

    authCommand: lang => P.seq(
        command("auth"),
        optional(P.whitespace.then(lang.playerIdNumber))
    ),

    bbCommand: _ => command("bb"),

    deanonCommand: lang => P.seq(
        command("deanon"),
        P.whitespace.then(lang.playerIdNumber)
    ),

    helpCommand: _ => P.seq(
        command("help"),
        optional(P.whitespace.then(P.letter.atLeast(1).tie()))
    ),

    freezeCommand: _ => command("freeze"),

    listCommand: _ => P.seq(
        command("list"),
        optional(P.whitespace.then(P.letter.atLeast(1).tie()))
    ),

    listRolesCommand: _ => command("listroles"),

    mapCommand: _ => P.seq(
        command("map"),
        P.whitespace.then(P.regex(/\S+/))
    ),

    banCommand: lang => P.seq(
        command("ban"),
        P.whitespace.then(P.alt(lang.playerId, lang.playerAuth)),
        optional(P.whitespace.then(P.digits.map(Number)))
    ),

    bansCommand: _ => command("bans"),

    muteCommand: lang => P.seq(
        command("mute"),
        P.whitespace.then(P.alt(lang.playerId, lang.playerAuth)),
        optional(P.whitespace.then(P.digits.map(Number)))
    ),

    mutesCommand: _ => command("mutes"),

    setPasswordCommand: _ => P.seq(
        command("setpassword"),
        optional(P.whitespace.then(P.regex(/\S+/)))
    ),

    staffCommand: _ => command("staff"),

    switchCommand: _ => command("switch"),

    teamChatCommand: _ => P.seq(
        command("teamChat"),
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

export interface ParsedCommand {
    commandName: GameCommandKey;
    commandArgs: any[];
}

export function parseCommand(command: string): ParsedCommand | null {
    const parseCommandResult = parserLanguage.commandExpression.parse(command.trim());
    if (!parseCommandResult.status) {
        return null;
    }

    const [commandName, ...commandArgs] = Array.isArray(parseCommandResult.value)
        ? parseCommandResult.value
        : [parseCommandResult.value];

    return {
        commandName,
        commandArgs
    };
}

export function isCommandString(message: string): boolean {
    return message.startsWith(COMMANDS_PREFIX);
}

export function isTeamChatCommand(message: string): boolean {
    const { primaryName, altNames } = GameCommands.teamChat;
    const prefixedNames = [primaryName, ...(altNames || [])].map((name) => `${COMMANDS_PREFIX}${name}`);
    return prefixedNames.some((name) => message.startsWith(name));
}
