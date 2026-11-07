import type { RoomRuntime } from './RoomRuntime.js';

/** Missing settings retain the historical enabled behavior. */
export function isBroadcastEnabled(runtime: RoomRuntime): boolean {
    return runtime.config?.getSettings?.().liveBroadcast !== false;
}
