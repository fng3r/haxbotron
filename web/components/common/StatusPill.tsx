import { cn } from '@/lib/utils';

export type StatusPillValue = 'online' | 'offline' | 'healthy' | 'down' | 'disabled';

const styles: Record<StatusPillValue, string> = {
  online: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  healthy: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  offline: 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300',
  down: 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300',
  disabled: 'border-zinc-500/30 bg-zinc-500/10 text-zinc-600 dark:text-zinc-300',
};

const dotStyles: Record<StatusPillValue, string> = {
  online: 'bg-emerald-500',
  healthy: 'bg-emerald-500',
  offline: 'bg-red-500',
  down: 'bg-red-500',
  disabled: 'bg-zinc-500',
};

export function StatusPill({ status, className }: { status: StatusPillValue; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        styles[status],
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', dotStyles[status])} aria-hidden="true" />
      {status}
    </span>
  );
}

export function HostStatusPill({ enabled, healthy }: { enabled: boolean; healthy: boolean }) {
  return <StatusPill status={!enabled ? 'disabled' : healthy ? 'healthy' : 'down'} />;
}

export function RoomStatusPill({ online }: { online: boolean }) {
  return <StatusPill status={online ? 'online' : 'offline'} />;
}
