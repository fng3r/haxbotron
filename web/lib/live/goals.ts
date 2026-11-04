import type { LiveFrame, LiveGoal } from './types';

export function goalForScore(
  goal: LiveGoal | undefined,
  team: 1 | 2,
  scores: { red: number; blue: number },
): LiveGoal | undefined {
  return goal?.team === team && goal.scores.red === scores.red && goal.scores.blue === scores.blue ? goal : undefined;
}

export function detectGoal(previous: LiveFrame | null, next: LiveFrame): 1 | 2 | null {
  if (
    previous?.matchId !== next.matchId ||
    !previous?.scores ||
    !next.scores ||
    previous.status === 'stopped' ||
    next.status === 'stopped' ||
    next.sequence <= previous.sequence ||
    next.timestamp < previous.timestamp ||
    next.timestamp - previous.timestamp > 3000 ||
    next.scores.time < previous.scores.time
  )
    return null;

  const red = next.scores.red - previous.scores.red;
  const blue = next.scores.blue - previous.scores.blue;
  if (red === 1 && blue === 0) return 1;
  if (blue === 1 && red === 0) return 2;
  return null;
}
