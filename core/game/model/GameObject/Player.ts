import { PlayerEntryTime, PlayerMatchRecord, PlayerPermissions } from "./PlayerState";

export class Player {
    id: number;
    name: string;
    auth: string;
    conn: string;
    admin: boolean;
    team: PlayerObject["team"];
    position: PlayerObject["position"];
    matchRecord: PlayerMatchRecord;
    permissions: PlayerPermissions;
    entrytime: PlayerEntryTime;
    nicknames: Set<string>;

    constructor(player: PlayerJoinObject, auth: string, nicknames: string[], permissions: PlayerPermissions, entrytime: PlayerEntryTime) {
        this.id = player.id;
        this.name = player.name;
        this.auth = auth;
        this.conn = player.conn;
        this.admin = player.admin;
        this.team = player.team;
        this.position = player.position;
        this.matchRecord = {
            goals: 0,
            assists: 0,
            ogs: 0,
            balltouch: 0,
            passed: 0,
        };
        this.permissions = permissions;
        this.entrytime = entrytime;
        this.nicknames = new Set(nicknames || [player.name]);
    }
}
