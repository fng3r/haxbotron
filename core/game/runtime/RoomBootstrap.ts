import { generateRandomString } from "../../lib/utils";
import { getUnixTimestamp } from "../shared/DateTime";
import * as eventListener from "../controller/events/eventListeners";
import { Logger } from "../logging/Logger";
import * as Tst from "../shared/Translator";
import { emitPlayerStatusChange, emitRoomReady } from "./WorkerEventBridge";
import { DiscordWebhookService } from "../../lib/integrations/DiscordWebhookService";
import { RoomInitConfig } from "../../lib/room/RoomHostConfig";
import { DiscordWebhookConfig } from "../../lib/room/RoomTypes";
import { Player } from "../model/GameObject/Player";
import { TeamID } from "../model/GameObject/TeamID";
import * as LangRes from "../resource/strings";
import { createCommandExecutor } from "../controller/commands/CommandRegistry";
import { createRoomRuntime, RoomRuntime } from "./RoomRuntime";

type HBInitFunction = (config: RoomConfigObject) => RoomObject;

export async function openRoomRuntime(
    HBInit: HBInitFunction,
    initConfig: RoomInitConfig,
    discordWebhookService: DiscordWebhookService = new DiscordWebhookService()
): Promise<RoomRuntime> {
    const runtimeConfig = applyGeolocationOverride(initConfig);
    const logger = new Logger(runtimeConfig._RUID);
    logger.i("initialization", "Loading initial config and open the game room...");

    const discordWebhookConfig = getDiscordWebhookConfigFromEnv();
    const room = HBInit(runtimeConfig._config);
    const adminPassword = generateRandomString();

    const runtime = createRoomRuntime(
        room,
        runtimeConfig,
        adminPassword,
        discordWebhookConfig,
        logger,
        discordWebhookService
    );

    runtime.logger.i(
        "initialization",
        `The game room is opened at ${runtime.config.getLaunchDate().toLocaleString()}. RUID: ${runtime.config.getRUID()}`
    );

    setDefaultSettings(runtime);
    setEventHandlers(runtime);
    runBackgroundTasks(runtime);

    console.log(`Haxbotron loaded room runtime. (RUID ${runtime.config.getRUID()}, TOKEN ${runtime.config.getRoomToken()})`);

    return runtime;
}

function getDiscordWebhookConfigFromEnv(): DiscordWebhookConfig {
    return {
        feed: JSON.parse(process.env.DISCORD_WEBHOOK_FEED || false.toString()),
        replayUpload: JSON.parse(process.env.DISCORD_WEBHOOK_REPLAY_UPLOAD || false.toString()),
        replaysWebhookId: process.env.DISCORD_REPLAYS_WEBHOOK_ID || "",
        replaysWebhookToken: process.env.DISCORD_REPLAYS_WEBHOOK_TOKEN || "",
        passwordWebhookId: process.env.DISCORD_PASSWORD_WEBHOOK_ID || "",
        passwordWebhookToken: process.env.DISCORD_PASSWORD_WEBHOOK_TOKEN || "",
    };
}

function applyGeolocationOverride(initConfig: RoomInitConfig): RoomInitConfig {
    if (process.env.TWEAKS_GEOLOCATIONOVERRIDE && JSON.parse(process.env.TWEAKS_GEOLOCATIONOVERRIDE.toLowerCase()) === true) {
        initConfig._config.geo = {
            code: process.env.TWEAKS_GEOLOCATIONOVERRIDE_CODE || "KR",
            lat: parseFloat(process.env.TWEAKS_GEOLOCATIONOVERRIDE_LAT || "37.5665"),
            lon: parseFloat(process.env.TWEAKS_GEOLOCATIONOVERRIDE_LON || "126.978"),
        };
    }

    return initConfig;
}

function setDefaultSettings(runtime: RoomRuntime): void {
    const rules = runtime.config.getRules();

    runtime.room.setDefaultStadium(rules.defaultMapName);
    if (!runtime.room.loadDefaultStadium()) {
        throw new Error(`Unknown default stadium '${rules.defaultMapName}'`);
    }
    runtime.room.setScoreLimit(rules.scoreLimit);
    runtime.room.setTimeLimit(rules.timeLimit);
    runtime.room.setTeamsLock(rules.teamLock);
    runtime.social.sendPasswordWebhook(runtime.config.getRUID(), runtime.config.getAdminPassword());

    runtime.logger.i('initialization', `Room default settings were set according to loaded config`);
}


