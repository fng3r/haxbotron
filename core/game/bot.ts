// Haxbotron by dapucita
// MAIN OF THE BOT
// ====================================================================================================
// import modules
import * as LangRes from "./resource/strings";
import * as eventListener from "./controller/events/eventListeners";
import * as Tst from "./controller/Translator";
import { Player } from "./model/GameObject/Player";
import { Logger } from "./controller/Logger";
import { PlayerObject } from "./model/GameObject/PlayerObject";
import { ScoresObject } from "./model/GameObject/ScoresObject";
import { KickStack } from "./model/GameObject/BallTrace";
import { getUnixTimestamp } from "./controller/DateTimeUtils";
import { TeamID } from "./model/GameObject/TeamID";
import { EmergencyTools } from "./model/ExposeLibs/EmergencyTools";
import { GameRoomConfig } from "./model/Configuration/GameRoomConfig";
import {generateRandomString} from "../lib/utils";
import {PlayersSet} from "./model/GameObject/PlayersSet";
import CircularArray from "./model/CircularArray";
import ChatActivityMap from "./model/ChatActivityMap";
// ====================================================================================================
// load initial configurations
const loadedConfig: GameRoomConfig = JSON.parse(localStorage.getItem('_initConfig')!);
const discordWebhook = JSON.parse(localStorage.getItem('_discordWebhookConfig')!);

window.gameRoom = {
    _room: window.HBInit(loadedConfig._config)
    ,config: loadedConfig
    ,link: ''
    ,social: {
        discordWebhook: discordWebhook
    }
    ,stadiumData: {
        default: localStorage.getItem('_defaultMap')!
        ,training: localStorage.getItem('_readyMap')!
    }
    ,bannedWordsPool: {
        nickname: []
        ,chat: []
    }
    ,teamColours: {
        red: { angle: 0, textColour: 0xffffff, teamColour1: 0xe66e55, teamColour2: 0xe66e55, teamColour3: 0xe66e55 }
        ,blue: { angle: 0, textColour: 0xffffff, teamColour1: 0x5a89e5, teamColour2: 0x5a89e5, teamColour3: 0x5a89e5 }
    }
    ,logger: Logger.getInstance()
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

// clear localStorage
localStorage.removeItem('_initConfig');
localStorage.removeItem('_defaultMap');
localStorage.removeItem('_readyMap');

// start main bot script
console.log(`Haxbotron loaded bot script. (UID ${window.gameRoom.config._RUID}, TOKEN ${window.gameRoom.config._config.token})`);

window.document.title = `Haxbotron ${window.gameRoom.config._RUID}`;

makeRoom();

// ====================================================================================================
// set scheduling timers

const advertisementTimer = setInterval(() => {
    window.gameRoom._room.sendAnnouncement(LangRes.scheduler.advertise, null, 0x777777, "normal", 0); // advertisement
}, 600_000); // 10 mins

const autoUnmuteTimer = setInterval(() => {
    const nowTimeStamp: number = getUnixTimestamp(); //get timestamp

    let placeholderScheduler = {
        targetID: 0,
        targetName: '',
    }

    window.gameRoom.playerList.forEach((player: Player) => { // auto unmute system
        // init placeholder
        placeholderScheduler.targetID = player.id;
        placeholderScheduler.targetName = player.name;

        // check muted player and unmute when it's time to unmute
        if (player.permissions.mute && player.permissions.muteExpire !== -1 && nowTimeStamp > player.permissions.muteExpire) {
            player.permissions.mute = false; //unmute
            window.gameRoom.antiTrollingChatFloodMap.clear(player.id); // clear previous chat activity on unmute
            window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.scheduler.autoUnmute, placeholderScheduler), null, 0x479947, "normal", 0); //notify it
            window._emitSIOPlayerStatusChangeEvent(player.id);
        }
    });
}, 5000); // 5 secs

const rotateAdminPasswordTimer = setInterval(() => {
    window.gameRoom.adminPassword = generateRandomString();
    window._feedSocialDiscordWebhook(window.gameRoom.social.discordWebhook.id, window.gameRoom.social.discordWebhook.token, "password", {
        message: Tst.maketext(
            LangRes.onStop.feedSocialDiscordWebhook.adminPasswordMessage, {
            roomId: window.gameRoom.config._RUID
            ,password: window.gameRoom.adminPassword
        })
    });
}, 1_800_000); // 30 mins

// ====================================================================================================
// set defaults and register event handlers
function makeRoom(): void {
    window.gameRoom.logger.i('initialization', `The game room is opened at ${window.gameRoom.config._LaunchDate.toLocaleString()}.`);

    window.gameRoom.logger.i('initialization', `The game mode is '${window.gameRoom.isGamingNow}' now(by default).`);

    window.gameRoom._room.setCustomStadium(window.gameRoom.stadiumData.training);
    window.gameRoom._room.setScoreLimit(window.gameRoom.config.rules.requisite.scoreLimit);
    window.gameRoom._room.setTimeLimit(window.gameRoom.config.rules.requisite.timeLimit);
    window.gameRoom._room.setTeamsLock(window.gameRoom.config.rules.requisite.teamLock);

    window._feedSocialDiscordWebhook(window.gameRoom.social.discordWebhook.id, window.gameRoom.social.discordWebhook.token, "password", {
        message: Tst.maketext(
            LangRes.onStop.feedSocialDiscordWebhook.adminPasswordMessage, {
                roomId: window.gameRoom.config._RUID
                ,password: window.gameRoom.adminPassword
            })
    });

    // Linking Event Listeners
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
    window.gameRoom._room.onPlayerKicked = (kickedPlayer: PlayerObject, reason: string, ban: boolean, byPlayer: PlayerObject): void => eventListener.onPlayerKickedListener(kickedPlayer, reason, ban, byPlayer);
    window.gameRoom._room.onGamePause = (byPlayer: PlayerObject): void => eventListener.onGamePauseListener(byPlayer);
    window.gameRoom._room.onGameUnpause = (byPlayer: PlayerObject): void => eventListener.onGameUnpauseListener(byPlayer);
    window.gameRoom._room.onStadiumChange = (newStadiumName: string, byPlayer: PlayerObject): void => eventListener.onStadiumChangeListner(newStadiumName, byPlayer);
    window.gameRoom._room.onRoomLink = (url: string): void => eventListener.onRoomLinkListener(url);
    // =========================
}
