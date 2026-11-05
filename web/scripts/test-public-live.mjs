// Production HTTP/WebSocket test with isolated storage and synthetic core hosts.
// Run after `npm run build`. Never reads or changes configured hosts/rooms.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { once } from 'node:events';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { SignJWT, jwtVerify } from 'jose';
import { Server } from 'socket.io';
import { io } from 'socket.io-client';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const directory = await mkdtemp(join(tmpdir(), 'haxbotron-public-live-test-'));
const secret = 'synthetic-public-live-test-key';
const key = new TextEncoder().encode(secret);
const clients = [];
const hosts = [];
const coreEvents = [];
let web;
let webOutput = '';

async function mockHost(room, capable) {
  const http = createServer((request, response) => {
    if (request.headers['x-api-key'] !== 'synthetic-api-key') {
      response.writeHead(401).end();
      return;
    }
    response.setHeader('Content-Type', 'application/json');
    if (request.url === '/api/v1/system')
      response.end(
        JSON.stringify({
          usedMemoryMB: 10,
          upTimeSecs: 1,
          serverVersion: 'test',
          ...(capable ? { capabilities: { liveBroadcast: true } } : {}),
        }),
      );
    else if (request.url === '/api/v1/room') response.end(JSON.stringify([room]));
    else if (request.url === `/api/v1/room/${room}/info`)
      response.end(
        JSON.stringify({
          roomName: 'Public Arena',
          onlinePlayers: 2,
          link: 'PRIVATE-ROOM-LINK',
          adminPassword: 'MUST-NOT-LEAK',
        }),
      );
    else response.writeHead(404).end('{}');
  });
  const socket = new Server(http, { path: '/ws', transports: ['websocket'] });
  socket.use(async (client, next) => {
    try {
      await jwtVerify(client.request.headers.cookie?.split('access_token=')[1] ?? '', key);
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });
  socket.on('connection', (client) => {
    client.onAny((event) => coreEvents.push(event));
    client.on('live:subscribe', (ruid, ack) => {
      if (ruid !== room) {
        ack?.({ ok: false });
        return;
      }
      // Old cores may still send a count of upstream sockets; web must ignore it.
      client.emit('live:viewers', { ruid: room, viewers: 999 });
      client.emit('live', {
        ruid: room,
        sequence: 1,
        timestamp: Date.now(),
        status: 'playing',
        matchId: 'test-match',
        scores: { red: 0, blue: 0, time: 10, scoreLimit: 3, timeLimit: 300 },
        players: [],
        discs: [],
        stadium: { name: 'Test pitch', width: 420, height: 200 },
        timeline: {
          matchId: 'test-match',
          revision: 1,
          startedAt: 1000,
          endedAt: null,
          events: [{ id: 'start', type: 'start', time: 0, timestamp: 1000 }],
        },
      });
      ack?.({ ok: true });
    });
  });
  await new Promise((resolve) => http.listen(0, '127.0.0.1', resolve));
  hosts.push(socket);
  return `http://127.0.0.1:${http.address().port}`;
}

async function connect(base, path, cookie) {
  const socket = io(base, {
    path,
    transports: ['websocket'],
    reconnection: false,
    forceNew: true,
    extraHeaders: { Origin: base, ...(cookie ? { Cookie: cookie } : {}) },
  });
  clients.push(socket);
  await new Promise((resolve, reject) => {
    socket.once('connect', resolve);
    socket.once('connect_error', reject);
  });
  return socket;
}

try {
  const capable = await mockHost('arena', true);
  const old = await mockHost('legacy', false);
  const state = {
    hosts: [
      { id: 'capable', name: 'Private capable host', baseUrl: capable, enabled: true },
      { id: 'old', name: 'Private old host', baseUrl: old, enabled: true },
    ],
    mappings: [
      { ruid: 'arena', hostId: 'capable' },
      { ruid: 'legacy', hostId: 'old' },
      { ruid: 'offline', hostId: 'capable' },
    ],
  };
  const storage = join(directory, '.node-persist/storage');
  await mkdir(storage, { recursive: true });
  await writeFile(
    join(storage, createHash('sha256').update('control-plane-state').digest('hex')),
    JSON.stringify({ key: 'control-plane-state', value: JSON.stringify(state) }),
  );
  const portProbe = createServer();
  await new Promise((resolve) => portProbe.listen(0, '127.0.0.1', resolve));
  const port = portProbe.address().port;
  await new Promise((resolve) => portProbe.close(resolve));
  const base = `http://127.0.0.1:${port}`;
  web = spawn(
    process.execPath,
    [join(root, 'node_modules/next/dist/bin/next'), 'start', root, '-H', '127.0.0.1', '-p', String(port)],
    {
      cwd: directory,
      env: { ...process.env, JWT_SECRET: secret, CORE_API_KEY: 'synthetic-api-key' },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Next server startup timeout')), 15000);
    const read = (chunk) => {
      webOutput += chunk;
      if (webOutput.includes('Ready in')) {
        clearTimeout(timer);
        resolve();
      }
    };
    web.stdout.on('data', read);
    web.stderr.on('data', read);
    web.once('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`Next exited (${code})`));
    });
  });
  for (const path of ['/live', '/live/arena']) {
    const response = await fetch(base + path, { redirect: 'manual' });
    assert.equal(response.status, 200, path);
    const body = await response.text();
    assert.doesNotMatch(body, /MUST-NOT-LEAK|PRIVATE-ROOM-LINK|Private capable host/);
  }
  const rooms = await (await fetch(base + '/api/public/rooms')).json();
  assert.deepEqual(rooms, { rooms: [{ ruid: 'arena', roomName: 'Public Arena', onlinePlayers: 2, viewers: 0 }] });
  for (const path of ['/live/legacy', '/live/offline']) {
    assert.equal((await fetch(base + path, { redirect: 'manual' })).status, 404, path);
  }
  for (const path of ['/admin', '/api/v1/room', '/api/v1/control/events', '/api/live', '/api/public/hosts']) {
    const response = await fetch(base + path, { redirect: 'manual' });
    assert.ok([307, 308].includes(response.status), path);
    assert.match(response.headers.get('location'), /\/login$/);
  }
  for (const path of ['/api/public/rooms', '/api/public/live']) {
    assert.equal((await fetch(base + path, { method: 'POST', redirect: 'manual' })).status, 405, path);
  }
  assert.equal((await fetch(base + '/api/public/live')).status, 200);
  for (const [name, checksum] of [
    ['kick', 'f3146b611026aa5e1ee293a14f950cb9bec474e8dd397e75a6e25a6d6166d186'],
    ['goal', '92122426336d9fd15c54663e9798a195320bef79b09a21ff9d0c588c21258294'],
  ]) {
    const sound = await fetch(base + `/audio/haxball-${name}.wav`);
    assert.equal(sound.status, 200);
    assert.equal(
      createHash('sha256')
        .update(Buffer.from(await sound.arrayBuffer()))
        .digest('hex'),
      checksum,
    );
  }
  const viewer = await connect(base, '/public-live-ws');
  const viewerCount = once(viewer, 'live:viewers');
  const received = once(viewer, 'live');
  const initialChat = once(viewer, 'chat:history');
  viewer.emit('live:subscribe', 'arena');
  const [frame] = await received;
  assert.deepEqual((await viewerCount)[0], { ruid: 'arena', viewers: 1 });
  assert.equal(frame.ruid, 'arena');
  assert.equal(frame.timeline.events[0].type, 'start');
  assert.equal(hosts[0].sockets.sockets.size, 1);
  const directoryCount = async () => (await (await fetch(base + '/api/public/rooms')).json()).rooms[0].viewers;
  assert.equal(await directoryCount(), 1, 'directory uses web-owned counts across Next route bundles');
  assert.deepEqual((await initialChat)[0], { ruid: 'arena', messages: [] });
  const sendChat = (client, payload) =>
    new Promise((resolve, reject) => {
      client.timeout(3000).emit('chat:send', payload, (error, result) => (error ? reject(error) : resolve(result)));
    });
  assert.equal((await sendChat(viewer, { text: 'No nickname' })).ok, false);
  const chatMessage = once(viewer, 'chat:message');
  assert.equal((await sendChat(viewer, { nickname: 'Viewer', text: '<b>Hello</b>' })).ok, true);
  const [message] = await chatMessage;
  assert.equal(message.nickname, 'Viewer');
  assert.equal(message.text, '<b>Hello</b>');
  assert.equal((await sendChat(viewer, { nickname: 'Viewer', text: 'Too fast' })).ok, false);
  const kicked = once(viewer, 'live:kick');
  const kick = { ruid: 'arena', id: 'kick-1', timestamp: Date.now(), playerId: 7, matchId: 'test-match' };
  viewer.emit('live:kick', { ...kick, id: 'untrusted' });
  hosts[0].emit('live:kick', kick);
  assert.deepEqual((await kicked)[0], kick);
  // Public sockets accept no administrative commands and cannot subscribe to old hosts.
  viewer.emit('setPassword', { password: 'do-not-forward' });
  const rejected = once(viewer, 'live:error');
  viewer.emit('live:subscribe', 'legacy');
  assert.equal(typeof (await rejected)[0], 'string');
  assert.equal((await sendChat(viewer, { nickname: 'Viewer', text: 'No room' })).ok, false);
  assert.equal(await directoryCount(), 0);
  assert.equal(hosts[0].sockets.sockets.size, 1, 'empty broadcast retains upstream during grace');
  assert.ok(coreEvents.every((event) => event === 'live:subscribe'));
  const token = await new SignJWT({ username: 'synthetic-admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1m')
    .sign(key);
  const cookie = `access_token=${token}`;
  for (const path of ['/api/live', '/admin/room/arena/live']) {
    assert.equal((await fetch(base + path, { headers: { Cookie: cookie } })).status, 404);
  }
  const secondViewer = await connect(base, '/public-live-ws');
  const secondHistory = once(secondViewer, 'chat:history');
  const cachedFrame = once(secondViewer, 'live');
  const lateKicks = [];
  secondViewer.on('live:kick', (payload) => lateKicks.push(payload));
  secondViewer.emit('live:subscribe', 'arena');
  assert.deepEqual((await secondHistory)[0].messages, [message]);
  assert.deepEqual((await cachedFrame)[0].stadium, frame.stadium);
  assert.deepEqual(lateKicks, [], 'late viewers must not replay kick sounds');
  const viewerHistory = once(viewer, 'chat:history');
  viewer.emit('live:subscribe', 'arena');
  assert.deepEqual((await viewerHistory)[0].messages, [message]);
  assert.equal(hosts[0].sockets.sockets.size, 1, 'two browsers share one upstream');
  assert.equal(
    coreEvents.filter((event) => event === 'live:subscribe').length,
    1,
    'joining and reloading viewers do not resubscribe core',
  );
  assert.equal(await directoryCount(), 2);
  const firstKick = once(viewer, 'live:kick');
  const secondKick = once(secondViewer, 'live:kick');
  hosts[0].emit('live:kick', { ...kick, id: 'kick-2' });
  assert.deepEqual((await firstKick)[0], (await secondKick)[0]);
  const repeatedCount = once(viewer, 'live:viewers');
  viewer.emit('live:subscribe', 'arena');
  assert.deepEqual((await repeatedCount)[0], { ruid: 'arena', viewers: 2 });
  const publicChat = once(viewer, 'chat:message');
  const secondChat = once(secondViewer, 'chat:message');
  assert.equal((await sendChat(secondViewer, { nickname: 'Another viewer', text: 'Shared chat' })).ok, true);
  assert.deepEqual((await publicChat)[0], (await secondChat)[0]);
  const departed = once(viewer, 'live:viewers');
  secondViewer.disconnect();
  assert.deepEqual((await departed)[0], { ruid: 'arena', viewers: 1 });
  assert.equal(await directoryCount(), 1);
  // A chat ACK acts as a barrier after explicit unsubscribe.
  viewer.emit('live:unsubscribe');
  assert.equal((await sendChat(viewer, { nickname: 'Viewer', text: 'Unsubscribed' })).ok, false);
  assert.equal(await directoryCount(), 0);
  assert.equal(hosts[0].sockets.sockets.size, 1);
  assert.ok(
    coreEvents.every((event) => event === 'live:subscribe'),
    'chat never reaches core',
  );
  console.log(
    'Public production checks passed: shared upstream, cached replay, web-owned counts, grace-period reuse, chat delivery, removed admin live routes, and protected admin APIs.',
  );
} catch (error) {
  console.error(error);
  if (webOutput.includes('Error')) console.error(webOutput);
  process.exitCode = 1;
} finally {
  clients.forEach((client) => client.disconnect());
  if (web && web.exitCode === null) {
    web.kill('SIGTERM');
    await once(web, 'exit');
  }
  await Promise.all(hosts.map((host) => new Promise((resolve) => host.close(resolve))));
  await rm(directory, { recursive: true, force: true });
}
