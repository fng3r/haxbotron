import type { CompletedMatch } from './types';
import { z } from 'zod';

export const MATCH_HISTORY_LIMIT = 10;
const person = z.object({ id: z.number().int().nonnegative(), name: z.string().max(300) });
const scores = z.object({ red: z.number().int().nonnegative(), blue: z.number().int().nonnegative() });
const goal = z.object({
  id: z.string(),
  team: z.union([z.literal(1), z.literal(2)]),
  scores,
  scorer: person.nullable(),
  assistant: person.nullable(),
  ownGoal: z.boolean(),
});
const event = z.object({
  id: z.string(),
  type: z.enum(['start', 'goal', 'pause', 'resume', 'victory', 'stop', 'join', 'leave', 'teamChange']),
  time: z.number().finite().nonnegative(),
  timestamp: z.number().finite().nonnegative(),
  actor: person.optional(),
  player: person.optional(),
  team: z.union([z.literal(0), z.literal(1), z.literal(2)]).optional(),
  scores: scores.optional(),
  goal: goal.optional(),
});
const completed = z
  .object({
    matchId: z.string().min(1).max(100),
    startedAt: z.number().finite().nonnegative(),
    endedAt: z.number().finite().nonnegative(),
    revision: z.number().int().positive(),
    events: z.array(event).max(10000),
    startingLineups: z.object({ red: z.array(person).max(100), blue: z.array(person).max(100) }),
    playtime: z.number().finite().nonnegative(),
    scores,
    outcome: z.enum(['victory', 'stopped']),
  })
  .refine((match) => match.endedAt >= match.startedAt);

/** Process-local, shared across Next bundles; independent of broadcast viewers. */
export class MatchHistory {
  private rooms = new Map<string, CompletedMatch[]>();
  private listeners = new Set<(ruid: string, matches: CompletedMatch[]) => void>();
  list(ruid: string): CompletedMatch[] {
    return this.rooms.get(ruid) ?? [];
  }
  add(ruid: string, value: unknown): boolean {
    if (!ruid || ruid.length > 200) return false;
    const parsed = completed.safeParse(value);
    if (!parsed.success) return false;
    const previous = this.list(ruid);
    if (previous.some((match) => match.matchId === parsed.data.matchId)) return false;
    const matches = [...previous, parsed.data]
      .sort((a, b) => b.endedAt - a.endedAt || b.startedAt - a.startedAt)
      .slice(0, MATCH_HISTORY_LIMIT);
    this.rooms.delete(ruid);
    this.rooms.set(ruid, matches);
    if (this.rooms.size > 500) this.rooms.delete(this.rooms.keys().next().value!);
    for (const listener of this.listeners) listener(ruid, matches);
    return true;
  }
  subscribe(listener: (ruid: string, matches: CompletedMatch[]) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}
const shared = globalThis as typeof globalThis & { __liveMatchHistory?: MatchHistory };
export function getMatchHistory(): MatchHistory {
  return (shared.__liveMatchHistory ??= new MatchHistory());
}
