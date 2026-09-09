import type { PlayerObject } from "haxball.js";
import * as Messages from "../../resource/strings.js";
import { RoomRuntime } from "../../runtime/RoomRuntime.js";
import * as Tst from "../../shared/Translator.js";

export function cmdAuth(runtime: RoomRuntime, byPlayer: PlayerObject, playerId?: number): void {
    playerId = playerId || byPlayer.id;
    
    const player = runtime.players.getPlayer(playerId);
    if (!player) {
        runtime.room.sendAnnouncement(Messages.command._ErrorNoPlayer, null, 0xFF7777, "normal", 2);
        return;
    }

    const placeholder = {
        playerName: player.name
        ,playerID: player.id
        ,playerAuth: player.auth
    };

    runtime.room.sendAnnouncement(Tst.maketext(Messages.command.auth.playerAuth, placeholder), null, 0x479947, "normal", 1);
}
