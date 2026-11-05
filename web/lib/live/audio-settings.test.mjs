import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  DEFAULT_SOUND_SETTINGS,
  SOUND_STORAGE_KEY,
  parseSoundSettings,
  readSoundSettings,
  saveSoundSettings,
  subscribeSoundSettings,
} from './audio-settings.ts';

test('sound preferences restore volume and mute state independently', () => {
  for (const settings of [
    { volume: 0.35, muted: false },
    { volume: 0.65, muted: true },
    { volume: 0, muted: true },
  ])
    assert.deepEqual(parseSoundSettings(JSON.stringify(settings)), settings);
});

test('missing, corrupt and invalid sound preferences safely use defaults', () => {
  for (const value of [
    null,
    '',
    '{',
    'null',
    'false',
    '[]',
    '{}',
    '{"volume":-1,"muted":false}',
    '{"volume":2,"muted":false}',
    '{"volume":"0.5","muted":false}',
    '{"volume":0.5,"muted":"false"}',
  ])
    assert.deepEqual(parseSoundSettings(value), DEFAULT_SOUND_SETTINGS);
});

test('settings persist, notify controls, sync storage changes and survive blocked writes', (t) => {
  const oldWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const oldStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  let saved = null;
  let blocked = false;
  Object.defineProperty(globalThis, 'window', { configurable: true, value: new EventTarget() });
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key) => {
        assert.equal(key, SOUND_STORAGE_KEY);
        return saved;
      },
      setItem: (key, value) => {
        assert.equal(key, SOUND_STORAGE_KEY);
        if (blocked) throw new Error('Storage blocked');
        saved = value;
      },
    },
  });
  let notifications = 0;
  const unsubscribe = subscribeSoundSettings(() => notifications++);
  t.after(() => {
    unsubscribe();
    if (oldWindow) Object.defineProperty(globalThis, 'window', oldWindow);
    else delete globalThis.window;
    if (oldStorage) Object.defineProperty(globalThis, 'localStorage', oldStorage);
    else delete globalThis.localStorage;
  });
  const settings = { volume: 0.4, muted: false };
  saveSoundSettings(settings);
  assert.deepEqual(parseSoundSettings(readSoundSettings()), settings);
  assert.equal(notifications, 1);
  saved = JSON.stringify({ volume: 0.8, muted: true });
  const changed = new Event('storage');
  Object.defineProperty(changed, 'key', { value: SOUND_STORAGE_KEY });
  window.dispatchEvent(changed);
  assert.equal(notifications, 2);
  assert.deepEqual(parseSoundSettings(readSoundSettings()), { volume: 0.8, muted: true });
  blocked = true;
  saveSoundSettings(settings);
  assert.deepEqual(parseSoundSettings(readSoundSettings()), settings);
  assert.equal(notifications, 3);
  unsubscribe();
  saveSoundSettings({ volume: 0.3, muted: true });
  assert.equal(notifications, 3);
});
