import type { PlayerObject } from "haxball.js";
import { RoomRuntime } from "../../runtime/RoomRuntime.js";

export function cmdBb(runtime: RoomRuntime, byPlayer: PlayerObject): void {
    runtime.room.getRoom().kickPlayer(byPlayer.id, '!bb', false);
}
