'use client';

import Link from 'next/link';

import BroadcastSchedule from './BroadcastSchedule';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, Eye, Radio, RefreshCw, Users } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import type { PublicLiveRoom } from '@/lib/live/public';

export default function PublicLiveRooms() {
  const {
    data: rooms,
    isPending,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['public', 'live', 'rooms'],
    queryFn: async (): Promise<PublicLiveRoom[]> => {
      const response = await fetch('/api/public/rooms');
      if (!response.ok) throw new Error('Broadcast directory unavailable');
      const data = await response.json();
      return data.rooms;
    },
    refetchInterval: 5_000,
    staleTime: 5_000,
    retry: 1,
  });

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6 border-b pb-8">
        <div>
          <p className="mb-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
            <Radio className="size-3.5" /> Match broadcasts
          </p>
          <h1 className="font-serif text-5xl tracking-tight sm:text-6xl">Live rooms</h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
            Pick a room to watch the pitch, follow the score and catch every match event.
          </p>
        </div>
      </div>

      <BroadcastSchedule />
      <div className="mb-3 flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        <span>Available broadcasts</span>
        <div className="flex items-center gap-3">
          <span>{rooms?.length ?? 0} rooms online</span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-9"
            aria-label="Refresh available broadcasts"
            onClick={() => void refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`size-3.5 ${isFetching ? 'motion-safe:animate-spin' : ''}`} aria-hidden="true" />
          </Button>
        </div>
      </div>
      {isError && (
        <Alert className="mb-4">
          <AlertDescription>
            Broadcast directory is temporarily unavailable. Try refreshing in a moment.
          </AlertDescription>
        </Alert>
      )}
      {isPending ? (
        <Card className="gap-0 px-6 py-12 text-sm text-muted-foreground" role="status">
          Finding live rooms…
        </Card>
      ) : rooms?.length ? (
        <Card className="gap-0 overflow-hidden py-0">
          <ul>
            {rooms.map((room, index) => (
              <li key={room.ruid} className="border-b last:border-b-0">
                <div className="flex items-center gap-4 bg-card px-5 py-6 sm:gap-6 sm:px-7">
                  <span className="hidden font-mono text-sm tabular-nums text-muted-foreground sm:block">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="break-words text-lg font-semibold tracking-tight">
                      <Link href={`/live/${encodeURIComponent(room.ruid)}`} className="hover:underline">
                        {room.roomName}
                      </Link>
                    </h2>
                    <p className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <span className="size-1.5 rounded-full bg-emerald-500" /> Room online
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="size-3" aria-hidden="true" />
                        {room.onlinePlayers} players
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Eye className="size-3" aria-hidden="true" />
                        {room.viewers ?? 0} {room.viewers === 1 ? 'viewer' : 'viewers'}
                      </span>
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/live/${encodeURIComponent(room.ruid)}`}>
                      Watch <ArrowUpRight className="size-3.5" aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        !isError && (
          <Card className="gap-0 border-dashed px-6 py-14 text-center">
            <Radio className="mx-auto mb-4 size-6 text-muted-foreground" aria-hidden="true" />
            <h2 className="font-medium">No broadcasts online yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Rooms will appear here when a broadcast-capable host opens them.
            </p>
          </Card>
        )
      )}
      <p className="mt-5 text-xs text-muted-foreground">
        The room list updates automatically. Watching does not occupy a player slot.
      </p>
    </div>
  );
}
