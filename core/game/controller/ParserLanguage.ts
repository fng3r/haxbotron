import * as P from "parsimmon";
import { Parser } from "parsimmon";

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
            lang.freezeCommand,
            lang.listCommand,
            lang.banCommand,
            lang.muteCommand,
            lang.mutesCommand,
            lang.setPasswordCommand,
            lang.staffCommand
        )
        .trim(P.optWhitespace)
        .skip(P.all),

    aboutCommand: _ => CustomParsers.command('about'),

    authCommand: lang => P.seq(
        CustomParsers.command('auth'),
        P.whitespace.then(lang.playerIdNumber).or(P.eof)
    ),

    helpCommand: _ => P.seq(
        CustomParsers.command('help'),
        P.whitespace.then(P.letter.atLeast(1).tie()).or(P.eof)
    ),

    freezeCommand: _ => CustomParsers.command('freeze'),

    listCommand: _ => P.seq(
        CustomParsers.command('list'),
        P.whitespace.then(P.letter.atLeast(1).tie()).or(P.eof)
    ),

    banCommand: lang => P.seq(
        CustomParsers.command('ban'),
        P.whitespace.then(P.alt(lang.playerId, lang.playerAuth)),
        P.alt(
            P.whitespace.then(P.digits.map(Number)),
            P.eof
        )
    ),

    muteCommand: lang => P.seq(
        CustomParsers.command('mute'),
        P.whitespace.then(P.alt(lang.playerId, lang.playerAuth)),
        P.alt(
            P.whitespace.then(P.digits.map(Number)),
            P.eof
        )
    ),

    mutesCommand: _ => CustomParsers.command('mutes'),

    setPasswordCommand: _ => P.seq(
        CustomParsers.command('setpassword'),
        P.alt(
            P.whitespace.then(P.regex(/\S+/)),
            P.eof
        )
    ),

    staffCommand: _ => CustomParsers.command('staff'),

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