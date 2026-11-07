'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Users, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

import type { LiveFrame } from '@/lib/live/types';

const teams = [
  { id: 1, label: 'Red', color: 'text-[#e66e55]', border: 'border-[#e66e55]/50' },
  { id: 0, label: 'Spectators', color: 'text-muted-foreground', border: 'border-border' },
  { id: 2, label: 'Blue', color: 'text-[#5a89e5]', border: 'border-[#5a89e5]/50' },
];

export default function BroadcastPlayers({
  players,
  open,
  onOpenChange,
  container,
}: {
  container: HTMLElement | null;
  players: LiveFrame['players'];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 hover:bg-white/15 hover:text-white focus-visible:ring-white/70"
          aria-label={open ? 'Hide player list' : 'Show player list'}
          aria-keyshortcuts="p"
          title="Players (P)"
        >
          <Users aria-hidden="true" />
        </Button>
      </DialogTrigger>
      {/* Keep the dialog inside the canvas card, including native fullscreen. */}
      {container && (
        <DialogPrimitive.Portal container={container}>
          <DialogPrimitive.Content className="absolute left-1/2 top-1/2 z-30 flex h-[calc(100%-1.5rem)] max-h-[420px] min-h-0 w-[calc(100%-1.5rem)] max-w-[720px] -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg border bg-background/95 p-3 text-foreground shadow-xl outline-none sm:p-4">
            <div className="mb-3 flex shrink-0 items-center justify-between gap-3 border-b pb-2">
              <DialogTitle className="text-sm font-semibold">Players</DialogTitle>
              <DialogDescription className="sr-only">Live player roster grouped by team. Read only.</DialogDescription>
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0"
                  aria-label="Close player list"
                >
                  <X aria-hidden="true" />
                </Button>
              </DialogClose>
            </div>
            <div className="grid min-h-0 flex-1 grid-cols-3 gap-2 sm:gap-3">
              {teams.map((team) => {
                const members = players.filter((player) => player.team === team.id);
                return (
                  <section
                    key={team.id}
                    aria-label={`${team.label} players`}
                    className={`flex min-h-0 min-w-0 flex-col rounded-md border-t-2 bg-muted/40 ${team.border}`}
                  >
                    <h3
                      className={`flex shrink-0 flex-wrap items-center justify-center gap-x-2 border-b px-1 py-2 text-xs font-semibold ${team.color}`}
                    >
                      {team.label}
                      <span className="font-mono text-[10px] font-normal tabular-nums text-muted-foreground">
                        {members.length}
                      </span>
                    </h3>
                    <ul className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1 sm:p-2">
                      {members.map((player) => (
                        <li
                          key={player.id}
                          className="truncate rounded px-1 py-1 text-xs leading-5 sm:px-2 sm:text-sm"
                          title={player.name}
                        >
                          {player.name}
                        </li>
                      ))}
                      {!members.length && (
                        <li className="px-1 py-3 text-center text-[11px] text-muted-foreground">
                          No {team.id === 0 ? 'spectators' : 'players'}
                        </li>
                      )}
                    </ul>
                  </section>
                );
              })}
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      )}
    </Dialog>
  );
}
