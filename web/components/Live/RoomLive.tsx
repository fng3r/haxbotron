'use client';

import styles from './RoomLive.module.css';

import { useEffect, useId, useRef, useState } from 'react';

import BroadcastChat from './BroadcastChat';
import GoalCelebration, { type GoalCelebrationData } from './GoalCelebration';
import MatchTimeline from './MatchTimeline';
import { Eye, Maximize, Minimize, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { io } from 'socket.io-client';

import { Button } from '@/components/ui/button';

import type { ChatMessage } from '@/lib/live/chat';
import { detectGoal, goalForScore } from '@/lib/live/goals';
import { BroadcastRenderer, INTERPOLATION_DELAY_MS } from '@/lib/live/renderer';
import { mergeTimeline } from '@/lib/live/timeline';
import type { LiveFrame, LiveMatchTimeline } from '@/lib/live/types';

export default function RoomLive({ ruid, roomName }: { ruid: string; roomName?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const broadcast = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const liveSocket = useRef<ReturnType<typeof io> | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatConnected, setChatConnected] = useState(false);
  const [frame, setFrame] = useState<LiveFrame | null>(null);
  const [connection, setConnection] = useState('Connecting…');
  const [stadium, setStadium] = useState('Waiting for stadium');
  const [goal, setGoal] = useState<(GoalCelebrationData & { id: number }) | null>(null);
  const [timeline, setTimeline] = useState<LiveMatchTimeline | null>(null);
  const [timelineOpen, setTimelineOpen] = useState(true);
  const [viewers, setViewers] = useState<number | null>(null);
  const timelineId = useId();

  useEffect(() => {
    const syncFullscreen = () => setFullscreen(document.fullscreenElement === broadcast.current);
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !document.fullscreenElement) setFullscreen(false);
    };
    document.addEventListener('fullscreenchange', syncFullscreen);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreen);
      document.removeEventListener('keydown', escape);
    };
  }, []);

  useEffect(() => {
    if (!fullscreen) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [fullscreen]);

  async function toggleFullscreen() {
    if (fullscreen) {
      if (document.fullscreenElement === broadcast.current) await document.exitFullscreen();
      else setFullscreen(false);
      return;
    }
    if (document.fullscreenEnabled && broadcast.current?.requestFullscreen) {
      try {
        await broadcast.current.requestFullscreen();
        return;
      } catch {
        /* Use a viewport-filling mode when native fullscreen is unavailable. */
      }
    }
    setFullscreen(true);
  }

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
        const response = await fetch('/api/public/live');
        if (!response.ok || response.redirected) throw new Error('Unable to connect');
        if (disposed) return;
        socket = io({ path: '/public-live-ws', transports: ['websocket'], forceNew: true });
        liveSocket.current = socket;
        socket.on('chat:history', (payload: { ruid: string; messages: ChatMessage[] }) => {
          if (payload.ruid !== ruid) return;
          setMessages(payload.messages);
          setChatConnected(true);
        });
        socket.on('chat:message', (message: ChatMessage) => {
          if (message.ruid === ruid)
            setMessages((current) => [...current.filter((m) => m.id !== message.id), message].slice(-100));
        });
        socket.on('connect', () => {
          setChatConnected(false);
          setViewers(null);
          resetGoals();
          setConnection('Waiting for game state…');
          socket!.emit('live:subscribe', ruid);
        });
        socket.on('live:viewers', (payload: { ruid: string; viewers: number }) => {
          if (payload.ruid === ruid && Number.isInteger(payload.viewers) && payload.viewers >= 0)
            setViewers(payload.viewers);
        });
        socket.on('live', (next: LiveFrame & { ruid: string }) => {
          if (next.ruid !== ruid) return;
          if (previous && next.matchId !== previous.matchId) resetGoals();
          renderer.push(next);
          if (next.timeline || next.matchId !== previous?.matchId) {
            setTimeline((current) => mergeTimeline(current, next));
          }
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
          setChatConnected(false);
          setViewers(null);
          resetGoals();
          setConnection(error);
        });
        socket.on('disconnect', () => {
          setChatConnected(false);
          setViewers(null);
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
      liveSocket.current = null;
      renderer.destroy();
    };
  }, [ruid]);

  const seconds = Math.floor(frame?.scores?.time ?? 0);
  const time = `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  return (
    <div
      ref={broadcast}
      data-sidebar-open={timelineOpen}
      className={`${styles.root} ${fullscreen ? styles.fullscreen : ''} grid items-stretch gap-4 ${timelineOpen ? 'lg:grid-cols-[minmax(0,1fr)_19rem]' : 'grid-cols-1'}`}
    >
      <section
        className={`${styles.broadcast} min-w-0 self-start overflow-hidden rounded-xl border bg-card`}
        aria-label="Live game broadcast"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b px-5 py-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">{roomName ?? 'Live broadcast'}</h1>
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
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-expanded={timelineOpen}
              aria-controls={timelineId}
              aria-label={timelineOpen ? 'Hide side panel' : 'Show side panel'}
              onClick={() => setTimelineOpen((open) => !open)}
            >
              {timelineOpen ? <PanelRightClose aria-hidden="true" /> : <PanelRightOpen aria-hidden="true" />}
              Events & Chat
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              title={fullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen'}
              aria-pressed={fullscreen}
              onClick={() => void toggleFullscreen()}
            >
              {fullscreen ? <Minimize aria-hidden="true" /> : <Maximize aria-hidden="true" />}
            </Button>
          </div>
        </div>
        <div className={`${styles.pitch} relative bg-[#18251f]`}>
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
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              <Eye className="size-3.5" aria-hidden="true" />
              {viewers ?? 0} {viewers === 1 ? 'viewer' : 'viewers'}
            </span>
            <span>
              {frame?.players.filter((p) => p.team !== 0).length ?? 0} on pitch ·{' '}
              {frame?.players.filter((p) => p.team === 0).length ?? 0} spectators
            </span>
          </span>
        </div>
      </section>
      {/* On desktop the panel fills this grid cell without contributing to the row height. */}
      <div
        hidden={!timelineOpen}
        className={`${styles.sidebar} ${timelineOpen ? 'relative min-h-0 min-w-0' : 'hidden'}`}
      >
        <MatchTimeline
          id={timelineId}
          timeline={timeline}
          connected={connection === 'Connected'}
          collapsed={!timelineOpen}
          onCollapse={() => setTimelineOpen(false)}
          chat={
            <BroadcastChat
              messages={messages}
              connected={chatConnected}
              send={(nickname, text) =>
                new Promise((resolve) => {
                  const socket = liveSocket.current;
                  if (!socket?.connected || !chatConnected)
                    return resolve({ ok: false, error: 'Chat is disconnected.' });
                  socket
                    .timeout(5000)
                    .emit(
                      'chat:send',
                      { nickname, text },
                      (error: Error | null, result: { ok: boolean; error?: string }) => {
                        resolve(
                          error
                            ? { ok: false, error: 'Message could not be confirmed. Check the chat before retrying.' }
                            : result,
                        );
                      },
                    );
                })
              }
            />
          }
        />
      </div>
    </div>
  );
}
