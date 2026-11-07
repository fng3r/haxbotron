import type { RoomRuntime } from './RoomRuntime.js';
import { getKickIndicator } from './KickIndicator.js';
import { publishLiveFrame, resetLiveBroadcast, scheduleLiveFrame } from './LiveBroadcast.js';
import { sendWorkerMessage } from './WorkerEventBridge.js';

const timers = new WeakMap<RoomRuntime, NodeJS.Timeout>();
const configured = new WeakMap<RoomRuntime, boolean>();

/** Toggle delivery while retaining event-driven match, stadium and input state. */
export function configureLiveBroadcast(runtime: RoomRuntime, enabled: boolean): void {
    if (configured.get(runtime) === enabled) return;
    configured.set(runtime, enabled);
    runtime.config.getSettings().liveBroadcast = enabled;
    const timer = timers.get(runtime);
    if (timer) clearInterval(timer);
    timers.delete(runtime);
    resetLiveBroadcast(runtime);
    const room = runtime.room.getRoom();
    room.onPlayerInput = player => {
        getKickIndicator(runtime).input(player.id, (player.input & room.InputFlags.kick) !== 0);
    };
    room.onKickRateLimitSet = (min, rate, burst) => {
        getKickIndicator(runtime).setLimits(min, rate, burst);
    };
    sendWorkerMessage({ type: 'event', event: 'liveBroadcastState', payload: { enabled } });
    if (!enabled) return;
    timers.set(runtime, setInterval(() => {
        if (!runtime.match.isPlaying()) publishLiveFrame(runtime);
    }, 1000));
    scheduleLiveFrame(runtime);
}
