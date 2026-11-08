'use client';

import styles from './RoomLive.module.css';

import { useCallback, useEffect, useId, useRef, useState } from 'react';

import BroadcastChat from './BroadcastChat';
import BroadcastPlayers from './BroadcastPlayers';
import BroadcastShortcuts from './BroadcastShortcuts';
import BroadcastSound from './BroadcastSound';
import GoalCelebration, { type GoalCelebrationData } from './GoalCelebration';
import MatchTimeline from './MatchTimeline';
import { Eye, Maximize, Minimize, PanelRightClose, PanelRightOpen, RectangleHorizontal } from 'lucide-react';
import { io } from 'socket.io-client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';

import type { BroadcastAudio } from '@/lib/live/audio';
import type { ChatMessage } from '@/lib/live/chat';
import { detectGoal, goalForScore } from '@/lib/live/goals';
import { BroadcastRenderer, INTERPOLATION_DELAY_MS, ZOOM_LEVELS } from '@/lib/live/renderer';
import { mergeTimeline } from '@/lib/live/timeline';
import { isOvertime, isTimeRunningOut } from '@/lib/live/timer';
import type { CompletedMatch, LiveFrame, LiveKick, LiveMatchTimeline } from '@/lib/live/types';

export default function RoomLive({ ruid, roomName }: { ruid: string; roomName?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<BroadcastRenderer | null>(null);
  const [zoom, setZoom] = useState<number>(0);
  const zoomRef = useRef(0);
  const broadcast = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [playersOpen, setPlayersOpen] = useState(false);
  const [canvasContainer, setCanvasContainer] = useState<HTMLDivElement | null>(null);
  const [theater, setTheater] = useState(false);
  const expanded = theater || fullscreen;
  const audio = useRef<BroadcastAudio | null>(null);
  const muteButton = useRef<HTMLButtonElement>(null);
  const liveSocket = useRef<ReturnType<typeof io> | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatConnected, setChatConnected] = useState(false);
  const [frame, setFrame] = useState<LiveFrame | null>(null);
  const [connection, setConnection] = useState('Connecting…');
  const [stadium, setStadium] = useState({ name: 'Waiting for stadium', approximate: false });
  const [goal, setGoal] = useState<(GoalCelebrationData & { id: number }) | null>(null);
  const [matches, setMatches] = useState<CompletedMatch[]>([]);
  const [timeline, setTimeline] = useState<LiveMatchTimeline | null>(null);
  const [timelineOpen, setTimelineOpen] = useState(true);
  const [viewers, setViewers] = useState<number | null>(null);
  const timelineId = useId();
  const sidebarVisible = timelineOpen && !fullscreen;

  useEffect(() => {
    zoomRef.current = zoom;
    rendererRef.current?.setZoom(zoom);
  }, [zoom]);

  const toggleFullscreen = useCallback(async () => {
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
  }, [fullscreen]);

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.repeat ||
        event.isComposing ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey
      )
        return;
      if (
        event.target instanceof Element &&
        event.target.closest(
          'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="combobox"], [role="slider"]',
        )
      )
        return;
      const level = /^[0-5]$/.test(event.key) ? ZOOM_LEVELS[Number(event.key)] : undefined;
      const key = event.key.toLowerCase();
      if (level === undefined && key !== 'm' && key !== 't' && key !== 'f' && key !== 'p') return;
      event.preventDefault();
      if (level !== undefined) setZoom(level);
      else if (key === 'm') muteButton.current?.click();
      else if (key === 'p') setPlayersOpen((active) => !active);
      else if (key === 't') {
        if (fullscreen) void toggleFullscreen().then(() => setTheater(true));
        else setTheater((active) => !active);
      } else if (key === 'f') void toggleFullscreen();
    };
    document.addEventListener('keydown', shortcut);
    return () => document.removeEventListener('keydown', shortcut);
  }, [fullscreen, toggleFullscreen]);

  useEffect(() => {
    const syncFullscreen = () => setFullscreen(document.fullscreenElement === broadcast.current);
    const escape = (event: KeyboardEvent) => {
      if (playersOpen) return;
      if (event.key !== 'Escape' || document.fullscreenElement) return;
      if (fullscreen) setFullscreen(false);
      else setTheater(false);
    };
    document.addEventListener('fullscreenchange', syncFullscreen);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreen);
      document.removeEventListener('keydown', escape);
    };
  }, [fullscreen, playersOpen]);

  useEffect(() => {
    if (!expanded) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [expanded]);

  useEffect(() => {
    let disposed = false;
    const kickAudio = audio.current;
    let socket: ReturnType<typeof io> | undefined;
    let lastFrame = 0;
    let lastUIUpdate = 0;
    let previous: LiveFrame | null = null;
    let activeGoal: (GoalCelebrationData & { id: number }) | null = null;
    let goalStart: ReturnType<typeof setTimeout> | undefined;
    let goalEnd: ReturnType<typeof setTimeout> | undefined;
    const resetGoals = () => {
      audio.current?.clear();
      previous = null;
      activeGoal = null;
      clearTimeout(goalStart);
      clearTimeout(goalEnd);
      setGoal(null);
    };
    const renderer = new BroadcastRenderer(canvas.current!);
    renderer.setZoom(zoomRef.current);
    rendererRef.current = renderer;
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
        socket.on('match:history', (payload: { ruid: string; matches: CompletedMatch[] }) => {
          if (payload.ruid === ruid) setMatches(payload.matches);
        });
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
        socket.on('live:kick', (kick: LiveKick & { ruid: string }) => {
          if (kick.ruid !== ruid) return;
          if (
            previous &&
            (kick.matchId !== previous.matchId ||
              kick.timestamp < previous.timestamp + Math.max(0, Date.now() - lastFrame) - 500)
          )
            return;
          audio.current?.kick(kick, INTERPOLATION_DELAY_MS);
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
            audio.current?.goal(`${next.matchId}:${next.scores.red}:${next.scores.blue}`, INTERPOLATION_DELAY_MS);
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
              }, 3000);
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
          if (next.stadium) setStadium({ name: next.stadium.name, approximate: !!next.stadium.approximate });
          if (lastFrame - lastUIUpdate > 200 || next.status !== 'playing') {
            setFrame(next);
            lastUIUpdate = lastFrame;
          }
        });
        socket.on('live:error', (error: string) => {
          setChatConnected(false);
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
      kickAudio?.clear();
      renderer.destroy();
      rendererRef.current = null;
    };
  }, [ruid]);

  const seconds = Math.floor(frame?.scores?.time ?? 0);
  const timeWarning = frame?.status !== 'stopped' && isTimeRunningOut(frame?.scores ?? null);
  const overtime = frame?.status !== 'stopped' && isOvertime(frame?.scores ?? null);
  const time = `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  return (
    <div
      ref={broadcast}
      data-sidebar-open={sidebarVisible}
      className={`${styles.root} ${expanded ? styles.expanded : ''} grid items-stretch gap-4 ${sidebarVisible ? 'lg:grid-cols-[minmax(0,1fr)_19rem]' : 'grid-cols-1'}`}
    >
      <Card
        className={`${styles.broadcast} min-w-0 self-start gap-0 overflow-hidden py-0`}
        role="region"
        aria-label="Live game broadcast"
      >
        <CardHeader
          className={`${fullscreen ? 'grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]' : 'flex flex-wrap justify-between'} items-center gap-4 border-b px-5 py-4 [.border-b]:pb-4`}
        >
          <div className={fullscreen ? 'min-w-0 [&_h1]:truncate [&_p]:truncate' : undefined}>
            <h1 className="text-lg font-semibold tracking-tight">{roomName ?? 'Live broadcast'}</h1>
            <p className="text-xs text-muted-foreground">
              {stadium.name}
              {stadium.approximate && (
                <span className="text-amber-700 dark:text-amber-400"> (stadium unavailable)</span>
              )}
              {' · '}
              {ruid}
            </p>
          </div>
          <div
            className="flex items-center gap-4 font-mono text-2xl tabular-nums"
            aria-label={`Red ${frame?.scores?.red ?? 0}, Blue ${frame?.scores?.blue ?? 0}, time ${time}${overtime ? ', overtime' : ''}`}
          >
            <span className="text-[#e66e55]">{frame?.scores?.red ?? 0}</span>
            <span className="text-muted-foreground">:</span>
            <span className="text-[#5a89e5]">{frame?.scores?.blue ?? 0}</span>
            <div className="ml-3 flex items-center gap-2">
              <span
                className={timeWarning ? styles.timerWarning : undefined}
                data-paused={frame?.status !== 'playing' || connection !== 'Connected'}
              >
                {time}
              </span>
              {overtime && (
                <Badge
                  variant="outline"
                  role="status"
                  aria-label="Overtime"
                  title="Overtime"
                  className="rounded border-amber-500/30 bg-amber-500/10 px-2 py-1 text-lg font-semibold leading-none tracking-wide text-amber-700 dark:text-amber-400"
                >
                  OT
                </Badge>
              )}
            </div>
          </div>
          {!fullscreen && (
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
          )}
        </CardHeader>
        <CardContent ref={setCanvasContainer} className={`${styles.pitch} relative bg-[#18251f] px-0`}>
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
          <div
            role="group"
            aria-label="Broadcast view controls"
            className="absolute bottom-3 right-3 z-20 flex h-9 items-center gap-1 rounded-md border border-white/15 bg-black/65 p-0.5 text-white"
          >
            <BroadcastShortcuts />
            <BroadcastPlayers
              container={canvasContainer}
              players={frame?.players ?? []}
              open={playersOpen}
              onOpenChange={setPlayersOpen}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 min-w-14 px-2 font-mono text-xs hover:bg-white/15 hover:text-white focus-visible:ring-white/70"
              aria-label={`${zoom === 0 ? 'Full field' : `Zoom ${zoom} times`}. Click for next zoom level`}
              title="Zoom (0: full field; 1–5: native zoom; click to cycle)"
              onClick={() =>
                setZoom(ZOOM_LEVELS[((ZOOM_LEVELS as readonly number[]).indexOf(zoom) + 1) % ZOOM_LEVELS.length])
              }
            >
              {zoom === 0 ? 'Fit' : `${zoom}×`}
            </Button>
            {!fullscreen && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 hover:bg-white/15 hover:text-white focus-visible:ring-white/70 aria-pressed:bg-white/15"
                  aria-label={theater ? 'Exit theater mode' : 'Enter theater mode'}
                  title={theater ? 'Exit theater mode (T / Esc)' : 'Theater mode (T)'}
                  aria-pressed={theater}
                  onClick={() => setTheater((active) => !active)}
                >
                  <RectangleHorizontal aria-hidden="true" />
                </Button>
              </>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 hover:bg-white/15 hover:text-white focus-visible:ring-white/70 aria-pressed:bg-white/15"
              aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              title={fullscreen ? 'Exit fullscreen (F / Esc)' : 'Fullscreen (F)'}
              aria-pressed={fullscreen}
              onClick={() => void toggleFullscreen()}
            >
              {fullscreen ? <Minimize aria-hidden="true" /> : <Maximize aria-hidden="true" />}
            </Button>
          </div>
          <div className="absolute bottom-3 left-3 z-20">
            <BroadcastSound audioRef={audio} buttonRef={muteButton} />
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-2" role="status">
              <span
                className={`size-2 rounded-full ${connection === 'Connected' && frame?.status !== 'stopped' ? 'bg-emerald-500' : 'bg-amber-500'}`}
              />
              {connection === 'Connected'
                ? frame?.status === 'playing'
                  ? 'LIVE'
                  : frame?.status?.toUpperCase()
                : connection}
            </span>
          </div>
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
        </CardFooter>
      </Card>
      {/* On desktop the panel fills this grid cell without contributing to the row height. */}
      <div
        hidden={!sidebarVisible}
        className={`${styles.sidebar} ${sidebarVisible ? 'relative min-h-0 min-w-0' : 'hidden'}`}
      >
        <MatchTimeline
          id={timelineId}
          timeline={timeline}
          matches={matches}
          connected={connection === 'Connected'}
          collapsed={!sidebarVisible}
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
