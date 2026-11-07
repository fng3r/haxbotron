'use client';

import { Keyboard } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const shortcuts = [
  ['0', 'Fit full field'],
  ['1–5', 'Zoom: 1× to 2×'],
  ['M', 'Mute / unmute'],
  ['P', 'Show / hide players'],
  ['T', 'Theater mode'],
  ['F', 'Fullscreen'],
  ['Esc', 'Exit expanded view'],
];

export default function BroadcastShortcuts() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 hover:bg-white/15 hover:text-white focus-visible:ring-white/70"
          aria-label="Keyboard shortcuts"
          title="Keyboard shortcuts"
        >
          <Keyboard aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        portalled={false}
        side="top"
        align="end"
        sideOffset={10}
        className="w-60 p-3"
        aria-label="Keyboard shortcuts"
      >
        <p className="mb-3 text-sm font-semibold">Keyboard shortcuts</p>
        <dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 text-xs">
          {shortcuts.map(([key, action]) => (
            <div key={key} className="contents">
              <dt>
                <kbd className="inline-flex min-w-8 justify-center rounded border bg-muted px-1.5 py-0.5 font-mono text-muted-foreground">
                  {key}
                </kbd>
              </dt>
              <dd>{action}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-[11px] text-muted-foreground">Disabled while typing in chat.</p>
      </PopoverContent>
    </Popover>
  );
}
