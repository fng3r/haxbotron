import { publishLiveFrame } from "../../runtime/LiveBroadcast.js";
import { RoomRuntime } from "../../runtime/RoomRuntime.js";

export function onGameTickListener(runtime: RoomRuntime): void {
    const room = runtime.room.getRoom();
    
    const scores = room.getScores();
    if (scores) runtime.match.updateScores(scores.red, scores.blue, scores.time);
    publishLiveFrame(runtime);
}
