import assert from 'node:assert/strict';
import { test } from 'node:test';

import { isPublicLivePath, selectPublicLiveRooms } from './public.ts';

test('public discovery includes only online rooms on capable, available hosts', () => {
  const rooms = [
    { ruid: 'a', hostId: 'capable', online: true, roomName: 'Arena', onlinePlayers: 4 },
    { ruid: 'b', hostId: 'capable', online: false },
    { ruid: 'c', hostId: 'old-core', online: true },
    { ruid: 'd', hostId: 'capable', online: true, blockingReason: 'Disabled host' },
  ];
  assert.deepEqual(selectPublicLiveRooms(rooms, new Set(['capable'])), [
    { ruid: 'a', roomName: 'Arena', onlinePlayers: 4 },
  ]);
});

test('public responses contain no host information, room links or administrative fields', () => {
  const rooms = [
    {
      ruid: 'room',
      hostId: 'private-host',
      hostName: 'Private host',
      online: true,
      roomName: 'Public name',
      onlinePlayers: 2,
      roomLink: 'https://private-link',
      adminPassword: 'secret',
      baseUrl: 'http://private-address',
      token: 'secret-token',
    },
  ];
  assert.deepEqual(selectPublicLiveRooms(rooms, new Set(['private-host'])), [
    { ruid: 'room', roomName: 'Public name', onlinePlayers: 2 },
  ]);
  assert.doesNotMatch(
    JSON.stringify(selectPublicLiveRooms(rooms, new Set(['private-host']))),
    /private|secret|token|Password|hostId/,
  );
});

test('only the exact read-only discovery and relay endpoints bypass admin protection', () => {
  assert.equal(isPublicLivePath('/api/public/rooms'), true);
  assert.equal(isPublicLivePath('/api/public/live'), true);
  for (const path of [
    '/api/live',
    '/api/v1/room',
    '/api/v1/control/events',
    '/api/public/rooms/delete',
    '/api/public/live/admin',
    '/api/public/hosts',
    '/api/public/rooms-other',
  ]) {
    assert.equal(isPublicLivePath(path), false, path);
  }
});
