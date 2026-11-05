import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { test } from 'node:test';

import { LIVE_RELAY_GRACE_MS, LiveRelayPool } from './relay-pool.ts';

class Source extends EventEmitter {
  active = true;
  connected = false;
  subscriptions = [];
  disconnects = 0;
  emit(event, ...args) {
    if (event === 'live:subscribe') {
      this.subscriptions.push(args[0]);
      args[1]({ ok: true });
    }
    return true;
  }
  receive(event, ...args) {
    return super.emit(event, ...args);
  }
  connect() {
    this.connected = true;
    this.receive('connect');
  }
  disconnect() {
    this.disconnects++;
    this.connected = false;
    this.receive('disconnect');
  }
}

function viewer(id) {
  const events = [];
  return {
    id,
    connected: true,
    events,
    emit: (event, payload) => events.push({ event, payload, volatile: false }),
    volatile: { emit: (event, payload) => events.push({ event, payload, volatile: true }) },
  };
}

function setup(t, createSource) {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const sources = [];
  const counts = new Map();
  const ready = [];
  const pool = new LiveRelayPool({
    createSource:
      createSource ??
      (async (ruid) => {
        const source = new Source();
        sources.push({ ruid, source });
        return source;
      }),
    onCount: (ruid, count) => counts.set(ruid, count),
    onReady: (socket, ruid) => ready.push({ id: socket.id, ruid }),
  });
  t.after(() => pool.dispose());
  return { pool, sources, counts, ready };
}

const frame = (overrides = {}) => ({
  ruid: 'a',
  sequence: 1,
  timestamp: 1000,
  matchId: 'match',
  status: 'playing',
  scores: null,
  discs: [],
  players: [],
  ...overrides,
});

test('kick sounds are room-scoped reliable events and never replay to late viewers', async (t) => {
  const { pool, sources } = setup(t);
  const one = viewer('one'),
    two = viewer('two');
  pool.join('a', one);
  pool.join('b', two);
  await Promise.resolve();
  one.events.length = 0;
  two.events.length = 0;
  const kick = { id: 'kick', ruid: 'a', timestamp: 1000, playerId: 1, matchId: 'match' };
  sources[0].source.receive('live:kick', kick);
  assert.deepEqual(one.events, [{ event: 'live:kick', payload: kick, volatile: false }]);
  assert.equal(two.events.length, 0);
  const late = viewer('late');
  pool.join('a', late);
  assert.equal(
    late.events.some((event) => event.event === 'live:kick'),
    false,
  );
  sources[0].source.receive('live:kick', { ...kick, ruid: 'b' });
  assert.equal(two.events.length, 0);
  assert.equal(
    late.events.some((event) => event.event === 'live:kick'),
    false,
  );
});

test('concurrent viewers share one upstream; repeats and room switches preserve accurate counts', async (t) => {
  const { pool, sources, counts } = setup(t);
  const one = viewer('one'),
    two = viewer('two');
  pool.join('a', one);
  pool.join('a', two);
  pool.join('a', one);
  await Promise.resolve();
  assert.equal(sources.length, 1);
  assert.deepEqual(sources[0].source.subscriptions, ['a']);
  assert.equal(counts.get('a'), 2);
  pool.join('b', two);
  await Promise.resolve();
  assert.equal(sources.length, 2);
  assert.equal(counts.get('a'), 1);
  assert.equal(counts.get('b'), 1);
  one.events.length = 0;
  two.events.length = 0;
  sources[0].source.receive('live', frame());
  assert.equal(one.events.length, 1);
  assert.equal(two.events.length, 0);
  assert.equal(one.events[0].volatile, true);
});

test('last departure starts grace period, returning viewers cancel it, expired entries close and reopen', async (t) => {
  const { pool, sources, counts } = setup(t);
  pool.join('a', viewer('one'));
  await Promise.resolve();
  pool.leave('one');
  assert.equal(counts.get('a'), 0);
  t.mock.timers.tick(LIVE_RELAY_GRACE_MS - 1);
  assert.equal(sources[0].source.disconnects, 0);
  pool.join('a', viewer('two'));
  t.mock.timers.tick(1);
  assert.equal(sources.length, 1);
  assert.equal(sources[0].source.disconnects, 0);
  pool.leave('two');
  t.mock.timers.tick(LIVE_RELAY_GRACE_MS);
  assert.equal(sources[0].source.disconnects, 1);
  pool.join('a', viewer('three'));
  await Promise.resolve();
  assert.equal(sources.length, 2);
});

