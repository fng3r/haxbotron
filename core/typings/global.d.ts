import { Logger } from "../game/controller/Logger"
import { RoomConfig } from '../game/model/RoomObject/RoomConfig';
import { KickStack } from "../game/model/GameObject/BallTrace";
import { Logger } from "../game/controller/Logger";
import { GameRoomConfig } from "../game/model/Configuration/GameRoomConfig";
import { Room } from "../game/model/RoomObject/RoomObject";
import { BanList } from "../game/model/PlayerBan/BanList";
import {PlayerObject, PlayerStorage} from "../game/model/GameObject/PlayerObject";
import {PlayersSet} from "../game/model/GameObject/PlayersSet";
import ChatActivityMap from "../game/model/ChatActivityMap";
import {PlayerRole} from "../game/model/PlayerRole/PlayerRole";

declare global {
    interface Window {
        // ==============================
        // bot
        gameRoom: {
            _room: Room // haxball room container

            config: GameRoomConfig // bot settings collection
            link: string // for sharing URI link of the room

            social: {
                discordWebhook: {
                    feed: boolean
                    passwordWebhookId: string
                    passwordWebhookToken: string
                    replaysWebhookId: string
                    replaysWebhookToken: string
                    replayUpload: boolean
                }
            }

            stadiumData: {
                default: string
                training: string
            }

            bannedWordsPool: {
                nickname: string[]
                chat: string[]
            }

            teamColours: {
                red: {
                    angle: number
                    textColour: number
                    teamColour1: number
                    teamColour2: number
                    teamColour3: number
                }
                blue: {
                    angle: number
                    textColour: number
                    teamColour1: number
                    teamColour2: number
                    teamColour3: number
                }
            }

            matchStats: {
                startedAt: number
                startingLineup: {
                    red: PlayerObject[],
                    blue: PlayerObject[]
                },
                scores: {
                    red: number,
                    blue: number,
                    time: number
                }
            }

            logger: Logger // logger for whole bot application
            adminPassword: string
            isGamingNow: boolean // is playing now?
            isMuteAll: boolean // is All players muted?
            playerList: PlayersSet // player list (key: player.id, value: Player), usage: playerList.get(player.id).name
            playerRoles: Map<number, PlayerRole>

            ballStack: KickStack // stack for ball tracing

            antiTrollingChatFloodMap: ChatActivityMap // map<playerId, chatActivityTimestamp[]>

            notice: string // Notice Message

            // on dev-console tools for emergency
            onEmergency: {
                list(): void
                chat(msg: string, playerID?: number): void
                kick(playerID: number, msg?: string): void
                ban(playerID: number, msg?: string): void
                //banclearall(): void
                //banlist(): void
                password(password?: string): void
            }
        }
        // ==============================

        // ==============================
        // INJECTED from Core Server
        // Injected functions
        _emitSIOLogEvent(origin: string, type: string, message: string): void
        _emitSIOPlayerInOutEvent(playerID: number): void
        _emitSIOPlayerStatusChangeEvent(playerID: number): void
        _feedSocialDiscordWebhook(id: string, token: string, type: string, content: any): void
        // CRUD with DB Server via REST API
        async _createPlayerDB(ruid: string, player: PlayerStorage): Promise<void>
        async _readPlayerDB(ruid: string, playerAuth: string): Promise<PlayerStorage | undefined>
        async _updatePlayerDB(ruid: string, player: PlayerStorage): Promise<void>
        async _deletePlayerDB(ruid: string, playerAuth: string): Promise<void>

        async _getPlayerRoleDB(auth: string): Promise<PlayerRole | undefined>
        async _createPlayerRoleDB(playerRole: PlayerRole): Promise<void>
        async _setPlayerRoleDB(playerRole: PlayerRole): Promise<void>
        async _deletePlayerRoleDB(playerRole: PlayerRole): Promise<void>

        async _createBanlistDB(ruid: string, banList: BanList): Promise<void>
        async _getAllBansDB(ruid: string): Promise<BanList[]>
        async _readBanlistDB(ruid: string, playerConn: string): Promise<BanList | undefined>
        async _updateBanlistDB(ruid: string, banList: BanList): Promise<void>
        async _deleteBanlistDB(ruid: string, playerConn: string): Promise<void>

        // ==============================
        // Haxball Headless Initial Methods
        // DO NOT EDIT THESE THINGS
        HBInit(config: RoomConfig): Room
        onHBLoaded(): void
        // ==============================
    }
}
