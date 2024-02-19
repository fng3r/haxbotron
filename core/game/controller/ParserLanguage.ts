import * as P from "parsimmon";
import { Parser } from "parsimmon";
import {GameCommands} from "./commands/GameCommands";

const CustomParsers = {
    command(commandName: string) : Parser<string> {
        return P.string('!').then(P.string(commandName))
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

    aboutCommand: _ => CustomParsers.command(GameCommands.about),

    authCommand: lang => P.seq(
        CustomParsers.command(GameCommands.auth),
        P.whitespace.then(lang.playerIdNumber).or(P.eof)
    ),

    bbCommand: _ => CustomParsers.command(GameCommands.bb).or(CustomParsers.command(GameCommands.bbAlt)),

    helpCommand: _ => P.seq(
        CustomParsers.command(GameCommands.help),
        P.whitespace.then(P.letter.atLeast(1).tie()).or(P.eof)
    ),

    freezeCommand: _ => CustomParsers.command(GameCommands.freeze),

    listCommand: _ => P.seq(
        CustomParsers.command(GameCommands.list),
        P.whitespace.then(P.letter.atLeast(1).tie()).or(P.eof)
    ),

    banCommand: lang => P.seq(
        CustomParsers.command(GameCommands.ban),
        P.whitespace.then(P.alt(lang.playerId, lang.playerAuth)),
        P.alt(
            P.whitespace.then(P.digits.map(Number)),
            P.eof
        )
    ),

    bansCommand: _ => CustomParsers.command(GameCommands.bans),

    muteCommand: lang => P.seq(
        CustomParsers.command(GameCommands.mute),
        P.whitespace.then(P.alt(lang.playerId, lang.playerAuth)),
        P.alt(
            P.whitespace.then(P.digits.map(Number)),
            P.eof
        )
    ),

    mutesCommand: _ => CustomParsers.command(GameCommands.mutes),

    setPasswordCommand: _ => P.seq(
        CustomParsers.command(GameCommands.setpassword),
        P.alt(
            P.whitespace.then(P.regex(/\S+/)),
            P.eof
        )
    ),

    staffCommand: _ => CustomParsers.command(GameCommands.staff),

    switchCommand: _ => CustomParsers.command(GameCommands.switch),

    teamChatCommand: _ => P.seq(
        CustomParsers.command(GameCommands.teamChat).or(CustomParsers.command(GameCommands.teamChatAlt)),
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

export default parserLanguage;