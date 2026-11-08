'use client';

import { type ReactNode, useState } from 'react';

import MatchEvents from './MatchEvents';
import MatchHistory from './MatchHistory';
import { Flag, History, List, MessageCircle, PanelRightClose } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

import { type TimelineFilter, filterEvents } from '@/lib/live/timeline';
import type { CompletedMatch, LiveMatchTimeline } from '@/lib/live/types';

export default function MatchTimeline({
  timeline,
  connected,
  id,
  collapsed,
  onCollapse,
  chat,
  matches,
}: {
  timeline: LiveMatchTimeline | null;
  connected: boolean;
  id: string;
  collapsed: boolean;
  onCollapse: () => void;
  chat: ReactNode;
  matches: CompletedMatch[];
}) {
  const [filter, setFilter] = useState<TimelineFilter>('all');
  const events = filterEvents(timeline?.events ?? [], filter);
  const total = filterEvents(timeline?.events ?? [], 'all').length;
  return (
    <Tabs defaultValue="chat" asChild className="gap-0">
      <aside
        id={id}
        hidden={collapsed}
        className={`${collapsed ? 'hidden' : 'flex'} min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border bg-card lg:absolute lg:inset-0`}
        aria-label="Broadcast side panel"
      >
        <div className="flex shrink-0 items-center justify-between border-b px-3 py-2">
          <TabsList aria-label="Broadcast panel" className="group-data-[orientation=horizontal]/tabs:h-8">
            <TabsTrigger value="chat" className="px-2 text-xs dark:data-[state=active]:border-transparent">
              <MessageCircle className="size-3.5" aria-hidden="true" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="events" className="px-2 text-xs dark:data-[state=active]:border-transparent">
              <List className="size-3.5" aria-hidden="true" />
              Events
            </TabsTrigger>
            <TabsTrigger value="history" className="px-2 text-xs dark:data-[state=active]:border-transparent">
              <History className="size-3.5" aria-hidden="true" />
              History
            </TabsTrigger>
          </TabsList>
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
        <TabsContent
          forceMount
          value="events"
          className="m-0 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
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
            <ToggleGroup
              type="single"
              value={filter}
              onValueChange={(value) => {
                if (value === 'all' || value === 'goals') setFilter(value);
              }}
              aria-label="Filter match events"
              className="gap-1 rounded-md bg-muted/40 p-0.5"
            >
              <ToggleGroupItem
                value="all"
                aria-controls={`${id}-events`}
                className="h-6 min-w-0 rounded-md px-3 text-[11px]"
              >
                All
              </ToggleGroupItem>
              <ToggleGroupItem
                value="goals"
                aria-controls={`${id}-events`}
                className="h-6 min-w-0 rounded-md px-3 text-[11px]"
              >
                Goals
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div
            data-broadcast-scroll
            id={`${id}-events`}
            className="min-h-0 max-h-96 overflow-y-auto overscroll-contain lg:h-0 lg:max-h-none lg:flex-1"
          >
            {timeline ? (
              <MatchEvents events={events} />
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
        </TabsContent>
        <TabsContent
          forceMount
          value="history"
          className="m-0 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
        >
          <MatchHistory matches={matches} />
        </TabsContent>
        <TabsContent forceMount value="chat" className="m-0 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden">
          {chat}
        </TabsContent>
      </aside>
    </Tabs>
  );
}
