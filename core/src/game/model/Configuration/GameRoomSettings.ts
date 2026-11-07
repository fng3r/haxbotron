export interface GameRoomSettings {
    liveBroadcast?: boolean;
    antiChatFlood : boolean
    chatFloodCriterion : number
    chatFloodIntervalMillisecs: number
    muteDefaultMillisecs : number
    forbidDuplicatedNickname: boolean
}
