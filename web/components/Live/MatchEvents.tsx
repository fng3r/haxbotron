import { ArrowRightLeft, CircleDot, Flag, LogIn, LogOut, Pause, Play, Square, Trophy } from 'lucide-react';

import { describeEvent, eventTime } from '@/lib/live/timeline';
import type { LiveMatchEvent } from '@/lib/live/types';

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

export default function MatchEvents({
  events,
  newestFirst = true,
}: {
  events: LiveMatchEvent[];
  newestFirst?: boolean;
}) {
  return (
    <ol className="px-3 py-1">
      {(newestFirst ? [...events].reverse() : events).map((event) => {
        const Icon = icons[event.type];
        const { title, detail: details } = describeEvent(event);
        const teamColor =
          event.team === 1 ? 'text-[#e66e55]' : event.team === 2 ? 'text-[#5a89e5]' : 'text-muted-foreground';
        return (
          <li key={event.id} className="relative flex gap-2 border-b border-border/60 py-2 last:border-b-0">
            <div className={`flex size-5 shrink-0 items-center justify-center rounded-full bg-muted/30 ${teamColor}`}>
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
  );
}
