import assert from 'node:assert/strict';
import { test } from 'node:test';

import { MatchHistory, getMatchHistory } from './match-history.ts';

const match = (id, endedAt = 2000) => ({
  matchId: String(id),
  startedAt: 1000,
  endedAt,
  revision: 2,
  events: [
    { id: 'start', type: 'start', time: 0, timestamp: 1000 },
    { id: 'stop', type: 'stop', time: 30, timestamp: endedAt },
  ],
  startingLineups: { red: [{ id: 1, name: 'Original', auth: 'SECRET', conn: 'PRIVATE' }], blue: [] },
  playtime: 30,
  scores: { red: 1, blue: 0 },
  outcome: 'stopped',
  password: 'SECRET',
});
test('last ten matches are isolated by room, ordered, deduplicated and sanitized', () => {
  const history = new MatchHistory();
  for (let id = 0; id < 15; id++) assert.equal(history.add('room', match(id, 2000 + id)), true);
  assert.equal(history.list('room').length, 10);
  assert.deepEqual(
    history.list('room').map((m) => m.matchId),
    ['14', '13', '12', '11', '10', '9', '8', '7', '6', '5'],
  );
  assert.equal(history.add('room', match(14)), false);
  assert.deepEqual(history.list('other'), []);
  assert.equal(history.add('other', match(14)), true);
  assert.doesNotMatch(JSON.stringify(history.list('room')), /SECRET|PRIVATE|auth|conn|password/);
});
test('completion records do not retain mutable producer objects and reject invalid data', () => {
  const history = new MatchHistory();
  const source = match(1);
  history.add('room', source);
  source.startingLineups.red[0].name = 'Changed';
  source.events.length = 0;
  assert.equal(history.list('room')[0].startingLineups.red[0].name, 'Original');
  assert.equal(history.list('room')[0].events.length, 2);
  for (const invalid of [
    null,
    {},
    { ...match(2), playtime: -1 },
    { ...match(3), endedAt: 0 },
    { ...match(4), scores: { red: Infinity, blue: 0 } },
  ]) {
    assert.equal(history.add('room', invalid), false);
  }
});
test('subscribers get new matches without viewers and store survives relay recreation, not process restart', () => {
  const history = getMatchHistory();
  const updates = [];
  const unsubscribe = history.subscribe((ruid, matches) => updates.push({ ruid, matches }));
  history.add('unwatched', match('unwatched'));
  assert.equal(updates[0].ruid, 'unwatched');
  assert.equal(getMatchHistory().list('unwatched').length, 1);
  unsubscribe();
  history.add('unwatched', match('another'));
  assert.equal(updates.length, 1);
  assert.deepEqual(new MatchHistory().list('unwatched'), []);
});
