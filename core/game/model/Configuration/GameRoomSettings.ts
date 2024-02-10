export interface GameRoomSettings {
    maliciousBehaviourBanCriterion: number

    chatFiltering : boolean

    antiChatFlood : boolean
    chatFloodCriterion : number

    muteAllowIntervalMillisecs : number
    muteDefaultMillisecs : number

    avatarOverridingByTier : boolean

    nicknameLengthLimit : number
    chatLengthLimit : number

    forbidDuplicatedNickname: boolean
    nicknameTextFilter: boolean
    chatTextFilter: boolean
}
