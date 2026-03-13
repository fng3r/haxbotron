import { Player } from "../../model/GameObject/Player";
import { TeamID } from "../../model/GameObject/TeamID";
import * as LangRes from "../../resource/strings";
import { RoomRuntime } from "../../runtime/RoomRuntime";
import * as Tst from "../Translator";

export function cmdList(runtime: RoomRuntime, byPlayer: PlayerObject, playerGroup?: string): void {
    const team = resolveTeam(playerGroup);
    if (team === "invalid") {
        runtime.room.sendAnnouncement(LangRes.command.list._ErrorNoTeam, byPlayer.id, 0xFF7777, "normal", 2);
        return;
    }

    const players = team === undefined
        ? runtime.player.getAllPlayers()
        : runtime.player.getPlayersForTeam(team);
    const whoisResult = players.length > 0
        ? players.map(formatListedPlayer).join(", ")
        : LangRes.command.list._ErrorNoOne;

    runtime.room.sendAnnouncement(
        Tst.maketext(LangRes.command.list.whoisList, { whoisResult }),
        byPlayer.id,
        0x479947,
        "normal",
        1
    );
}

function resolveTeam(playerGroup?: string): TeamID | undefined | "invalid" {
    if (playerGroup === undefined || playerGroup === null) {
        return undefined;
    }

    if (playerGroup === "red") {
        return TeamID.Red;
    } else if (playerGroup === "blue") {
        return TeamID.Blue;
    } else if (playerGroup === "spec") {
        return TeamID.Spec;
    }
    
    return "invalid";
}

function formatListedPlayer(player: Player): string {
    const muteFlag = player.permissions.mute ? "🔇" : "";
    return `${player.name}#${player.id}${muteFlag}`;
}
