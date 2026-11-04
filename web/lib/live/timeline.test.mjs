import assert from 'node:assert/strict';
import { test } from 'node:test';

import { describeEvent, eventTime, filterEvents, mergeTimeline } from './timeline.ts';

const history = (matchId = 'match-a', revision = 2) => ({
  matchId,
  revision,
  startedAt: 1000,
  endedAt: null,
  events: [
    { id: 'kickoff', type: 'start', time: 0, timestamp: 1000 },
    { id: 'goal', type: 'goal', time: 12, timestamp: 13000 },
  ],
});

test('All excludes joins/departures; Goals keeps goals and every match boundary', () => {
  const types = ['start', 'join', 'teamChange', 'goal', 'pause', 'resume', 'goal', 'leave', 'victory', 'stop'];
  const events = types.map((type, i) => ({ id: String(i), type, time: i, timestamp: i }));
  assert.deepEqual(
    filterEvents(events, 'all').map((event) => event.type),
    ['start', 'teamChange', 'goal', 'pause', 'resume', 'goal', 'victory', 'stop'],
  );
  assert.deepEqual(
    filterEvents(events, 'goals').map((event) => event.type),
    ['start', 'goal', 'goal', 'victory', 'stop'],
  );
  assert.deepEqual(
    events.map((event) => event.type),
    types,
  );
  assert.deepEqual(filterEvents([], 'goals'), []);
});

test('restores the full server history after a reload and retains it on ordinary ticks', () => {
  const snapshot = history();
  const restored = mergeTimeline(null, { matchId: snapshot.matchId, timeline: snapshot });
  assert.equal(restored, snapshot);
  assert.equal(mergeTimeline(restored, { matchId: snapshot.matchId }), snapshot);
  assert.equal(restored.events.length, 2);
});

test('replaces revisions without duplicating entries and ignores stale history', () => {
  const current = history();
  assert.equal(mergeTimeline(current, { matchId: 'match-a', timeline: history('match-a', 1) }), current);
  assert.equal(mergeTimeline(current, { matchId: 'match-a', timeline: history() }), current);
  const update = history('match-a', 3);
  assert.equal(mergeTimeline(current, { matchId: 'match-a', timeline: update }), update);
});

test('clears old matches and never displays history belonging to another room match', () => {
  const current = history();
  assert.equal(mergeTimeline(current, { matchId: 'match-b' }), null);
  assert.equal(mergeTimeline(current, { matchId: 'match-b', timeline: current }), null);
  const next = history('match-b', 1);
  assert.equal(mergeTimeline(current, { matchId: 'match-b', timeline: next }), next);
  assert.equal(mergeTimeline(current, { matchId: null }), null);
});

test('formats match-clock times, own goals, unknown scorers and team changes', () => {
  assert.equal(eventTime(0), '00:00');
  assert.equal(eventTime(125.9), '02:05');
  assert.equal(eventTime(6000), '100:00');
  assert.deepEqual(describeEvent({ type: 'goal', team: 1, goal: { ownGoal: true, scorer: { name: 'Alex' } } }), {
    title: 'Red goal',
    detail: 'Alex (OG)',
  });
  assert.deepEqual(describeEvent({ type: 'goal', team: 2, goal: { ownGoal: true, scorer: { name: 'Alex' } } }), {
    title: 'Blue goal',
    detail: 'Alex (OG)',
  });
  assert.equal(describeEvent({ type: 'goal', team: 2 }).detail, 'Scorer unavailable');
  assert.equal(describeEvent({ type: 'teamChange', team: 0, player: { name: 'Alex' } }).title, 'Moved to spectators');
});
