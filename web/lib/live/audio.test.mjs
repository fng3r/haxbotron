import assert from 'node:assert/strict';
import { test } from 'node:test';

import { BroadcastAudio } from './audio.ts';

function setup(t) {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const nodes = [];
  const gains = [];
  let context;
  const oldContext = Object.getOwnPropertyDescriptor(globalThis, 'AudioContext');
  const oldDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  class Context {
    state = 'suspended';
    destination = {};
    constructor() {
      context = this;
    }
    async resume() {
      this.state = 'running';
    }
    async decodeAudioData(data) {
      return { sound: new Uint8Array(data)[0] };
    }
    async close() {
      this.state = 'closed';
    }
    createGain() {
      const gain = { gain: { value: 1 }, connect() {} };
      gains.push(gain);
      return gain;
    }
    createBufferSource() {
      const node = {
        started: false,
        stopped: false,
        connect(destination) {
          this.destination = destination;
        },
        disconnect() {},
        start() {
          this.started = true;
        },
        stop() {
          this.stopped = true;
        },
      };
      nodes.push(node);
      return node;
    }
  }
  Object.defineProperty(globalThis, 'AudioContext', { configurable: true, value: Context });
  Object.defineProperty(globalThis, 'document', { configurable: true, value: { hidden: false } });
  const fetch = t.mock.method(globalThis, 'fetch', async (url) => ({
    ok: true,
    arrayBuffer: async () => Uint8Array.of(url.includes('goal') ? 2 : 1).buffer,
  }));
  t.after(() => {
    if (oldContext) Object.defineProperty(globalThis, 'AudioContext', oldContext);
    else delete globalThis.AudioContext;
    if (oldDocument) Object.defineProperty(globalThis, 'document', oldDocument);
    else delete globalThis.document;
  });
  return { nodes, gains, fetch, context: () => context };
}

test('audio starts muted, loads once on enable, delays kicks, deduplicates events and permits overlapping sounds', async (t) => {
  const { nodes, fetch } = setup(t);
  const audio = new BroadcastAudio();
  audio.kick({ id: 'muted' }, 80);
  assert.equal(fetch.mock.callCount(), 0);
  assert.equal(await audio.enable(), true);
  assert.equal(fetch.mock.calls[0].arguments[0], '/audio/haxball-kick.wav');
  audio.kick({ id: 'muted' }, 80);
  audio.kick({ id: 'one' }, 80);
  audio.kick({ id: 'one' }, 80);
  t.mock.timers.tick(79);
  assert.equal(nodes.length, 0);
  t.mock.timers.tick(1);
  assert.equal(nodes.length, 1);
  audio.kick({ id: 'two' }, 80);
  t.mock.timers.tick(80);
  assert.equal(nodes.length, 2);
  assert.ok(nodes.every((node) => node.started && !node.stopped));
  audio.mute();
  assert.ok(nodes.every((node) => node.stopped));
  await audio.enable();
  assert.equal(fetch.mock.callCount(), 2);
  audio.destroy();
});

test('enabled kick and goal sounds play while the tab is hidden', async (t) => {
  const { nodes } = setup(t);
  const audio = new BroadcastAudio();
  await audio.enable();
  audio.kick({ id: 'before-hidden' }, 80);
  document.hidden = true;
  t.mock.timers.tick(80);
  audio.kick({ id: 'while-hidden' }, 80);
  audio.goal('hidden-goal', 80);
  t.mock.timers.tick(80);
  assert.equal(nodes.length, 3);
  assert.ok(nodes.every((node) => node.started));
  audio.destroy();
});

test('muting, clearing and destroying cancel pending sounds; delayed timers do not play stale sounds', async (t) => {
  const { nodes, context } = setup(t);
  const audio = new BroadcastAudio();
  await audio.enable();
  audio.kick({ id: 'mute' }, 80);
  audio.mute();
  t.mock.timers.tick(80);
  assert.equal(nodes.length, 0);
  await audio.enable();
  audio.kick({ id: 'clear' }, 80);
  audio.clear();
  t.mock.timers.tick(80);
  assert.equal(nodes.length, 0);
  let now = 0;
  t.mock.method(performance, 'now', () => now);
  audio.kick({ id: 'throttled' }, 80);
  now = 1000;
  t.mock.timers.tick(80);
  assert.equal(nodes.length, 0);
  audio.kick({ id: 'destroy' }, 80);
  audio.destroy();
  t.mock.timers.tick(80);
  assert.equal(nodes.length, 0);
  assert.equal(context().state, 'closed');
});

test('failed asset loading can be retried', async (t) => {
  const { fetch } = setup(t);
  fetch.mock.mockImplementationOnce(async () => ({ ok: false }));
  const audio = new BroadcastAudio();
  await assert.rejects(audio.enable(), /unavailable/);
  assert.equal(await audio.enable(), true);
  audio.destroy();
});

test('volume uses one shared gain node and updates already-playing sounds', async (t) => {
  const { nodes, gains } = setup(t);
  const audio = new BroadcastAudio();
  audio.setVolume(0.35);
  assert.equal(audio.isEnabled(), false);
  await audio.enable();
  assert.equal(audio.isEnabled(), true);
  assert.equal(gains.length, 1);
  assert.equal(gains[0].gain.value, 0.35);
  audio.kick({ id: 'volume' }, 80);
  t.mock.timers.tick(80);
  assert.equal(nodes[0].destination, gains[0]);
  audio.setVolume(0.7);
  assert.equal(gains[0].gain.value, 0.7);
  audio.setVolume(5);
  assert.equal(gains[0].gain.value, 1);
  audio.setVolume(-5);
  assert.equal(gains[0].gain.value, 0);
  audio.setVolume(NaN);
  assert.equal(gains[0].gain.value, 0);
  audio.mute();
  assert.equal(audio.isEnabled(), false);
  await audio.enable();
  assert.equal(gains.length, 1);
  audio.destroy();
});

test('goals use the original goal buffer with shared volume, deduplication and mute behavior', async (t) => {
  const { nodes, gains, fetch } = setup(t);
  const audio = new BroadcastAudio();
  audio.goal('muted-goal', 80);
  await audio.enable();
  assert.deepEqual(
    fetch.mock.calls.map((call) => call.arguments[0]),
    ['/audio/haxball-kick.wav', '/audio/haxball-goal.wav'],
  );
  audio.setVolume(0.4);
  audio.goal('muted-goal', 80); // Enabling must not replay a goal that occurred while muted.
  audio.kick({ id: 'same-id' }, 80);
  audio.goal('same-id', 80);
  audio.goal('same-id', 80);
  t.mock.timers.tick(79);
  assert.equal(nodes.length, 0);
  t.mock.timers.tick(1);
  assert.deepEqual(
    nodes.map((node) => node.buffer.sound),
    [1, 2],
  );
  assert.ok(nodes.every((node) => node.destination === gains[0]));
  assert.equal(gains[0].gain.value, 0.4);
  audio.goal('cancelled', 80);
  audio.mute();
  t.mock.timers.tick(80);
  assert.equal(nodes.length, 2);
  assert.ok(nodes.every((node) => node.stopped));
  await audio.enable();
  assert.equal(fetch.mock.callCount(), 2);
  audio.destroy();
});
