'use client';

import { useEffect, useRef, useState } from 'react';

import GoalCelebration, { type GoalCelebrationData } from './GoalCelebration';
import { io } from 'socket.io-client';

import { detectGoal, goalForScore } from '@/lib/live/goals';
import { BroadcastRenderer, INTERPOLATION_DELAY_MS } from '@/lib/live/renderer';
import type { LiveFrame } from '@/lib/live/types';

export default function RoomLive({ ruid }: { ruid: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [frame, setFrame] = useState<LiveFrame | null>(null);
  const [connection, setConnection] = useState('Connecting…');
  const [stadium, setStadium] = useState('Waiting for stadium');
  const [goal, setGoal] = useState<(GoalCelebrationData & { id: number }) | null>(null);

  useEffect(() => {
    let disposed = false;
    let socket: ReturnType<typeof io> | undefined;
    let lastFrame = 0;
    let lastUIUpdate = 0;
    let previous: LiveFrame | null = null;
    let activeGoal: (GoalCelebrationData & { id: number }) | null = null;
    let goalStart: ReturnType<typeof setTimeout> | undefined;
    let goalEnd: ReturnType<typeof setTimeout> | undefined;
    const resetGoals = () => {
      previous = null;
      activeGoal = null;
      clearTimeout(goalStart);
      clearTimeout(goalEnd);
      setGoal(null);
    };
    const renderer = new BroadcastRenderer(canvas.current!);
    const timer = setInterval(() => {
      if (lastFrame && Date.now() - lastFrame > 3000) setConnection('Signal lost. Waiting for host…');
    }, 1000);
    async function connect() {
      try {
        const response = await fetch('/api/live');
        if (!response.ok || response.redirected) throw new Error('Unable to connect');
        if (disposed) return;
        socket = io({ path: '/live-ws', transports: ['websocket'], forceNew: true });
        socket.on('connect', () => {
          resetGoals();
          setConnection('Waiting for game state…');
          socket!.emit('live:subscribe', ruid);
        });
        socket.on('live', (next: LiveFrame & { ruid: string }) => {
          if (next.ruid !== ruid) return;
          renderer.push(next);
          const scoringTeam = detectGoal(previous, next);
          const before = previous?.scores;
          previous = next;
          if (scoringTeam && before && next.scores) {
            // Copy both scores now; later snapshots must not replace this goal's transition.
            const celebration = {
              team: scoringTeam,
              id: next.sequence,
              before: { red: before.red, blue: before.blue },
              after: { red: next.scores.red, blue: next.scores.blue },
              attribution: goalForScore(next.goal, scoringTeam, next.scores),
            };
            activeGoal = celebration;
            clearTimeout(goalStart);
            clearTimeout(goalEnd);
            // Match the pitch renderer's interpolation delay.
            goalStart = setTimeout(() => {
              setGoal(activeGoal);
              goalEnd = setTimeout(() => {
                activeGoal = null;
                setGoal(null);
              }, 2400);
            }, INTERPOLATION_DELAY_MS);
          } else if (!next.scores) {
            resetGoals();
          } else if (activeGoal && !activeGoal.attribution) {
            // Metadata may follow the first score snapshot. Enrich without restarting the animation.
            const attribution = goalForScore(next.goal, activeGoal.team, activeGoal.after);
            if (attribution) {
              activeGoal = { ...activeGoal, attribution };
              const enriched = activeGoal;
              setGoal((current) => (current?.id === enriched.id ? enriched : current));
            }
          }
          lastFrame = Date.now();
          setConnection('Connected');
          if (next.stadium) setStadium(next.stadium.name + (next.stadium.approximate ? ' (geometry unavailable)' : ''));
          if (lastFrame - lastUIUpdate > 200 || next.status !== 'playing') {
            setFrame(next);
            lastUIUpdate = lastFrame;
          }
        });
        socket.on('live:error', (error: string) => {
          resetGoals();
          setConnection(error);
        });
        socket.on('disconnect', () => {
          resetGoals();
          setConnection('Disconnected. Reconnecting…');
        });
        socket.on('connect_error', () => setConnection('Connection failed. Reconnecting…'));
      } catch {
        if (!disposed) setConnection('Unable to connect to broadcast. Reload to retry.');
      }
    }
    void connect();
    return () => {
      disposed = true;
      clearInterval(timer);
      clearTimeout(goalStart);
      clearTimeout(goalEnd);
      socket?.disconnect();
      renderer.destroy();
    };
  }, [ruid]);

  const seconds = Math.floor(frame?.scores?.time ?? 0);
  const time = `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  return (
    <section className="overflow-hidden rounded-xl border bg-card" aria-label="Live game broadcast">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b px-5 py-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Live broadcast</h1>
          <p className="text-xs text-muted-foreground">
            {stadium} · {ruid}
          </p>
        </div>
        <div
          className="flex items-center gap-4 font-mono text-xl tabular-nums"
          aria-label={`Red ${frame?.scores?.red ?? 0}, Blue ${frame?.scores?.blue ?? 0}, time ${time}`}
        >
          <span className="text-[#e66e55]">{frame?.scores?.red ?? 0}</span>
          <span className="text-muted-foreground">:</span>
          <span className="text-[#5a89e5]">{frame?.scores?.blue ?? 0}</span>
          <span className="ml-3 text-base">{time}</span>
        </div>
      </div>
      <div className="relative bg-[#18251f]">
        <canvas
          ref={canvas}
          className="block aspect-[16/9] w-full"
          aria-label="Live top-down view of the pitch, players and ball"
        >
          Your browser needs Canvas support to display the broadcast.
        </canvas>
        {goal && <GoalCelebration key={goal.id} {...goal} />}
        {(connection !== 'Connected' || frame?.status !== 'playing') && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="rounded-lg bg-black/65 px-5 py-3 text-sm font-medium text-white">
              {connection !== 'Connected'
                ? connection
                : frame?.status === 'paused'
                  ? 'Game paused'
                  : 'Waiting for the next game'}
            </span>
          </div>
        )}
      </div>
      <div
        className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-xs text-muted-foreground"
        role="status"
      >
        <span className="flex items-center gap-2">
          <span className={`size-2 rounded-full ${connection === 'Connected' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          {connection === 'Connected'
            ? frame?.status === 'playing'
              ? 'LIVE'
              : frame?.status?.toUpperCase()
            : connection}
        </span>
        <span>
          {frame?.players.filter((p) => p.team !== 0).length ?? 0} on pitch ·{' '}
          {frame?.players.filter((p) => p.team === 0).length ?? 0} spectators
        </span>
      </div>
    </section>
  );
}
