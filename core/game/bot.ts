// ENTRYPOINT

import { generateRandomString } from "../lib/utils";
import { getUnixTimestamp } from "./controller/DateTimeUtils";
import * as eventListener from "./controller/events/eventListeners";
import { Logger } from "./controller/Logger";
import * as Tst from "./controller/Translator";
import ChatActivityMap from "./model/ChatActivityMap";
import { GameRoomConfig } from "./model/Configuration/GameRoomConfig";
import { EmergencyTools } from "./model/ExposeLibs/EmergencyTools";
import { KickStack } from "./model/GameObject/BallTrace";
import { Player } from "./model/GameObject/Player";
import { PlayerObject } from "./model/GameObject/PlayerObject";
import { PlayersSet } from "./model/GameObject/PlayersSet";
import { ScoresObject } from "./model/GameObject/ScoresObject";
import { TeamID } from "./model/GameObject/TeamID";
import * as LangRes from "./resource/strings";


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

    const room = window.HBInit(loadedConfig._config);
    window.gameRoom = {
        _room: room
        ,config: loadedConfig
        ,link: ''
        ,social: {
            discordWebhook: discordWebhook
        }
        ,stadiumData: {
            default: localStorage.getItem('_defaultMap')!
        }
        ,bannedWordsPool: {
            nickname: []
            ,chat: []
        }
        ,teamColours: {
            red: { angle: 0, textColour: 0xffffff, teamColour1: 0xe66e55, teamColour2: 0xe66e55, teamColour3: 0xe66e55 }
            ,blue: { angle: 0, textColour: 0xffffff, teamColour1: 0x5a89e5, teamColour2: 0x5a89e5, teamColour3: 0x5a89e5 }
        }
        ,matchStats: {
            startedAt: Date.now(),
            startingLineup: {
                red: [],
                blue: []
            },
            scores: {
                red: 0,
                blue: 0,
                time: 0
            }
        }
        ,logger: logger
        ,adminPassword: generateRandomString()
        ,isGamingNow: false
        ,isMuteAll: false
        ,playerList: new PlayersSet()
        ,playerRoles: new Map()
        ,ballStack: KickStack.getInstance()
        ,antiTrollingChatFloodMap: new ChatActivityMap(loadedConfig.settings.chatFloodCriterion)
        ,notice: ''
        ,onEmergency: EmergencyTools
    }
    
    window.gameRoom.logger.i('initialization', `The game room is opened at ${window.gameRoom.config._LaunchDate.toLocaleString()}. RUID: ${window.gameRoom.config._RUID}`);

    // clear localStorage
    localStorage.removeItem('_initConfig');
    localStorage.removeItem('_defaultMap');

    window.document.title = `Haxbotron ${window.gameRoom.config._RUID}`;
    
    console.log(`Haxbotron loaded bot script. (RUID ${window.gameRoom.config._RUID}, TOKEN ${window.gameRoom.config._config.token})`);
}


function setDefaultSettings(): void {
    window.gameRoom._room.setCustomStadium(window.gameRoom.stadiumData.default);
    window.gameRoom._room.setScoreLimit(window.gameRoom.config.rules.scoreLimit);
    window.gameRoom._room.setTimeLimit(window.gameRoom.config.rules.timeLimit);
    window.gameRoom._room.setTeamsLock(window.gameRoom.config.rules.teamLock);

    window._feedSocialDiscordWebhook(window.gameRoom.social.discordWebhook.passwordWebhookId, window.gameRoom.social.discordWebhook.passwordWebhookToken, "password", {
        message: Tst.maketext(
            LangRes.onStop.feedSocialDiscordWebhook.adminPasswordMessage, {
                roomId: window.gameRoom.config._RUID
                ,password: window.gameRoom.adminPassword
            })
    });

    window.gameRoom.logger.i('initialization', `Room default settings were set according to loaded config`);
}


