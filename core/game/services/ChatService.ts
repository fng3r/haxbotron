import ChatActivityMap from "../shared/collections/ChatActivityMap";
import { Player } from "../model/GameObject/Player";
import { PlayerRole } from "../model/PlayerRole/PlayerRole";
import { PlayerRoles } from "../model/PlayerRole/PlayerRoles";

export type MuteActionResult = "unmuted" | "muted_permanently" | "muted_temporarily";

/**
 * Service for managing chat, muting, and anti-flood
 */
export class ChatService {
    private antiTrollingChatFloodMap: ChatActivityMap;
    private isMuteAll: boolean = false;

    constructor(chatFloodCriterion: number) {
        this.antiTrollingChatFloodMap = new ChatActivityMap(chatFloodCriterion);
    }

    public getChatFloodMap(): ChatActivityMap {
        return this.antiTrollingChatFloodMap;
    }

    public isAllMuted(): boolean {
        return this.isMuteAll;
    }

    public setAllMuted(mute: boolean): void {
        this.isMuteAll = mute;
    }

    public toggleFreeze(): boolean {
        this.isMuteAll = !this.isMuteAll;
        return this.isMuteAll;
    }

    public recordChatActivity(playerId: number, timestamp: number): void {
        this.antiTrollingChatFloodMap.add(playerId, timestamp);
    }

    public getChatActivity(playerId: number): number[] {
        return this.antiTrollingChatFloodMap.get(playerId);
    }

    public clearChatActivity(playerId: number): void {
        this.antiTrollingChatFloodMap.clear(playerId);
    }

    public canBypassChatRestrictions(playerRole: PlayerRole): boolean {
        return PlayerRoles.atLeast(playerRole, PlayerRoles.S_ADM);
    }

    public isMessageBlockedByMute(player: Player): boolean {
        return this.isAllMuted() || player.permissions.mute;
    }

    public detectChatFlood(playerId: number, currentTimestamp: number, floodCriterion: number, floodIntervalMillisecs: number): boolean {
        this.recordChatActivity(playerId, currentTimestamp);
        const playerActivity = this.getChatActivity(playerId);

        return playerActivity.length >= floodCriterion
            && playerActivity[playerActivity.length - 1] - playerActivity[0] < floodIntervalMillisecs;
    }

    public applyFloodMute(player: Player, currentTimestamp: number, muteDefaultMillisecs: number): number {
        player.permissions.mute = true;
        player.permissions.muteExpire = currentTimestamp + muteDefaultMillisecs;
        return player.permissions.muteExpire;
    }

    public toggleMute(player: Player, muteInMinutes: number, currentTimestamp: number): MuteActionResult {
        if (player.permissions.mute) {
            player.permissions.mute = false;
            this.clearChatActivity(player.id);
            return "unmuted";
        }

        player.permissions.mute = true;
        if (muteInMinutes === -1) {
            player.permissions.muteExpire = -1;
            return "muted_permanently";
        }

        player.permissions.muteExpire = currentTimestamp + muteInMinutes * 60 * 1000;
        return "muted_temporarily";
    }

}
