import { z } from 'zod';

const httpUrl = z
  .string()
  .url()
  .refine((value) => /^https?:\/\//.test(value));
const ref = z.object({ id: z.number().int(), name: z.string() }).nullable();
const team = z.object({ id: z.number().int(), name: z.string(), shortName: z.string(), logo: httpUrl.nullable() });
const reservation = z.object({
  id: z.number().int().positive(),
  startsAt: z.string().datetime({ offset: true }),
  host: z.object({ codename: z.string().min(1), name: z.string() }),
  match: z.object({
    id: z.number().int().positive(),
    url: httpUrl,
    season: ref,
    league: ref,
    stage: ref,
    group: ref,
    tour: ref,
    series: z.object({ id: z.number().int(), matchNumber: z.number().int().positive() }).nullable(),
    date: z.string().nullable(),
    officialScore: z.tuple([z.number().int(), z.number().int()]),
    isPlayed: z.boolean(),
  }),
  teams: z.object({ home: team, away: team }),
});
const sourceSchedule = z.object({
  date: z.string(),
  timezone: z.string().refine((value) => {
    try {
      new Intl.DateTimeFormat('en', { timeZone: value });
      return true;
    } catch {
      return false;
    }
  }),
  reservations: z.array(reservation).max(2000),
});

export type Reservation = z.infer<typeof reservation>;

export function isCurrentReservation(startsAt: string, now: number): boolean {
  const start = Date.parse(startsAt);
  return now >= start && now < start + 30 * 60_000;
}

export type BroadcastSchedule = Omit<z.infer<typeof sourceSchedule>, 'reservations'> & {
  configured: boolean;
  reservations: (Reservation & { broadcastUrl: string | null })[];
};

export function isScheduleDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000')) return false;
  const timestamp = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value;
}

export function scheduleDate(timezone = 'Europe/Moscow', now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (type: string) => parts.find((value) => value.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function linkSchedule(
  schedule: z.infer<typeof sourceSchedule>,
  rooms: ReadonlyArray<{ ruid: string }>,
  ruid?: string,
): BroadcastSchedule {
  const available = new Set(rooms.map((room) => room.ruid));
  return {
    ...schedule,
    configured: true,
    reservations: schedule.reservations
      .filter((entry) => !ruid || entry.host.codename === ruid)
      .map((entry) => ({
        ...entry,
        broadcastUrl: available.has(entry.host.codename) ? `/live/${encodeURIComponent(entry.host.codename)}` : null,
      })),
  };
}

/** One shared, short-lived fetch per date; viewers never connect to the source directly. */
export class ScheduleSource {
  private cache = new Map<string, { expires: number; data: z.infer<typeof sourceSchedule> }>();
  private pending = new Map<string, Promise<z.infer<typeof sourceSchedule>>>();

  private baseUrl: string;
  private fetcher: typeof fetch;
  private clock: () => number;

  constructor(baseUrl: string, fetcher: typeof fetch = fetch, clock = Date.now) {
    this.baseUrl = baseUrl;
    this.fetcher = fetcher;
    this.clock = clock;
  }

  async get(date: string): Promise<z.infer<typeof sourceSchedule>> {
    if (!isScheduleDate(date)) throw new Error('Invalid schedule date');
    const cached = this.cache.get(date);
    if (cached && cached.expires > this.clock()) return cached.data;
    const pending = this.pending.get(date);
    if (pending) return pending;
    if (this.pending.size >= 32) throw new Error('Schedule source busy');
    const request = this.load(date);
    this.pending.set(date, request);
    try {
      return await request;
    } finally {
      this.pending.delete(date);
    }
  }

  private async load(date: string) {
    const url = new URL('/api/reservations/', this.baseUrl);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid schedule source');
    url.searchParams.set('date', date);
    const response = await this.fetcher(url, { signal: AbortSignal.timeout(5000), cache: 'no-store' });
    if (!response.ok) throw new Error('Schedule source unavailable');
    const data = sourceSchedule.parse(await response.json());
    if (data.date !== date) throw new Error('Schedule date mismatch');
    data.reservations.sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt) || a.id - b.id);
    this.cache.delete(date);
    this.cache.set(date, { data, expires: this.clock() + 30_000 });
    if (this.cache.size > 32) this.cache.delete(this.cache.keys().next().value!);
    return data;
  }
}