test('late viewers receive latest positions with cached geometry and timeline; match changes clear old history', async (t) => {
  const { pool, sources } = setup(t);
  pool.join('a', viewer('one'));
  await Promise.resolve();
  const source = sources[0].source;
  const stadium = { name: 'Pitch', width: 420, height: 200 };
  const timeline = { matchId: 'match', revision: 1, events: [] };
  source.receive('live', frame({ stadium, timeline }));
  source.receive('live', frame({ sequence: 2 }));
  const late = viewer('late');
  pool.join('a', late);
  const replay = late.events.find((e) => e.event === 'live');
  assert.equal(replay.payload.sequence, 2);
  assert.deepEqual(replay.payload.stadium, stadium);
  assert.deepEqual(replay.payload.timeline, timeline);
  assert.equal(replay.volatile, false);
  source.receive('live', frame({ sequence: 3, matchId: 'next' }));
  const next = viewer('next');
  pool.join('a', next);
  assert.equal(next.events.find((e) => e.event === 'live').payload.timeline, undefined);
});

test('one reconnect restores all viewers, drops stale cache, and blocks chat while unavailable', async (t) => {
  const { pool, sources, ready, counts } = setup(t);
  pool.join('a', viewer('one'));
  pool.join('a', viewer('two'));
  await Promise.resolve();
  const source = sources[0].source;
  source.receive('live', frame());
  assert.equal(pool.readyRoom('one'), 'a');
  source.disconnect();
  assert.equal(pool.readyRoom('one'), undefined);
  const late = viewer('late');
  pool.join('a', late);
  assert.equal(
    late.events.some((e) => e.event === 'live'),
    false,
  );
  assert.equal(counts.get('a'), 3);
  ready.length = 0;
  source.connect();
  assert.equal(ready.length, 3);
  assert.equal(pool.readyRoom('late'), 'a');
  assert.deepEqual(source.subscriptions, ['a', 'a']);
  assert.equal(sources.length, 1);
});

test('an in-flight source is discarded if grace expires before initialization finishes', async (t) => {
  let resolve;
  const { pool } = setup(
    t,
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  pool.join('a', viewer('one'));
  pool.leave('one');
  t.mock.timers.tick(LIVE_RELAY_GRACE_MS);
  const source = new Source();
  resolve(source);
  await Promise.resolve();
  assert.equal(source.disconnects, 1);
  assert.deepEqual(source.subscriptions, []);
});

test('source initialization failures retry once per room and recover all waiting viewers', async (t) => {
  let attempts = 0;
  const source = new Source();
  const { pool } = setup(t, async () => {
    if (++attempts === 1) throw new Error('Temporary failure');
    return source;
  });
  pool.join('a', viewer('one'));
  pool.join('a', viewer('two'));
  await Promise.resolve();
  assert.equal(attempts, 1);
  t.mock.timers.tick(3000);
  await Promise.resolve();
  assert.equal(attempts, 2);
  assert.equal(pool.readyRoom('one'), 'a');
  assert.equal(pool.readyRoom('two'), 'a');
});

test('authentication rejection recreates the shared source with fresh credentials', async (t) => {
  const { pool, sources, counts } = setup(t);
  pool.join('a', viewer('one'));
  pool.join('a', viewer('two'));
  await Promise.resolve();
  const old = sources[0].source;
  old.active = false;
  old.receive('connect_error', new Error('Unauthorized'));
  assert.equal(pool.readyRoom('one'), undefined);
  t.mock.timers.tick(3000);
  await Promise.resolve();
  assert.equal(sources.length, 2);
  assert.equal(old.disconnects, 1);
  assert.equal(counts.get('a'), 2);
  assert.equal(pool.readyRoom('one'), 'a');
});
