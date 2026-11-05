import type { LiveFrame } from './types';

export function isOvertime(scores: LiveFrame['scores']): boolean {
  return (
    !!scores &&
    Number.isFinite(scores.timeLimit) &&
    scores.timeLimit > 0 &&
    Number.isFinite(scores.time) &&
    scores.time > scores.timeLimit
  );
}

export function isTimeRunningOut(scores: LiveFrame['scores']): boolean {
  if (
    !scores ||
    !Number.isFinite(scores.timeLimit) ||
    scores.timeLimit <= 0 ||
    !Number.isFinite(scores.time) ||
    scores.time < 0
  )
    return false;
  // getScores() returns the limit in seconds, unlike setTimeLimit(minutes).
  // Match the displayed whole-second clock rather than flashing at 00:30.001.
  const remaining = scores.timeLimit - Math.floor(scores.time);
  return remaining > 0 && remaining < 30;
}
