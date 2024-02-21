import {PlayerObject} from "../../model/GameObject/PlayerObject";
import * as LangRes from "../../resource/strings";
import {GameCommands} from "./GameCommands";
import {cmdAbout} from "./about";
import {cmdAuth} from "./auth";
import {cmdBb} from "./bb";
import {cmdList} from "./list";
import {cmdListRoles} from "./listroles";
import {cmdFreeze} from "./freeze";
import {cmdMute, cmdMutes} from "./mute";
import {cmdBan, cmdBans} from "./ban";
import {cmdSetPassword} from "./setpassword";
import {cmdStaff} from "./staff";
import {cmdSwitch} from "./switch";
import {cmdTeamChat} from "./teamchat";
import {cmdDeanon} from "./deanon";
import {cmdMap} from "./map";

export class CommandExecutor {
    private readonly _commandHandlers: Map<GameCommands, Function>;

    constructor(commandHandlers: Map<GameCommands, Function>) {
        this._commandHandlers = commandHandlers;
    }

    public executeCommand(byPlayer: PlayerObject, commandName: GameCommands, commandArgs: any[]): void {
        if (!this._commandHandlers.has(commandName))
        {
            window.gameRoom._room.sendAnnouncement(LangRes.command._ErrorWrongCommand, byPlayer.id, 0xFF7777, "normal", 2);
            return;
        }
        const commandHandler = this._commandHandlers.get(commandName)!;
        commandHandler(byPlayer, commandArgs);
    }
}

export class CommandExecutorBuilder {
    private readonly _commandHandlers: Map<GameCommands, Function>;
    private readonly _commandHelpMessages: Map<GameCommands, string>;

    public static new() {
        return new CommandExecutorBuilder();
    }

    private constructor() {
        this._commandHandlers = new Map();
        this._commandHelpMessages = new Map();
    }

    public addCommand(commandName: GameCommands, commandHelp: string | null, commandHandler: (byPlayer: PlayerObject, commandArgs: any[]) => void): CommandExecutorBuilder {
        this._commandHandlers.set(commandName, commandHandler);
        if (commandHelp !== null) {
            this._commandHelpMessages.set(commandName, commandHelp);
        }

        return this;
    }

    public addCommands(commandName: GameCommands, commandAltName: GameCommands, commandHelp: string | null, commandHandler: (byPlayer: PlayerObject, commandArgs: any[]) => void): CommandExecutorBuilder {
        this._commandHandlers.set(commandName, commandHandler);
        this._commandHandlers.set(commandAltName, commandHandler);
        if (commandHelp !== null) {
            this._commandHelpMessages.set(commandName, commandHelp);
        }

        return this;
    }

    public build(): CommandExecutor {
        this.addHelpCommand(this._commandHelpMessages);
        return new CommandExecutor(this._commandHandlers);
    }

    private addHelpCommand(helpMessages: Map<string, string>): void {
        function cmdHelp(byPlayer: PlayerObject, command?: string): void {
            if (command === undefined || command === null) {
                window.gameRoom._room.sendAnnouncement(LangRes.command.help, byPlayer.id, 0x479947, "normal", 1);
                return;
            }

            if (helpMessages.has(command)) {
                const commandHelp = helpMessages.get(command)!;
                window.gameRoom._room.sendAnnouncement(commandHelp, byPlayer.id, 0x479947, "normal", 1);
            } else {
                window.gameRoom._room.sendAnnouncement(LangRes.command.helpman._ErrorWrongCommand, byPlayer.id, 0xFF7777, "normal", 2);
            }
        }

        this.addCommand(GameCommands.help, LangRes.command.helpman.help, (byPlayer, commandArgs) => {
            const [command] = commandArgs;
            cmdHelp(byPlayer, command);
        })
    }
}

export const commandExecutor = CommandExecutorBuilder.new()
    .addCommand(GameCommands.about, LangRes.command.helpman.about, (byPlayer) => cmdAbout(byPlayer))
    .addCommand(GameCommands.auth, LangRes.command.helpman.auth, (byPlayer, commandArgs) => {
        const [playerId] = commandArgs;
        cmdAuth(byPlayer, playerId);
    })
    .addCommands(GameCommands.bb, GameCommands.bbAlt, LangRes.command.helpman.bb, (byPlayer) => cmdBb(byPlayer))
    .addCommand(GameCommands.deanon, LangRes.command.helpman.deanon, (byPlayer, commandArgs) => {
        const [playerId] = commandArgs;
        cmdDeanon(byPlayer, playerId);
    })
    .addCommand(GameCommands.list, LangRes.command.helpman.list, (byPlayer, commandArgs) => {
        const [playerGroup] = commandArgs;
        cmdList(byPlayer, playerGroup)
    })
    .addCommand(GameCommands.listroles, LangRes.command.helpman.listroles, (byPlayer) => cmdListRoles(byPlayer))
    .addCommand(GameCommands.map, LangRes.command.helpman.map, (byPlayer, commandArgs) => {
        const [mapName] = commandArgs;
        cmdMap(byPlayer, mapName);
    })
    .addCommand(GameCommands.freeze, LangRes.command.helpman.freeze, (byPlayer) => cmdFreeze(byPlayer))
    .addCommand(GameCommands.mute, LangRes.command.helpman.mute, (byPlayer, commandArgs) => {
        const [playerIdentifier, muteDuration] = commandArgs;
        cmdMute(byPlayer, playerIdentifier, muteDuration);
    })
    .addCommand(GameCommands.mutes, LangRes.command.helpman.mutes, (byPlayer) => cmdMutes(byPlayer))
    .addCommand(GameCommands.ban, LangRes.command.helpman.ban, (byPlayer, commandArgs) => {
        const [playerIdentifier, banDuration] = commandArgs;
        cmdBan(byPlayer, playerIdentifier, banDuration);
    })
    .addCommand(GameCommands.bans, LangRes.command.helpman.bans, (byPlayer) => cmdBans(byPlayer))
    .addCommand(GameCommands.setpassword, LangRes.command.helpman.setpassword, (byPlayer, commandArgs) => {
        const [password] = commandArgs;
        cmdSetPassword(byPlayer, password);
    })
    .addCommand(GameCommands.staff, LangRes.command.helpman.staff, (byPlayer) => cmdStaff(byPlayer))
    .addCommand(GameCommands.switch, LangRes.command.helpman.switch, (byPlayer) => cmdSwitch(byPlayer))
    .addCommands(GameCommands.teamChat, GameCommands.teamChatAlt, null, (byPlayer, commandArgs) => {
        const [message] = commandArgs
        cmdTeamChat(byPlayer, message);
    })
    .build();