function setEventHandlers(): void {
    window.gameRoom.logger.i('initialization', `Register game room event handlers...`);

    window.gameRoom._room.onPlayerJoin = async (player: PlayerObject): Promise<void> => await eventListener.onPlayerJoinListener(player);
    window.gameRoom._room.onPlayerLeave = async (player: PlayerObject): Promise<void> => await eventListener.onPlayerLeaveListener(player);
    window.gameRoom._room.onTeamVictory = async (scores: ScoresObject): Promise<void> => await eventListener.onTeamVictoryListener(scores);
    window.gameRoom._room.onPlayerChat = (player: PlayerObject, message: string): boolean => eventListener.onPlayerChatListener(player, message);
    window.gameRoom._room.onTeamGoal = async (team: TeamID): Promise<void> => await eventListener.onTeamGoalListener(team);
    window.gameRoom._room.onPlayerBallKick = (byPlayer: PlayerObject): void => eventListener.onPlayerBallKickListener(byPlayer);
    window.gameRoom._room.onPlayerTeamChange = (changedPlayer: PlayerObject, byPlayer: PlayerObject): void => eventListener.onPlayerTeamChangeListener(changedPlayer, byPlayer);
    window.gameRoom._room.onGameStart = (byPlayer: PlayerObject): void => eventListener.onGameStartListener(byPlayer);
    window.gameRoom._room.onGameStop = (byPlayer: PlayerObject): void => eventListener.onGameStopListener(byPlayer);
    window.gameRoom._room.onPlayerAdminChange = (changedPlayer: PlayerObject, byPlayer: PlayerObject): void => eventListener.onPlayerAdminChangeListener(changedPlayer, byPlayer);
    window.gameRoom._room.onPlayerKicked = async (kickedPlayer: PlayerObject, reason: string, ban: boolean, byPlayer: PlayerObject): Promise<void> => await eventListener.onPlayerKickedListener(kickedPlayer, reason, ban, byPlayer);
    window.gameRoom._room.onGameTick = () => eventListener.onGameTickListener();
    window.gameRoom._room.onGamePause = (byPlayer: PlayerObject): void => eventListener.onGamePauseListener(byPlayer);
    window.gameRoom._room.onGameUnpause = (byPlayer: PlayerObject): void => eventListener.onGameUnpauseListener(byPlayer);
    window.gameRoom._room.onStadiumChange = (newStadiumName: string, byPlayer: PlayerObject): void => eventListener.onStadiumChangeListner(newStadiumName, byPlayer);
    window.gameRoom._room.onRoomLink = (url: string): void => eventListener.onRoomLinkListener(url);

    window.gameRoom.logger.i('initialization', `All event handlers were registered`);
}


function runBackgroundTasks(): void {
    window.gameRoom.logger.i('initialization', `Run timers for executing background tasks...`);

    const advertisementTimer = setInterval(() => {
        if (LangRes.scheduler.advertise) {
            window.gameRoom._room.sendAnnouncement(LangRes.scheduler.advertise, null, 0xF4F4F4, "normal", 0);
        }
    }, 600_000); // 10 mins
    
    const autoUnmuteTimer = setInterval(() => {
        const nowTimeStamp: number = getUnixTimestamp();
    
        let placeholderScheduler = {
            targetID: 0,
            targetName: '',
        }
    
        window.gameRoom.playerList.forEach((player: Player) => { // auto unmute system
            placeholderScheduler.targetID = player.id;
            placeholderScheduler.targetName = player.name;
    
            // check muted player and unmute when it's time to unmute
            if (player.permissions.mute && player.permissions.muteExpire !== -1 && nowTimeStamp > player.permissions.muteExpire) {
                player.permissions.mute = false;
                window.gameRoom.antiTrollingChatFloodMap.clear(player.id); // clear previous chat activity on unmute
                window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.scheduler.autoUnmute, placeholderScheduler), null, 0x479947, "normal", 0);
                window._emitSIOPlayerStatusChangeEvent(player.id);
            }
        });
    }, 5000); // 5 secs

    window.gameRoom.logger.i('initialization', `Background tasks are running now`);
}