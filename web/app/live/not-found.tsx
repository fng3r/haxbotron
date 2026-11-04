import Link from 'next/link';

export default function BroadcastNotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="font-serif text-3xl">Broadcast unavailable</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        This room is offline or does not currently support live broadcasting.
      </p>
      <Link href="/live" className="mt-6 inline-block text-sm font-medium underline underline-offset-4">
        Back to live rooms
      </Link>
    </div>
  );
}
