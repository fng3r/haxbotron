export interface PlayerModel {
    auth: string;
    conn: string;
    name: string;
    mute: boolean;
    muteExpire: number;
    rejoinCount: number;
    joinDate: number;
    leftDate: number;
    malActCount: number;
}