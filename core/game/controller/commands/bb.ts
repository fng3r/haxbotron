import { RoomRuntime } from "../../runtime/RoomRuntime";

export function cmdBb(runtime: RoomRuntime, byPlayer: PlayerObject): void {
    runtime.room.getRoom().kickPlayer(byPlayer.id, '!bb', false);
}
