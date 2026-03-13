import * as P from "parsimmon";
import { Parser } from "parsimmon";
import * as LangRes from "../../resource/strings";
import { RoomRuntime } from "../../runtime/RoomRuntime";
import { cmdAbout } from "./about";
import { cmdAdm } from "./adm";
import { cmdAuth } from "./auth";
import { cmdBan, cmdBans } from "./ban";
import { cmdBb } from "./bb";
import { cmdDeanon } from "./deanon";
import { cmdFreeze } from "./freeze";
import { buildHelpCommand } from "./help";
import { cmdList } from "./list";
import { cmdListRoles } from "./listroles";
import { cmdMap } from "./map";
import { cmdMute, cmdMutes } from "./mute";
import { cmdSetPassword } from "./setpassword";
import { cmdStaff } from "./staff";
import { cmdSwitch } from "./switch";
import { cmdTeamChat } from "./teamchat";

const COMMANDS_PREFIX = "!";

function command(name: GameCommandKey, altNames: readonly string[]): Parser<string> {
    const names = [name, ...altNames];
    const nameParsers = names.map((n) => P.string(n));
    return P.string(COMMANDS_PREFIX)
        .then(P.alt(...nameParsers))
        .skip(P.lookahead(P.alt(P.whitespace, P.eof)))
        .map(() => name);
}

function optional<T>(parser: Parser<T>): Parser<T | undefined> {
    return parser.or(P.of(undefined));
}

function toTuple(x: unknown): unknown[] {
    return Array.isArray(x) ? x : [x];
}

type ToArgs<T> =
  [T] extends [readonly unknown[]]
    ? T
    : readonly [T];

type CommandLang = {
    playerIdNumber: Parser<number>;
    playerId: Parser<string>;
    playerAuth: Parser<string>;
}

type CommandEntry<Name extends string, Args> = {
    name: Name;
    altNames?: readonly string[];
    argsParser?: (lang: CommandLang) => Parser<Args>;
    handle: (runtime: RoomRuntime, byPlayer: PlayerObject, ...args: ToArgs<Args>) => void | Promise<void>;
    help?: string;
}

function defineCommand<Name extends string, Args>(
    config: CommandEntry<Name, Args>
): CommandEntry<Name, Args> {
    return config;
}

const registry = [
    defineCommand({
        name: "about",
        handle: cmdAbout,
        help: LangRes.command.helpman.about,
    }),
    defineCommand({
        name: "adm",
        handle: cmdAdm,
        help: LangRes.command.helpman.adm,
    }),
    defineCommand({
        name: "auth",
        argsParser: (lang) => optional(P.whitespace.then(lang.playerIdNumber)),
        handle: cmdAuth,
        help: LangRes.command.helpman.auth,
    }),
    defineCommand({
        name: "bb",
        altNames: ["BB", "ии", "ИИ"],
        handle: cmdBb,
        help: LangRes.command.helpman.bb,
    }),
    defineCommand({
        name: "deanon",
        argsParser: (lang) =>
            P.whitespace.then(lang.playerIdNumber).map((id) => [id] as const),
        handle: cmdDeanon,
        help: LangRes.command.helpman.deanon,
    }),
    defineCommand({
        name: "freeze",
        handle: cmdFreeze,
        help: LangRes.command.helpman.freeze,
    }),
    defineCommand({
        name: "help",
        argsParser: () =>
            optional(P.whitespace.then(P.letter.atLeast(1).tie())).map((cmdName) => [cmdName] as const),
        handle: (runtime, byPlayer, commandName?: string) => {
            const cmdHelp = buildHelpCommand(helpMap);
            cmdHelp(runtime, byPlayer, commandName);
        },
        help: LangRes.command.helpman.help,
    }),
    defineCommand({
        name: "list",
        argsParser: () =>
            optional(P.whitespace.then(P.letter.atLeast(1).tie())).map((group) => [group] as const),
        handle: cmdList,
        help: LangRes.command.helpman.list,
    }),
    defineCommand({
        name: "listroles",
        handle: cmdListRoles,
        help: LangRes.command.helpman.listroles,
    }),
    defineCommand({
        name: "map",
        argsParser: () =>
            P.whitespace.then(P.regex(/\S+/)).map((name) => [name] as const),
        handle: cmdMap,
        help: LangRes.command.helpman.map,
    }),
    defineCommand({
        name: "ban",
        argsParser: (lang) =>
            P.seqMap(
                P.whitespace.then(P.alt(lang.playerId, lang.playerAuth)),
                optional(P.whitespace.then(P.digits.map(Number))),
                (id, dur) => [id, dur] as const
            ),
        handle: cmdBan,
        help: LangRes.command.helpman.ban,
    }),
    defineCommand({
        name: "bans",
        handle: cmdBans,
        help: LangRes.command.helpman.bans,
    }),
    defineCommand({
        name: "mute",
        argsParser: (lang) =>
            P.seqMap(
                P.whitespace.then(P.alt(lang.playerId, lang.playerAuth)),
                optional(P.whitespace.then(P.digits.map(Number))),
                (id, dur) => [id, dur] as const
            ),
        handle: cmdMute,
        help: LangRes.command.helpman.mute,
    }),
    defineCommand({
        name: "mutes",
        handle: cmdMutes,
        help: LangRes.command.helpman.mutes,
    }),
    defineCommand({
        name: "setpassword",
        argsParser: () => optional(P.whitespace.then(P.regex(/\S+/))),
        handle: cmdSetPassword,
        help: LangRes.command.helpman.setpassword,
    }),
    defineCommand({
        name: "staff",
        handle: cmdStaff,
        help: LangRes.command.helpman.staff,
    }),
    defineCommand({
        name: "switch",
        handle: cmdSwitch,
        help: LangRes.command.helpman.switch,
    }),
    defineCommand({
        name: "x",
        altNames: ["X", "ч", "Ч"],
        argsParser: () => P.whitespace.then(P.all),
        handle: cmdTeamChat,
    }),
] as const;

