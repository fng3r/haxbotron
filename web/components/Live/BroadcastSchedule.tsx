'use client';

import { useId, useState } from 'react';

import Link from 'next/link';

import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, CalendarDays, RefreshCw, Shield } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

import { isScheduleDate, scheduleDate } from '@/lib/live/schedule';
import type { Reservation, BroadcastSchedule as Schedule } from '@/lib/live/schedule';

function ScheduleTeam({ team, logoAfter = false }: { team: Reservation['teams']['home']; logoAfter?: boolean }) {
  return (
    <span className={`inline-flex min-w-0 max-w-full items-center gap-1.5 ${logoAfter ? 'flex-row-reverse' : ''}`}>
      <Avatar className="size-5 rounded-none" aria-hidden="true">
        <AvatarImage src={team.logo ?? undefined} alt="" className="object-contain" />
        <AvatarFallback className="rounded-none bg-transparent text-muted-foreground">
          <Shield className="size-4" />
        </AvatarFallback>
      </Avatar>
      <span className="min-w-0 break-words">{team.name}</span>
    </span>
  );
}

function matchContext(entry: Reservation) {
  const { season, league, stage, group, tour, series } = entry.match;
  return [season?.name, stage?.name || league?.name, group?.name, tour?.name, series && `Match ${series.matchNumber}`]
    .filter(Boolean)
    .join(' · ');
}

export default function BroadcastSchedule({ ruid }: { ruid?: string }) {
  const [date, setDate] = useState(() => scheduleDate());
  const dateId = useId();
  const valid = isScheduleDate(date);
  const { data, isPending, isError, isFetching, refetch } = useQuery({
    queryKey: ['public', 'live', 'schedule', date, ruid ?? null],
    queryFn: async ({ signal }): Promise<Schedule> => {
      const params = new URLSearchParams({ date });
      if (ruid) params.set('ruid', ruid);
      const response = await fetch(`/api/public/schedule?${params}`, { signal });
      if (!response.ok) throw new Error('Schedule unavailable');
      return response.json();
    },
    enabled: valid,
    staleTime: 30_000,
    refetchInterval: 30_000,
    retry: 1,
  });
  return (
    <section aria-label={ruid ? 'Room broadcast schedule' : 'Broadcast schedule'} className="my-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <CalendarDays className="size-4 text-muted-foreground" aria-hidden="true" />
            {ruid ? 'Room schedule' : 'Broadcast schedule'}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">Scheduled matches · {data?.timezone ?? 'Europe/Moscow'}</p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor={dateId} className="sr-only">
            Schedule date
          </label>
          <Input
            id={dateId}
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="w-40"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-9"
            aria-label="Refresh schedule"
            disabled={isFetching || !valid}
            onClick={() => void refetch()}
          >
            <RefreshCw className={`size-3.5 ${isFetching ? 'motion-safe:animate-spin' : ''}`} aria-hidden="true" />
          </Button>
        </div>
      </div>
      {!valid ? (
        <p className="text-sm text-muted-foreground">Select a date to see scheduled matches.</p>
      ) : isError ? (
        <Alert>
          <AlertDescription>Schedule is temporarily unavailable. Try refreshing in a moment.</AlertDescription>
        </Alert>
      ) : isPending ? (
        <Card className="px-5 py-8 text-sm text-muted-foreground" role="status">
          Loading schedule…
        </Card>
      ) : !data?.configured ? (
        <Card className="px-5 py-8 text-sm text-muted-foreground">The schedule source has not been configured.</Card>
      ) : !data.reservations.length ? (
        <Card className="border-dashed px-5 py-8 text-sm text-muted-foreground">
          No scheduled matches for this date.
        </Card>
      ) : (
        <Card className="gap-0 overflow-hidden py-0">
          <ul className="max-h-96 overflow-y-auto overscroll-contain">
            {data.reservations.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-wrap items-center gap-x-5 gap-y-3 border-b bg-card px-5 py-4 last:border-0"
              >
                <time dateTime={entry.startsAt} className="font-mono text-lg font-medium tabular-nums">
                  {new Date(entry.startsAt).toLocaleTimeString('en-GB', {
                    timeZone: data.timezone,
                    hour: '2-digit',
                    minute: '2-digit',
                    hourCycle: 'h23',
                  })}
                </time>
                <div className="min-w-0 flex-1 basis-40">
                  <a
                    href={entry.match.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1 font-semibold hover:underline"
                  >
                    <ScheduleTeam team={entry.teams.home} />
                    <span className="text-muted-foreground">vs</span>
                    <ScheduleTeam team={entry.teams.away} logoAfter />
                  </a>
                  <p className="mt-1 break-words text-xs text-muted-foreground">{matchContext(entry)}</p>
                  {!ruid && <p className="mt-1 text-xs text-muted-foreground">{entry.host.name}</p>}
                </div>
                {!ruid &&
                  (entry.broadcastUrl ? (
                    <Button asChild variant="outline" size="sm">
                      <Link href={entry.broadcastUrl}>
                        Watch <ArrowUpRight className="size-3.5" aria-hidden="true" />
                      </Link>
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">Broadcast offline</span>
                  ))}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </section>
  );
}
