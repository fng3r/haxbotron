import type { LiveFrame, LiveMatchEvent, LiveMatchTimeline } from './types';

export type TimelineFilter = 'all' | 'goals';

export function filterEvents(events: readonly LiveMatchEvent[], filter: TimelineFilter): LiveMatchEvent[] {
  return events.filter((event) => {
    // Hide legacy entries retained by rooms running an earlier version.
    if (event.type === 'join' || event.type === 'leave') return false;
    // Match boundaries stay visible in every filter, including natural full time.
    if (event.type === 'start' || event.type === 'stop' || event.type === 'victory') return true;
    return filter === 'all' || event.type === 'goal';
  });
}

/** Server history is authoritative; never carry an old match into a new one. */
export function mergeTimeline(
  current: LiveMatchTimeline | null,
  frame: Pick<LiveFrame, 'matchId' | 'timeline'>,
): LiveMatchTimeline | null {
  if (frame.matchId === undefined) return current;
  if (frame.matchId === null) return null;
  const incoming = frame.timeline?.matchId === frame.matchId ? frame.timeline : null;
  if (current?.matchId !== frame.matchId) return incoming;
  return incoming && incoming.revision > current.revision ? incoming : current;
}

export function eventTime(time: number): string {
  const seconds = Math.max(0, Math.floor(time));
  return `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
}

export function describeEvent(event: LiveMatchEvent): { title: string; detail?: string } {
  const actor = event.actor ? `By ${event.actor.name}` : undefined;
  switch (event.type) {
    case 'start':
      return { title: 'Kick-off', detail: actor };
    case 'pause':
      return { title: 'Game paused', detail: actor };
    case 'resume':
      return { title: 'Game resumed', detail: actor };
    case 'stop':
      return { title: 'Match stopped', detail: actor };
    case 'victory':
      return { title: `${event.team === 1 ? 'Red' : 'Blue'} wins`, detail: 'Full time' };
    case 'goal':
      return {
        title: `${event.team === 1 ? 'Red' : 'Blue'} goal`,
        detail: `${event.goal?.scorer?.name ?? 'Scorer unavailable'}${event.goal?.ownGoal ? ' (OG)' : ''}`,
      };
    case 'join':
      return { title: 'Player joined', detail: event.player?.name };
    case 'leave':
      return { title: 'Player left', detail: event.player?.name };
    case 'teamChange':
      return {
        title: `Moved to ${event.team === 1 ? 'Red' : event.team === 2 ? 'Blue' : 'spectators'}`,
        detail: event.player?.name,
      };
  }
}
