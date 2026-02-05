import { Logger } from "../game/controller/Logger";
import ChatActivityMap from "../game/model/ChatActivityMap";
import { GameRoomConfig } from "../game/model/Configuration/GameRoomConfig";
import { KickStack } from "../game/model/GameObject/BallTrace";
import { PlayerObject, PlayerStorage } from "../game/model/GameObject/PlayerObject";
import { PlayersSet } from "../game/model/GameObject/PlayersSet";
import { BanList } from "../game/model/PlayerBan/BanList";
import { PlayerRole } from "../game/model/PlayerRole/PlayerRole";
import { RoomConfig } from '../game/model/RoomObject/RoomConfig';
import { Room } from "../game/model/RoomObject/RoomObject";
import { ServiceContainer } from "../game/services/ServiceContainer";

declare global {
    interface Window {
        // ==============================
        // Service Container (preferred way to access services)
        services?: ServiceContainer
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
