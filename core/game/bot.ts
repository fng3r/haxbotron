// ENTRYPOINT

import { generateRandomString } from "../lib/utils";
import { getUnixTimestamp } from "./controller/DateTimeUtils";
import * as eventListener from "./controller/events/eventListeners";
import { Logger } from "./controller/Logger";
import * as Tst from "./controller/Translator";
import { GameRoomConfig } from "./model/Configuration/GameRoomConfig";
import { Player } from "./model/GameObject/Player";
import { PlayerObject } from "./model/GameObject/PlayerObject";
import { ScoresObject } from "./model/GameObject/ScoresObject";
import { TeamID } from "./model/GameObject/TeamID";
import * as LangRes from "./resource/strings";
import { ServiceContainer } from "./services/ServiceContainer";


makeRoom();


// ====================================================================================================
// create room, set defaults settings and register event handlers
function makeRoom(): void {
    createRoom();
    
    setDefaultSettings();
    
    setEventHandlers();
    
    runBackgroundTasks();
}


// ====================================================================================================
// start room with loaded config
function createRoom(): void {
    const logger = Logger.getInstance();
    logger.i('initialization', `Loading initial config and open the game room...`);

    // load initial configurations
    const loadedConfig: GameRoomConfig = JSON.parse(localStorage.getItem('_initConfig')!);
    const discordWebhook = JSON.parse(localStorage.getItem('_discordWebhookConfig')!);
    const defaultStadium = localStorage.getItem('_defaultMap')!;

    const room = window.HBInit(loadedConfig._config);
    const adminPassword = generateRandomString();

    // Initialize new service container
    const services = ServiceContainer.initialize(
        room,
        loadedConfig,
        adminPassword,
        discordWebhook,
        logger
    );

    // Set stadium data from localStorage (injected by browser.ts)
    services.room.setDefaultStadium(defaultStadium);
   
    services.logger.i('initialization', `The game room is opened at ${services.config.getConfig()._LaunchDate.toLocaleString()}. RUID: ${services.config.getRUID()}`);

    // clear localStorage
    localStorage.removeItem('_initConfig');
    localStorage.removeItem('_defaultMap');
    localStorage.removeItem('_discordWebhookConfig');

    window.document.title = `Haxbotron ${services.config.getRUID()}`;
    window.services = services;
    
    console.log(`Haxbotron loaded bot script. (RUID ${services.config.getRUID()}, TOKEN ${services.config.getConfig()._config.token})`);
}


function setDefaultSettings(): void {
    const services = ServiceContainer.getInstance();
    const config = services.config.getConfig();
    
    services.room.loadDefaultStadium();
    services.room.setScoreLimit(config.rules.scoreLimit);
    services.room.setTimeLimit(config.rules.timeLimit);
    services.room.setTeamsLock(config.rules.teamLock);

    const webhook = services.social.getDiscordWebhook();
    window._feedSocialDiscordWebhook(
        webhook.passwordWebhookId,
        webhook.passwordWebhookToken,
        {
            type: "password",
            roomId: services.config.getRUID(),
            password: services.config.getAdminPassword()
        }
    );

    services.logger.i('initialization', `Room default settings were set according to loaded config`);
}


function setEventHandlers(): void {
    const services = ServiceContainer.getInstance();
    const room = services.room.getRoom();
    
    services.logger.i('initialization', `Register game room event handlers...`);

    room.onPlayerJoin = async (player: PlayerObject): Promise<void> => await eventListener.onPlayerJoinListener(player);
    room.onPlayerLeave = async (player: PlayerObject): Promise<void> => await eventListener.onPlayerLeaveListener(player);
    room.onTeamVictory = async (scores: ScoresObject): Promise<void> => await eventListener.onTeamVictoryListener(scores);
    room.onPlayerChat = (player: PlayerObject, message: string): boolean => eventListener.onPlayerChatListener(player, message);
    room.onTeamGoal = async (team: TeamID): Promise<void> => await eventListener.onTeamGoalListener(team);
    room.onPlayerBallKick = (byPlayer: PlayerObject): void => eventListener.onPlayerBallKickListener(byPlayer);
    room.onPlayerTeamChange = (changedPlayer: PlayerObject, byPlayer: PlayerObject): void => eventListener.onPlayerTeamChangeListener(changedPlayer, byPlayer);
    room.onGameStart = (byPlayer: PlayerObject): void => eventListener.onGameStartListener(byPlayer);
    room.onGameStop = (byPlayer: PlayerObject): void => eventListener.onGameStopListener(byPlayer);
    room.onPlayerAdminChange = (changedPlayer: PlayerObject, byPlayer: PlayerObject): void => eventListener.onPlayerAdminChangeListener(changedPlayer, byPlayer);
    room.onPlayerKicked = async (kickedPlayer: PlayerObject, reason: string, ban: boolean, byPlayer: PlayerObject): Promise<void> => await eventListener.onPlayerKickedListener(kickedPlayer, reason, ban, byPlayer);
    room.onGameTick = () => eventListener.onGameTickListener();
    room.onGamePause = (byPlayer: PlayerObject): void => eventListener.onGamePauseListener(byPlayer);
    room.onGameUnpause = (byPlayer: PlayerObject): void => eventListener.onGameUnpauseListener(byPlayer);
    room.onStadiumChange = (newStadiumName: string, byPlayer: PlayerObject): void => eventListener.onStadiumChangeListner(newStadiumName, byPlayer);
    room.onRoomLink = (url: string): void => eventListener.onRoomLinkListener(url);

    services.logger.i('initialization', `All event handlers were registered`);
}


function runBackgroundTasks(): void {
    const services = ServiceContainer.getInstance();
    
    services.logger.i('initialization', `Run timers for executing background tasks...`);

    const advertisementTimer = setInterval(() => {
        if (LangRes.scheduler.advertise) {
            services.room.sendAnnouncement(LangRes.scheduler.advertise, null, 0xF4F4F4, "normal", 0);
        }
    }, 600_000); // 10 mins
    
    const autoUnmuteTimer = setInterval(() => {
        const nowTimeStamp: number = getUnixTimestamp();
    
        let placeholderScheduler = {
            targetID: 0,
            targetName: '',
        }
    
        services.player.getPlayerList().forEach((player: Player) => { // auto unmute system
            placeholderScheduler.targetID = player.id;
            placeholderScheduler.targetName = player.name;
    
            // check muted player and unmute when it's time to unmute
            if (player.permissions.mute && player.permissions.muteExpire !== -1 && nowTimeStamp > player.permissions.muteExpire) {
                player.permissions.mute = false;
                services.chat.clearChatActivity(player.id); // clear previous chat activity on unmute
                services.room.sendAnnouncement(Tst.maketext(LangRes.scheduler.autoUnmute, placeholderScheduler), null, 0x479947, "normal", 0);
                window._emitSIOPlayerStatusChangeEvent(player.id);
            }
        });
    }, 5000); // 5 secs

    services.logger.i('initialization', `Background tasks are running now`);
}