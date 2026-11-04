import assert from 'node:assert/strict';
import { test } from 'node:test';

import { detectGoal, goalForScore } from './goals.ts';

const frame = (red = 0, blue = 0, sequence = 1, timestamp = 1000) => ({
  sequence,
  timestamp,
  status: 'playing',
  scores: { red, blue, time: sequence, scoreLimit: 5, timeLimit: 300 },
  discs: [],
  players: [],
});

test('celebrates either team when its score increases, including across dropped frames', () => {
  assert.equal(detectGoal(frame(), frame(1, 0, 2, 1017)), 1);
  assert.equal(detectGoal(frame(2, 1), frame(2, 2, 8, 1200)), 2);
});

test('never replays existing scores on subscription or reconnection', () => {
  assert.equal(detectGoal(null, frame(3, 2)), null);
  assert.equal(detectGoal(frame(3, 2), frame(3, 2, 2, 1017)), null);
  assert.equal(detectGoal(frame(), frame(1, 0, 2, 5000)), null);
});

test('ignores duplicate and out-of-order frames, score corrections and match resets', () => {
  assert.equal(detectGoal(frame(), frame(1, 0)), null);
  assert.equal(detectGoal(frame(0, 0, 5), frame(1, 0, 4)), null);
  assert.equal(detectGoal(frame(), frame(1, 0, 2, 900)), null);
  assert.equal(detectGoal(frame(2, 1), frame(0, 0, 2, 1017)), null);
  assert.equal(detectGoal(frame(), frame(2, 0, 2, 1017)), null);
  assert.equal(detectGoal(frame(), frame(1, 1, 2, 1017)), null);
  assert.equal(detectGoal(frame(0, 0, 100), frame(1, 0, 101, 1017)), 1);
  const reset = frame(1, 0, 101, 1017);
  reset.scores.time = 0;
  assert.equal(detectGoal(frame(0, 0, 100), reset), null);
});

test('does not celebrate stopped games or missing scores', () => {
  const goal = frame(1, 0, 2, 1017);
  assert.equal(detectGoal({ ...frame(), scores: null }, goal), null);
  assert.equal(detectGoal(frame(), { ...goal, scores: null }), null);
  assert.equal(detectGoal(frame(), { ...goal, status: 'stopped' }), null);
  assert.equal(detectGoal({ ...frame(), status: 'stopped' }, goal), null);
});

test('only attaches goal credits to their matching team and score', () => {
  const goal = {
    id: 'goal-1',
    team: 1,
    scores: { red: 2, blue: 1 },
    scorer: { id: 1, name: 'Scorer' },
    assistant: null,
    ownGoal: false,
  };
  assert.equal(goalForScore(goal, 1, { red: 2, blue: 1 }), goal);
  assert.equal(goalForScore(goal, 2, { red: 2, blue: 1 }), undefined);
  assert.equal(goalForScore(goal, 1, { red: 3, blue: 1 }), undefined);
  assert.equal(goalForScore(undefined, 1, { red: 2, blue: 1 }), undefined);
});
