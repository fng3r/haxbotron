import { PlayerObject } from "../../model/GameObject/PlayerObject";

export function onStadiumChangeListner(newStadiumName: string, byPlayer: PlayerObject): void {
    var placeholderStadium = {
        playerName: 'host',
        stadiumName: newStadiumName
    };

    // Event called when the stadium is changed.
    if (byPlayer !== null && window.gameRoom.playerList.size != 0 && byPlayer.id != 0) { // if size == 0, that means there's no players. byPlayer !=0  means that the map is changed by system, not player.
        placeholderStadium.playerName = byPlayer.name;
        window.gameRoom.logger.i('onStadiumChange', `The map ${newStadiumName} has been loaded by ${byPlayer.name})`);
        // window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.onStadium.loadNewStadium, placeholderStadium),null , 0xFFFFFF, "normal", 0);
    } else {
        window.gameRoom.logger.i('onStadiumChange', `The map ${newStadiumName} has been loaded as default map.`);
        // window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.onStadium.loadNewStadium, placeholderStadium),null , 0xFFFFFF, "normal", 0);
    }
}
