import { PlayerObject, PlayerPosition, PlayerStats } from "./PlayerObject";
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
    team: number; //github doc: team : TeamID
    // The player's position in the field, if the player is not in the field the value will be null.
    position: PlayerPosition; //github doc: position : {"x": float, "y": float}

    stats: PlayerStats;

    //Is this player ignored?
    ignored: boolean;

    // init
    constructor(id: number, name: string, auth: string, conn: string, admin: boolean, team: number, position: PlayerPosition, stats: PlayerStats, ignored: boolean) {
        this.id = id;
        this.name = name;
        this.auth = auth;
        this.conn = conn;
        this.admin = admin;
        this.team = team;
        this.position = position;
        this.stats = stats;
        this.ignored = ignored;
    }
}