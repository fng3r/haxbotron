import * as LangRes from "../../resource/strings";
import { RoomRuntime } from "../../runtime/RoomRuntime";
import * as Tst from "../Translator";

export function cmdAuth(runtime: RoomRuntime, byPlayer: PlayerObject, playerId?: number): void {
    playerId = playerId || byPlayer.id;
    
    const player = runtime.player.getPlayer(playerId);
    if (!player) {
        runtime.room.sendAnnouncement(LangRes.command.auth._ErrorNoPlayer, null, 0xFF7777, "normal", 2);
        return;
    }

    const placeholder = {
        playerName: player.name
        ,playerID: player.id
        ,playerAuth: player.auth
    };

    runtime.room.sendAnnouncement(Tst.maketext(LangRes.command.auth.playerAuth, placeholder), null, 0x479947, "normal", 1);
}
