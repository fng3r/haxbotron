'use client';

import { type ReactNode, useState } from 'react';

import {
  ArrowRightLeft,
  CircleDot,
  Flag,
  LogIn,
  LogOut,
  PanelRightClose,
  Pause,
  Play,
  Square,
  Trophy,
} from 'lucide-react';

import { Button } from '@/components/ui/button';

import { type TimelineFilter, describeEvent, eventTime, filterEvents } from '@/lib/live/timeline';
import type { LiveMatchEvent, LiveMatchTimeline } from '@/lib/live/types';

const icons: Record<LiveMatchEvent['type'], typeof Flag> = {
  start: Flag,
  goal: CircleDot,
  pause: Pause,
  resume: Play,
  victory: Trophy,
  stop: Square,
  join: LogIn,
  leave: LogOut,
  teamChange: ArrowRightLeft,
};

export default function MatchTimeline({
  timeline,
  connected,
  id,
  collapsed,
  onCollapse,
  chat,
}: {
  timeline: LiveMatchTimeline | null;
  connected: boolean;
  id: string;
  collapsed: boolean;
  onCollapse: () => void;
  chat: ReactNode;
}) {
  const [tab, setTab] = useState<'events' | 'chat'>('chat');
  const [filter, setFilter] = useState<TimelineFilter>('all');
  const events = filterEvents(timeline?.events ?? [], filter);
  const total = filterEvents(timeline?.events ?? [], 'all').length;
  return (
    <aside
      id={id}
      hidden={collapsed}
      className={`${collapsed ? 'hidden' : 'flex'} min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border bg-card lg:absolute lg:inset-0`}
      aria-label="Broadcast side panel"
    >
      <div className="flex shrink-0 items-center justify-between border-b px-3 py-2">
        <div className="flex gap-1" role="tablist" aria-label="Broadcast panel">
          {(['chat', 'events'] as const).map((value) => (
            <Button
              key={value}
              type="button"
              role="tab"
              id={`${id}-${value}-tab`}
              aria-selected={tab === value}
              tabIndex={tab === value ? 0 : -1}
              aria-controls={`${id}-${value}-panel`}
              variant={tab === value ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={() => setTab(value)}
              onKeyDown={(event) => {
                if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
                event.preventDefault();
                const next =
                  event.key === 'Home' ? 'chat' : event.key === 'End' ? 'events' : tab === 'events' ? 'chat' : 'events';
                setTab(next);
                document.getElementById(`${id}-${next}-tab`)?.focus();
              }}
            >
              {value === 'events' ? 'Events' : 'Chat'}
            </Button>
          ))}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7"
          aria-label="Collapse side panel"
          aria-expanded={!collapsed}
          aria-controls={id}
          onClick={onCollapse}
        >
          <PanelRightClose className="size-3.5" aria-hidden="true" />
        </Button>
      </div>
      <div
        role="tabpanel"
        id={`${id}-events-panel`}
        aria-labelledby={`${id}-events-tab`}
        hidden={tab !== 'events'}
        className={tab === 'events' ? 'flex min-h-0 flex-1 flex-col' : 'hidden'}
      >
        <header className="flex min-h-[60px] shrink-0 items-center justify-between gap-2 border-b px-3 py-3">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">Match events</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {!connected && timeline
                ? 'Reconnecting · history retained'
                : timeline?.endedAt
                  ? 'Final timeline'
                  : timeline
                    ? 'Current match · latest first'
                    : 'Waiting for kick-off'}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <span
              className="rounded border px-1.5 py-0.5 font-mono text-[11px] tabular-nums text-muted-foreground"
              aria-label={`${events.length} of ${total} events shown`}
            >
              {filter === 'all' ? total : `${events.length}/${total}`}
            </span>
          </div>
        </header>
        <div className="shrink-0 border-b px-3 py-1.5">
          <div className="inline-flex gap-1 rounded-md bg-muted/40 p-0.5" role="group" aria-label="Filter match events">
            {(['all', 'goals'] as const).map((value) => (
              <Button
                key={value}
                type="button"
                variant={filter === value ? 'secondary' : 'ghost'}
                size="sm"
                className="h-6 px-3 text-[11px]"
                aria-pressed={filter === value}
                aria-controls={`${id}-events`}
                onClick={() => setFilter(value)}
              >
                {value === 'all' ? 'All' : 'Goals'}
              </Button>
            ))}
          </div>
        </div>
        <div id={`${id}-events`} className="min-h-0 max-h-96 overflow-y-auto overscroll-contain lg:h-0 lg:max-h-none lg:flex-1">
          {timeline ? (
            <ol className="px-3 py-1">
              {[...events].reverse().map((event) => {
                const Icon = icons[event.type];
                const { title, detail } = describeEvent(event);
                const details = [
                  detail,
                  event.goal?.assistant && !event.goal.ownGoal ? `Assist: ${event.goal.assistant.name}` : null,
                ]
                  .filter(Boolean)
                  .join(' · ');
                const teamColor =
                  event.team === 1 ? 'text-[#e66e55]' : event.team === 2 ? 'text-[#5a89e5]' : 'text-muted-foreground';
                return (
                  <li key={event.id} className="relative flex gap-2 border-b border-border/60 py-2 last:border-b-0">
                    <div
                      className={`flex size-5 shrink-0 items-center justify-center rounded-full bg-muted/30 ${teamColor}`}
                    >
                      <Icon className="size-3" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span
                          className={`min-w-0 flex-1 truncate text-xs font-semibold leading-5 ${event.type === 'goal' || event.type === 'victory' ? teamColor : ''}`}
                          title={title}
                        >
                          {title}
                        </span>
                        {event.scores && (
                          <span className="shrink-0 font-mono text-[11px] font-semibold tabular-nums">
                            <span className="text-[#e66e55]">{event.scores.red}</span>
                            <span className="px-1 text-muted-foreground">–</span>
                            <span className="text-[#5a89e5]">{event.scores.blue}</span>
                          </span>
                        )}
                        <time
                          className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground"
                          dateTime={`PT${Math.floor(event.time)}S`}
                        >
                          {eventTime(event.time)}
                        </time>
                      </div>
                      {details && (
                        <p className="truncate text-[11px] leading-4 text-muted-foreground" title={details}>
                          {details}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <div className="px-6 py-10 text-center">
              <Flag className="mx-auto mb-3 size-5 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm font-medium">The story starts at kick-off</p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Goals, assists and match events will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
      <div
        role="tabpanel"
        id={`${id}-chat-panel`}
        aria-labelledby={`${id}-chat-tab`}
        hidden={tab !== 'chat'}
        className={tab === 'chat' ? 'flex min-h-0 flex-1 flex-col' : 'hidden'}
      >
        {chat}
      </div>
    </aside>
  );
}
