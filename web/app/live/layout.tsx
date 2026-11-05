import type { Metadata } from 'next';
import Link from 'next/link';

import { Radio } from 'lucide-react';

import { ModeToggle } from '@/components/ModeToggle';

export const metadata: Metadata = {
  title: 'Live rooms | Haxbotron',
  description: 'Watch HaxBall matches live, with scores and match events.',
};

export default function LiveLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link href="/live" className="flex items-center gap-3 font-semibold tracking-tight">
            <span className="flex size-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Radio className="size-4" />
            </span>
            Haxbotron <span className="font-normal text-muted-foreground">Live</span>
          </Link>
          <ModeToggle />
        </div>
      </header>
      <main className="mx-auto max-w-screen-2xl px-5 py-8 sm:px-8 sm:py-10">{children}</main>
    </div>
  );
}
