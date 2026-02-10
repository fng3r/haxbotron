import ChatActivityMap from "../model/ChatActivityMap";
import { AhoCorasick } from "../model/TextFilter/filter";
import { Player } from "../model/GameObject/Player";
import { PlayerRole } from "../model/PlayerRole/PlayerRole";
import { PlayerRoles } from "../model/PlayerRole/PlayerRoles";

export type ChatMessageValidationReason = "too_long" | "separator" | "banned_words";
export interface ChatMessageValidationResult {
    isValid: boolean;
    reason?: ChatMessageValidationReason;
}

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

    public validateMessageContent(
        message: string,
        chatLengthLimit: number,
        chatTextFilterEnabled: boolean,
        bannedWordsPool: string[]
    ): ChatMessageValidationResult {
        if (message.length > chatLengthLimit) {
            return { isValid: false, reason: "too_long" };
        }

        if (message.includes("|,|")) {
            return { isValid: false, reason: "separator" };
        }

        if (chatTextFilterEnabled && this.isIncludingBannedWords(bannedWordsPool, message)) {
            return { isValid: false, reason: "banned_words" };
        }

        return { isValid: true };
    }

    private isIncludingBannedWords(pool: string[], compare: string): boolean {
        const ac = new AhoCorasick(pool);
        const results = ac.search(compare);
        return Array.isArray(results) && results.length > 0;
    }
}