export type GameCommandKey = (typeof registry)[number]["name"];

type RegistryEntry = (typeof registry)[number];
type ArgsFor<Key extends GameCommandKey> = Extract<
    RegistryEntry,
    { name: Key }
> extends { handle: (runtime: RoomRuntime, by: PlayerObject, ...args: infer A) => unknown }
    ? A
    : never;


export type ParsedCommand = {
    [K in GameCommandKey]: { commandName: K; commandArgs: ArgsFor<K> };
}[GameCommandKey];

const helpMap = new Map<GameCommandKey, string>();
for (const entry of registry) {
    if (entry.help !== undefined) helpMap.set(entry.name, entry.help);
}

const parserLanguage = P.createLanguage({
    playerIdNumber: () => P.string("#").then(P.digits).map(Number),
    playerId: () => P.seq(P.string("#"), P.digits).tie(),
    playerAuth: () => P.seq(P.string("$"), P.regex(/\S+/)).tie(),
    commandExpression: (lang) => {
        const cmdLang: CommandLang = {
            playerIdNumber: lang.playerIdNumber,
            playerId: lang.playerId,
            playerAuth: lang.playerAuth,
        };
        return P.alt(
            ...registry.map((entry) => {
                const argsParser = entry.argsParser ? entry.argsParser(cmdLang) : P.of([] as const);

                return command(entry.name, entry.altNames ?? [])
                    .then(argsParser as Parser<ArgsFor<typeof entry.name>>)
                    .map((args) => ({
                        commandName: entry.name,
                        commandArgs: toTuple(args) as ArgsFor<typeof entry.name>
                    }));
            }),
        ).trim(P.optWhitespace);
    },
});

export function parseCommand(commandText: string): ParsedCommand | null {
    const result = parserLanguage.commandExpression.parse(commandText.trim());
    if (!result.status) return null;
    return result.value as ParsedCommand;
}

export interface CommandExecutor {
    executeCommand(byPlayer: PlayerObject, parsed: ParsedCommand): Promise<void>;
}

export function createCommandExecutor(runtime: RoomRuntime): CommandExecutor {
    return {
        async executeCommand(byPlayer: PlayerObject, parsed: ParsedCommand): Promise<void> {
            const entry = registry.find((r) => r.name === parsed.commandName);
            if (!entry) throw new Error(`Command '${parsed.commandName}' is not registered`);
            type Args = Parameters<typeof entry.handle> extends readonly [RoomRuntime, PlayerObject, ...infer A]
                ? A
                : never;
            await (entry.handle as (runtime: RoomRuntime, by: PlayerObject, ...args: Args) => void | Promise<void>)(
                runtime,
                byPlayer,
                ...(parsed.commandArgs)
            );
        },
    };
}

export function isCommandString(message: string): boolean {
    return message.startsWith(COMMANDS_PREFIX);
}

export function isTeamChatCommand(commandName: GameCommandKey): boolean {
    return commandName === "x";
}
