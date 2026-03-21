import { RoomRuntime } from "../../runtime/RoomRuntime";

export function onGameTickListener(runtime: RoomRuntime): void {
    const room = runtime.room.getRoom();
    
    const scores = room.getScores()!;
    runtime.match.updateScores(scores.red, scores.blue, scores.time);
}
