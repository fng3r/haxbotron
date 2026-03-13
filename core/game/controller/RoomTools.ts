import * as LangRes from "../resource/strings";
import { RoomRuntime } from "../runtime/RoomRuntime";
import * as Tst from "./Translator";

export function setDefaultStadiums(runtime: RoomRuntime): void {
    runtime.room.loadDefaultStadium(); // if game mode is 'ready'
}

export function setDefaultRoomLimitation(runtime: RoomRuntime): void {
    const config = runtime.config.getConfig();
    
    runtime.room.setScoreLimit(config.rules.scoreLimit);
    runtime.room.setTimeLimit(config.rules.timeLimit);
    runtime.room.setTeamsLock(config.rules.teamLock);
}

export function updateAdmins(runtime: RoomRuntime): void {
    const room = runtime.room.getRoom();
    const playerList = runtime.player.getPlayerList();
    
    let placeholderUpdateAdmins = {
        playerID: 0,
        playerName: ''
    };

    // Get all players except the host (id = 0 is always the host)
    let players = room.getPlayerList().filter(
            // only no afk mode players
            (player: PlayerObject) => player.id !== 0
        );
    if (players.length == 0) return; // If no players left, do nothing.
    if (players.find((player: PlayerObject) => player.admin) != null) return; // Do nothing if any admin player is still left.

    placeholderUpdateAdmins.playerID = players[0].id;
    placeholderUpdateAdmins.playerName = playerList.get(players[0].id)!.name;

    room.setPlayerAdmin(players[0]!.id, true); // Give admin to the first non admin player in the list
    playerList.get(players[0].id)!.admin = true;
    runtime.logger.i('updateAdmins', `${playerList.get(players[0].id)!.name}#${players[0].id} has been admin(value:${playerList.get(players[0].id)!.admin}), because there were no admin players.`);
    runtime.room.sendAnnouncement(Tst.maketext(LangRes.funcUpdateAdmins.newAdmin, placeholderUpdateAdmins), null, 0xFFFFFF, "normal", 0);
}

export function shuffleArray<T>(array: T[]): T[] {
    if (!Array.isArray(array)) {
        throw new TypeError(`shuffleArray: Expected an Array, got ${typeof array} instead.`);
    }

    const oldArray = [...array];
    let newArray = new Array<T>();

    while (oldArray.length) {
        const i = Math.floor(Math.random() * oldArray.length);
        newArray = newArray.concat(oldArray.splice(i, 1));
    }

    return newArray;
}
