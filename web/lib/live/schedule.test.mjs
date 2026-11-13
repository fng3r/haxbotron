import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ScheduleSource, isCurrentReservation, isScheduleDate, linkSchedule, scheduleDate } from './schedule.ts';

test('current matches start at kick-off and stop exactly 30 minutes later', () => {
  const startsAt = '2026-11-13T21:30:00+03:00';
  const start = Date.parse(startsAt);
  assert.equal(isCurrentReservation(startsAt, start - 1), false);
  assert.equal(isCurrentReservation(startsAt, start), true);
  assert.equal(isCurrentReservation(startsAt, start + 30 * 60_000 - 1), true);
  assert.equal(isCurrentReservation(startsAt, start + 30 * 60_000), false);
  assert.equal(isCurrentReservation('invalid', start), false);
});

const entry = (id, codename, startsAt = '2026-11-13T20:00:00+03:00') => ({
  id,
  startsAt,
  host: { codename, name: `Room ${codename}` },
  match: {
    id,
    url: `https://cis-haxball.ru/match/${id}`,
    season: { id: 1, name: 'Season 17' },
    league: { id: 2, name: 'League' },
    stage: { id: 3, name: 'Playoffs' },
    group: null,
    tour: { id: 4, name: 'Final' },
    series: { id: 5, matchNumber: 2 },
    date: null,
    officialScore: [0, 0],
    isPlayed: false,
  },
  teams: {
    home: { id: 1, name: 'Home', shortName: 'H', logo: null },
    away: { id: 2, name: 'Away', shortName: 'A', logo: 'https://cis-haxball.ru/media/team.png' },
  },
});
const payload = (...reservations) => ({ date: '2026-11-13', timezone: 'Europe/Moscow', reservations });

test('dates are strict calendar dates and default day follows source timezone', () => {
  for (const date of ['2026-11-13', '2024-02-29']) assert.equal(isScheduleDate(date), true);
  for (const date of ['', '2026-2-01', '2026-02-29', '2026-11-31', '0000-01-01', '2026-11-13T00:00:00Z'])
    assert.equal(isScheduleDate(date), false, date);
  assert.equal(scheduleDate('Europe/Moscow', new Date('2026-11-13T22:00:00Z')), '2026-11-14');
});

test('schedule matches host codename directly to RUID, including unavailable room entries', () => {
  const schedule = payload(entry(1, 'cis6'), entry(2, 'cis7'), entry(3, 'CIS6'));
  const linked = linkSchedule(schedule, [{ ruid: 'cis6', hostId: 'unrelated-control-host' }]);
  assert.deepEqual(
    linked.reservations.map((item) => item.broadcastUrl),
    ['/live/cis6', null, null],
  );
  assert.deepEqual(
    linkSchedule(schedule, [{ ruid: 'cis6' }], 'cis7').reservations.map((item) => item.id),
    [2],
  );
  assert.equal(linked.reservations[0].match.tour.name, 'Final');
  assert.equal(linked.reservations[0].match.series.matchNumber, 2);
});

test('source coalesces requests, caches per date, expires and retains analyzer match context', async () => {
  let calls = 0,
    now = 0;
  const source = new ScheduleSource(
    'http://127.0.0.1:8000',
    async (url, options) => {
      calls++;
      assert.equal(url.pathname, '/api/reservations/');
      assert.equal(url.searchParams.get('date'), '2026-11-13');
      assert.equal(options.cache, 'no-store');
      assert.ok(options.signal);
      return Response.json(
        payload(entry(2, 'cis7'), { ...entry(1, 'cis6', '2026-11-13T18:00:00+03:00'), author: 'PRIVATE' }),
      );
    },
    () => now,
  );
  const [a, b] = await Promise.all([source.get('2026-11-13'), source.get('2026-11-13')]);
  assert.equal(calls, 1);
  assert.equal(a, b);
  assert.deepEqual(
    a.reservations.map((item) => item.id),
    [1, 2],
  );
  assert.equal(a.reservations[0].author, undefined, 'only public contract fields survive');
  assert.equal(a.reservations[0].match.stage.name, 'Playoffs');
  await source.get('2026-11-13');
  assert.equal(calls, 1);
  now = 30_001;
  await source.get('2026-11-13');
  assert.equal(calls, 2);
});

test('source rejects errors, wrong dates, unsafe links and unknown timezones without caching failures', async () => {
  for (const result of [
    () => new Response('{}', { status: 503 }),
    () => Response.json({ ...payload(), date: '2026-11-14' }),
    () => Response.json({ ...payload(), timezone: 'invalid' }),
    () =>
      Response.json(payload({ ...entry(1, 'cis6'), match: { ...entry(1, 'cis6').match, url: 'javascript:alert(1)' } })),
  ]) {
    let calls = 0;
    const source = new ScheduleSource('https://cis-haxball.ru', async () => {
      calls++;
      return calls === 1 ? result() : Response.json(payload());
    });
    await assert.rejects(source.get('2026-11-13'));
    assert.deepEqual(await source.get('2026-11-13'), payload());
    assert.equal(calls, 2);
  }
});
