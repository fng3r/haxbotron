import { PlayerObject } from "../../model/GameObject/PlayerObject";
import * as LangRes from "../../resource/strings";
import { GameCommandKey } from "./GameCommands";
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

export type CommandHandler = (byPlayer: PlayerObject, commandArgs: any[]) => void | Promise<void>;

export class CommandExecutor {
    private readonly _commandHandlers: Map<GameCommandKey, CommandHandler>;

    constructor(commandHandlers: Map<GameCommandKey, CommandHandler>) {
        this._commandHandlers = commandHandlers;
    }

    public async executeCommand(commandName: GameCommandKey, byPlayer: PlayerObject, commandArgs: any[]): Promise<void> {
        if (!this._commandHandlers.has(commandName))
        {
            throw new Error(`Command '${commandName}' is not registered`);
        }
        const commandHandler = this._commandHandlers.get(commandName)!;
        await commandHandler(byPlayer, commandArgs);
    }
}

export class CommandExecutorBuilder {
    private readonly _commandHandlers: Map<GameCommandKey, CommandHandler>;
    private readonly _commandHelpMessages: Map<GameCommandKey, string>;

    public static new() {
        return new CommandExecutorBuilder();
    }

    private constructor() {
        this._commandHandlers = new Map();
        this._commandHelpMessages = new Map();
    }

    public addCommand(commandName: GameCommandKey, commandHandler: CommandHandler, commandHelp?: string): CommandExecutorBuilder {
        this._commandHandlers.set(commandName, commandHandler);
        if (commandHelp !== undefined) {
            this._commandHelpMessages.set(commandName, commandHelp);
        }

        return this;
    }

    public build(): CommandExecutor {
        this.addHelpCommand(this._commandHelpMessages);
        return new CommandExecutor(this._commandHandlers);
    }

    private addHelpCommand(helpMessages: Map<GameCommandKey, string>): void {
        const cmdHelp = buildHelpCommand(helpMessages);
        this.addCommand("help", (byPlayer, commandArgs) => {
            const [command] = commandArgs;
            cmdHelp(byPlayer, command);
        }, LangRes.command.helpman.help)
    }
}

export const commandExecutor = CommandExecutorBuilder.new()
    .addCommand("about", (byPlayer) => cmdAbout(byPlayer), LangRes.command.helpman.about)
    .addCommand("adm", (byPlayer) => cmdAdm(byPlayer), LangRes.command.helpman.adm)
    .addCommand("auth", (byPlayer, commandArgs) => {
        const [playerId] = commandArgs;
        cmdAuth(byPlayer, playerId);
    }, LangRes.command.helpman.auth)
    .addCommand("bb", (byPlayer) => cmdBb(byPlayer), LangRes.command.helpman.bb)
    .addCommand("deanon", (byPlayer, commandArgs) => {
        const [playerId] = commandArgs;
        cmdDeanon(byPlayer, playerId);
    }, LangRes.command.helpman.deanon)
    .addCommand("list", (byPlayer, commandArgs) => {
        const [playerGroup] = commandArgs;
        cmdList(byPlayer, playerGroup)
    }, LangRes.command.helpman.list)
    .addCommand("listroles", (byPlayer) => cmdListRoles(byPlayer), LangRes.command.helpman.listroles)
    .addCommand("map", (byPlayer, commandArgs) => {
        const [mapName] = commandArgs;
        cmdMap(byPlayer, mapName);
    }, LangRes.command.helpman.map)
    .addCommand("freeze", (byPlayer) => cmdFreeze(byPlayer), LangRes.command.helpman.freeze)
    .addCommand("mute", (byPlayer, commandArgs) => {
        const [playerIdentifier, muteDuration] = commandArgs;
        cmdMute(byPlayer, playerIdentifier, muteDuration);
    }, LangRes.command.helpman.mute)
    .addCommand("mutes", (byPlayer) => cmdMutes(byPlayer), LangRes.command.helpman.mutes)
    .addCommand("ban", (byPlayer, commandArgs) => {
        const [playerIdentifier, banDuration] = commandArgs;
        cmdBan(byPlayer, playerIdentifier, banDuration);
    }, LangRes.command.helpman.ban)
    .addCommand("bans", (byPlayer) => cmdBans(byPlayer), LangRes.command.helpman.bans)
    .addCommand("setpassword", (byPlayer, commandArgs) => {
        const [password] = commandArgs;
        cmdSetPassword(byPlayer, password);
    }, LangRes.command.helpman.setpassword)
    .addCommand("staff", (byPlayer) => cmdStaff(byPlayer), LangRes.command.helpman.staff)
    .addCommand("switch", (byPlayer) => cmdSwitch(byPlayer), LangRes.command.helpman.switch)
    .addCommand("teamChat", (byPlayer, commandArgs) => {
        const [message] = commandArgs
        cmdTeamChat(byPlayer, message);
    })
    .build();