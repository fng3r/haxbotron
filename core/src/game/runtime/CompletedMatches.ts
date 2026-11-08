import type { CompletedMatch } from '../../lib/room/LiveProtocol.js';
import type { RoomRuntime } from './RoomRuntime.js';
import { getMatchTimeline } from './MatchTimeline.js';
import { sendWorkerMessage } from './WorkerEventBridge.js';

const published = new WeakMap<RoomRuntime, string>();

/** One public completion event per match, including unwatched/disabled broadcasts. */
export function publishCompletedMatch(runtime: RoomRuntime): void {
    const timeline = getMatchTimeline(runtime).getSnapshot();
    if (!timeline || published.get(runtime) === timeline.matchId) return;
    const stats = runtime.match.getMatchStats();
    const scoring = [...timeline.events].reverse().find(event => event.type === 'victory' || event.type === 'goal');
    const person = (player: { id: number; name: string }) => ({ id: player.id, name: player.name });
    const match: CompletedMatch = {
        ...timeline, endedAt: timeline.endedAt ?? Date.now(),
        startingLineups: { red: stats.startingLineup.red.map(person), blue: stats.startingLineup.blue.map(person) },
        playtime: timeline.events.reduce((time, event) => Math.max(time, event.time), stats.scores.time),
        scores: { red: scoring?.scores?.red ?? stats.scores.red, blue: scoring?.scores?.blue ?? stats.scores.blue },
        outcome: timeline.events.some(event => event.type === 'victory') ? 'victory' : 'stopped',
    };
    published.set(runtime, timeline.matchId);
    sendWorkerMessage({ type: 'event', event: 'matchCompleted', payload: match });
}
