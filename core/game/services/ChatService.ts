import ChatActivityMap from "../model/ChatActivityMap";

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
}
