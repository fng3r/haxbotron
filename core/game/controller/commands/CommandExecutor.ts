import {PlayerObject} from "../../model/GameObject/PlayerObject";
import * as LangRes from "../../resource/strings";
import {GameCommands} from "./GameCommands";
import {cmdHelp} from "./help";
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

export class CommandExecutor {
    private readonly _commandHandlers: Map<string, Function>;

    constructor(commandHandlers: Map<string, Function>) {
        this._commandHandlers = commandHandlers;
    }

    public executeCommand(byPlayer: PlayerObject, commandName: string, commandArgs: any[]): void {
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
    private readonly _commandHandlers: Map<string, Function>;

    public static new() {
        return new CommandExecutorBuilder();
    }

    private constructor() {
        this._commandHandlers = new Map();
    }

    public addCommand(commandName: string, commandHandler: (byPlayer: PlayerObject, commandArgs: any[]) => void): CommandExecutorBuilder {
        this._commandHandlers.set(commandName, commandHandler);

        return this;
    }

    public addCommands(commandName: string, commandAltName: string, commandHandler: (byPlayer: PlayerObject, commandArgs: any[]) => void): CommandExecutorBuilder {
        this._commandHandlers.set(commandName, commandHandler);
        this._commandHandlers.set(commandAltName, commandHandler);

        return this;
    }

    public build(): CommandExecutor {
        return new CommandExecutor(this._commandHandlers);
    }
}

export const commandExecutor = CommandExecutorBuilder.new()
    .addCommand(GameCommands.help, (byPlayer, commandArgs) => {
        const [subCommand] = commandArgs;
        cmdHelp(byPlayer, subCommand);
    })
    .addCommand(GameCommands.about, (byPlayer, commandArgs) => cmdAbout(byPlayer))
    .addCommand(GameCommands.auth, (byPlayer, commandArgs) => {
        const [playerId] = commandArgs;
        cmdAuth(byPlayer, playerId);
    })
    .addCommands(GameCommands.bb, GameCommands.bbAlt, (byPlayer, commandArgs) => cmdBb(byPlayer))
    .addCommand(GameCommands.list, (byPlayer, commandArgs) => {
        const [playerGroup] = commandArgs;
        cmdList(byPlayer, playerGroup)
    })
    .addCommand(GameCommands.listroles, (byPlayer, commandArgs) => cmdListRoles(byPlayer))
    .addCommand(GameCommands.freeze, (byPlayer, commandArgs) => cmdFreeze(byPlayer))
    .addCommand(GameCommands.mute,(byPlayer, commandArgs) => {
        const [playerIdentifier, muteDuration] = commandArgs;
        cmdMute(byPlayer, playerIdentifier, muteDuration);
    })
    .addCommand(GameCommands.mutes, (byPlayer) => cmdMutes(byPlayer))
    .addCommand(GameCommands.ban, (byPlayer, commandArgs) => {
        const [playerIdentifier, banDuration] = commandArgs;
        cmdBan(byPlayer, playerIdentifier, banDuration);
    })
    .addCommand(GameCommands.bans, (byPlayer) => cmdBans(byPlayer))
    .addCommand(GameCommands.setpassword, (byPlayer, commandArgs) => {
        const [password] = commandArgs;
        cmdSetPassword(byPlayer, password);
    })
    .addCommand(GameCommands.staff, (byPlayer) => cmdStaff(byPlayer))
    .addCommand(GameCommands.switch, (byPlayer) => cmdSwitch(byPlayer))
    .addCommands(GameCommands.teamChat, GameCommands.teamChatAlt, (byPlayer, commandArgs) => {
        const [message] = commandArgs
        cmdTeamChat(byPlayer, message);
    })
    .build();