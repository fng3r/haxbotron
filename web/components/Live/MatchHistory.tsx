'use client';

import { useState } from 'react';

import MatchEvents from './MatchEvents';
import { ArrowLeft, ChevronRight, History } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { eventTime } from '@/lib/live/timeline';
import type { CompletedMatch } from '@/lib/live/types';

function Score({ match }: { match: CompletedMatch }) {
  return (
    <span className="font-mono font-semibold tabular-nums">
      <span className="text-[#e66e55]">{match.scores.red}</span>
      <span className="px-2 text-muted-foreground">–</span>
      <span className="text-[#5a89e5]">{match.scores.blue}</span>
    </span>
  );
}
function matchDate(time: number) {
  return new Date(time).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
}
export default function MatchHistory({ matches }: { matches: CompletedMatch[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = matches.find((match) => match.matchId === selectedId);
  return (
    <>
      <header className="flex shrink-0 items-center gap-2 border-b px-3 py-3">
        {selected && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label="Back to match history"
            onClick={() => setSelectedId(null)}
          >
            <ArrowLeft className="size-4" />
          </Button>
        )}
        <div>
          <h2 className="text-sm font-semibold">{selected ? 'Match details' : 'Recent matches'}</h2>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {selected ? matchDate(selected.startedAt) : 'Last 10 completed matches'}
          </p>
        </div>
      </header>
      <div
        data-broadcast-scroll
        className="min-h-0 max-h-96 flex-1 overflow-y-auto overscroll-contain lg:h-0 lg:max-h-none"
      >
        {selected ? (
          <>
            <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3 text-sm">
              <Score match={selected} />
              <span className="font-mono text-xs tabular-nums">{eventTime(selected.playtime)}</span>
              <span className="ml-auto text-[11px] text-muted-foreground">
                {selected.outcome === 'victory' ? 'Full time' : 'Stopped manually'}
              </span>
            </div>
            <section aria-label="Starting lineups" className="border-b p-3">
              <h3 className="mb-2 text-xs font-semibold">Starting lineups</h3>
              <div className="grid grid-cols-2 gap-3">
                {(['red', 'blue'] as const).map((team) => (
                  <div key={team} className="min-w-0">
                    <h4
                      className={`mb-1 text-xs font-semibold ${team === 'red' ? 'text-[#e66e55]' : 'text-[#5a89e5]'}`}
                    >
                      {team === 'red' ? 'Red' : 'Blue'}
                    </h4>
                    <ul className="space-y-1 text-xs">
                      {selected.startingLineups[team].map((player) => (
                        <li key={player.id} className="break-words" title={player.name}>
                          {player.name}
                        </li>
                      ))}
                    </ul>
                    {!selected.startingLineups[team].length && (
                      <p className="text-xs text-muted-foreground">No players</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
            <h3 className="px-3 pt-3 text-xs font-semibold">Match events</h3>
            <MatchEvents events={selected.events} newestFirst={false} />
          </>
        ) : matches.length ? (
          <ol className="divide-y px-3">
            {matches.map((match) => (
              <li key={match.matchId}>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-md px-1 py-3 text-left hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => setSelectedId(match.matchId)}
                  aria-label={`View match ${matchDate(match.startedAt)}, Red ${match.scores.red}, Blue ${match.scores.blue}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 text-sm">
                      <Score match={match} />
                      <span className="font-mono text-xs tabular-nums text-muted-foreground">
                        {eventTime(match.playtime)}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      <time dateTime={new Date(match.startedAt).toISOString()}>{matchDate(match.startedAt)}</time>
                      {match.outcome === 'stopped' ? ' · Stopped' : ''}
                    </p>
                  </div>
                  <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ol>
        ) : (
          <div className="px-6 py-10 text-center">
            <History className="mx-auto mb-3 size-5 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-medium">No completed matches yet</p>
            <p className="mt-2 text-xs text-muted-foreground">Finished matches will appear here.</p>
          </div>
        )}
      </div>
    </>
  );
}
