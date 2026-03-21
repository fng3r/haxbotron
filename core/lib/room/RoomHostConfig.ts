export interface RoomInitConfig {
    _LaunchDate: Date;
    _RUID: string;
    _config: RoomHostConfig;
    settings: RoomSettings;
    rules: RoomRules;
}

export interface ReactHostRoomInfo {
    ruid: string;
    _config: RoomHostConfig;
    settings: RoomSettings;
    rules: RoomRules;
}

export interface RoomHostConfig {
    roomName: string;
    playerName: string;
    password?: string;
    maxPlayers: number;
    public: boolean;
    token: string;
    noPlayer: boolean;
    geo?: {
        code: string;
        lat: number;
        lon: number;
    };
}

export interface RoomRules {
    timeLimit: number;
    scoreLimit: number;
    teamLock: boolean;
    autoAdmin: boolean;
    whitelistEnabled: boolean;
    defaultMapName: string;
    customJSONOptions?: string;
}

export interface RoomSettings {
    antiChatFlood: boolean;
    chatFloodCriterion: number;
    chatFloodIntervalMillisecs: number;
    muteDefaultMillisecs: number;
    forbidDuplicatedNickname: boolean;
}