function setEventHandlers(runtime: RoomRuntime): void {
    const room = runtime.room.getRoom();
    const commandExecutor = createCommandExecutor(runtime);
    
    runtime.logger.i('initialization', `Register game room event handlers...`);

    room.onPlayerJoin = async (player: PlayerJoinObject): Promise<void> => await eventListener.onPlayerJoinListener(runtime, player);
    room.onPlayerLeave = async (player: PlayerObject): Promise<void> => await eventListener.onPlayerLeaveListener(runtime, player);
    room.onTeamVictory = async (scores: ScoresObject): Promise<void> => await eventListener.onTeamVictoryListener(runtime, scores);
    room.onPlayerChat = (player: PlayerObject, message: string): boolean => eventListener.onPlayerChatListener(runtime, commandExecutor, player, message);
    room.onTeamGoal = async (team: TeamID): Promise<void> => await eventListener.onTeamGoalListener(runtime, team);
    room.onPlayerBallKick = (byPlayer: PlayerObject): void => eventListener.onPlayerBallKickListener(runtime, byPlayer);
    room.onPlayerTeamChange = (changedPlayer: PlayerObject, byPlayer: PlayerObject | null): void => eventListener.onPlayerTeamChangeListener(runtime, changedPlayer, byPlayer);
    room.onGameStart = (byPlayer: PlayerObject | null): void => eventListener.onGameStartListener(runtime, byPlayer);
    room.onGameStop = (byPlayer: PlayerObject | null): void => eventListener.onGameStopListener(runtime, byPlayer);
    room.onPlayerAdminChange = (changedPlayer: PlayerObject, byPlayer: PlayerObject | null): void => eventListener.onPlayerAdminChangeListener(runtime, changedPlayer, byPlayer);
    room.onPlayerKicked = async (kickedPlayer: PlayerObject, reason: string, ban: boolean, byPlayer: PlayerObject | null): Promise<void> => await eventListener.onPlayerKickedListener(runtime, kickedPlayer, reason, ban, byPlayer);
    room.onGameTick = () => eventListener.onGameTickListener(runtime);
    room.onGamePause = (byPlayer: PlayerObject): void => eventListener.onGamePauseListener(runtime, byPlayer);
    room.onGameUnpause = (byPlayer: PlayerObject): void => eventListener.onGameUnpauseListener(runtime, byPlayer);
    room.onStadiumChange = (newStadiumName: string, byPlayer: PlayerObject): void => eventListener.onStadiumChangeListner(runtime, newStadiumName, byPlayer);
    room.onRoomLink = (url: string): void => {
        eventListener.onRoomLinkListener(runtime, url);
        emitRoomReady(url);
    };

    runtime.logger.i('initialization', `All event handlers were registered`);
}


function runBackgroundTasks(runtime: RoomRuntime): void {
    
    runtime.logger.i('initialization', `Run timers for executing background tasks...`);

    const advertisementTimer = setInterval(() => {
        if (LangRes.scheduler.advertise) {
            runtime.room.sendAnnouncement(LangRes.scheduler.advertise, null, 0xF4F4F4, "normal", 0);
        }
    }, 600_000); // 10 mins
    
    const autoUnmuteTimer = setInterval(() => {
        const nowTimeStamp: number = getUnixTimestamp();
    
        let placeholderScheduler = {
            targetID: 0,
            targetName: '',
        }
    
        runtime.players.getPlayerList().forEach((player: Player) => { // auto unmute system
            placeholderScheduler.targetID = player.id;
            placeholderScheduler.targetName = player.name;
    
            // check muted player and unmute when it's time to unmute
            if (player.permissions.mute && player.permissions.muteExpire !== -1 && nowTimeStamp > player.permissions.muteExpire) {
                player.permissions.mute = false;
                runtime.chat.clearChatActivity(player.id); // clear previous chat activity on unmute
                runtime.room.sendAnnouncement(Tst.maketext(LangRes.scheduler.autoUnmute, placeholderScheduler), null, 0x479947, "normal", 0);
                emitPlayerStatusChange(player.id);
            }
        });
    }, 5000); // 5 secs

    runtime.logger.i('initialization', `Background tasks are running now`);
}
