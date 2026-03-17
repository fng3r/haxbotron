import * as LangRes from "../../resource/strings";
import { RoomRuntime } from "../../runtime/RoomRuntime";
import * as Tst from "../Translator";

export async function cmdDeanon(runtime: RoomRuntime, byPlayer: PlayerObject, playerId: number) {
    const player = runtime.players.getPlayer(playerId);
    if (player === undefined) {
        runtime.room.sendAnnouncement(LangRes.command.deanon._ErrorNoPlayer, byPlayer.id, 0xFF7777, "normal", 1);
        return;
    }

    const nicknamesList = Array.from(player.nicknames.values()).join(', ');
    const placeholder = {
        playerID: player.id,
        playerName: player.name,
        nicknamesList: nicknamesList
    }
    runtime.room.sendAnnouncement(Tst.maketext(LangRes.command.deanon.playerNicknames, placeholder), byPlayer.id, 0x479947, "normal", 1);
}
