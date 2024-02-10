import { PlayerObject, PlayerPosition, PlayerPermissions, PlayerEntryTime, PlayerMatchRecord } from "./PlayerObject";
import { TeamID } from "./TeamID";
export class Player implements PlayerObject {
    // PlayerObject holds information about a player

    // The id of the player, each player that joins the room gets a unique id that will never change.
    id: number;
    // The name of the player.
    name: string;
    /*
    The player's public ID. Players can view their own ID's here: https://www.haxball.com/playerauth
    The public ID is useful to validate that a player is who he claims to be, but can't be used to verify that a player isn't someone else. Which means it's useful for implementing user accounts, but not useful for implementing a banning system.
    Can be null if the ID validation fails.
    This property is only set in the RoomObject.onPlayerJoin event.
    */
    auth: string;
    /*
    A string that uniquely identifies the player's connection, if two players join using the same network this string will be equal.
    This property is only set in the RoomObject.onPlayerJoin event.
    */
    conn: string;
    // Whether the player has admin rights.
    admin: boolean;
    // The team of the player.
    // Spectators: 0, Red Team: 1, Blue Team: 2
    team: TeamID;
    // The player's position in the field, if the player is not in the field the value will be null.
    position: PlayerPosition; //github doc: position : {"x": float, "y": float}

    // Temporary stat record for current match
    matchRecord: PlayerMatchRecord;

    // statistics of the player.
    // stats: PlayerStats;

    // permissions the player has.
    permissions: PlayerPermissions;

    // time log for join and left
    entrytime: PlayerEntryTime;

    // init
    constructor(player: PlayerObject, permissions: PlayerPermissions, entrytime: PlayerEntryTime) {
        this.id = player.id;
        this.name = player.name;
        this.auth = player.auth;
        this.conn = player.conn;
        this.admin = player.admin;
        this.team = player.team;
        this.position = player.position;
        this.matchRecord = { // Temporary stat record for current match
            goals: 0, // not contains OGs.
            assists: 0, // count for assist goal
            ogs: 0, // it means 'own goal' (in Korean, '자책골')
            balltouch: 0,  // total count of touch(kick) ball
            passed: 0, // total count of pass success
        }
        // this.stats = stats;
        this.permissions = permissions;
        this.entrytime = entrytime;
    }
}