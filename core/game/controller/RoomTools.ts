import { PlayerObject } from "../model/GameObject/PlayerObject";
import * as LangRes from "../resource/strings";
import * as Tst from "./Translator";
import { ServiceContainer } from "../services/ServiceContainer";

export function setDefaultStadiums(): void {
    const services = ServiceContainer.getInstance();
    services.room.loadDefaultStadium(); // if game mode is 'ready'
}

export function setDefaultRoomLimitation(): void {
    const services = ServiceContainer.getInstance();
    const config = services.config.getConfig();
    
    services.room.setScoreLimit(config.rules.scoreLimit);
    services.room.setTimeLimit(config.rules.timeLimit);
    services.room.setTeamsLock(config.rules.teamLock);
}

export function updateAdmins(): void {
    const services = ServiceContainer.getInstance();
    const room = services.room.getRoom();
    const playerList = services.player.getPlayerList();
    
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
    services.logger.i('updateAdmins', `${playerList.get(players[0].id)!.name}#${players[0].id} has been admin(value:${playerList.get(players[0].id)!.admin}), because there were no admin players.`);
    services.room.sendAnnouncement(Tst.maketext(LangRes.funcUpdateAdmins.newAdmin, placeholderUpdateAdmins), null, 0xFFFFFF, "normal", 0);
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

export function getCookieFromHeadless(name: string): string {
    let result = new RegExp('(?:^|; )' + encodeURIComponent(name) + '=([^;]*)').exec(document.cookie);
    return result ? result[1] : '';
}
