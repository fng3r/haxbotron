export interface PlayerMatchRecord {
    goals: number;
    assists: number;
    ogs: number;
    balltouch: number;
    passed: number;
}

export interface PlayerPermissions {
    mute: boolean;
    muteExpire: number;
    malActCount: number;
}

export interface PlayerEntryTime {
    rejoinCount: number;
    joinDate: number;
    leftDate: number;
    matchEntryTime: number;
}

export interface PlayerStorage {
    auth: string;
    conn: string;
    name: string;
    mute: boolean;
    muteExpire: number;
    rejoinCount: number;
    joinDate: number;
    leftDate: number;
    nicknames: string[];
    malActCount: number;
}
