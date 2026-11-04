import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ArrowLeft } from 'lucide-react';

import RoomLive from '@/components/Live/RoomLive';

import { getControlPlaneService } from '@/lib/control-plane/service';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Watch live | Haxbotron' };

export default async function PublicBroadcastPage({ params }: { params: Promise<{ ruid: string }> }) {
  const { ruid } = await params;
  const rooms = await getControlPlaneService()
    .listPublicLiveRooms()
    .catch(() => []);
  const room = rooms.find((item) => item.ruid === ruid);
  if (!room) notFound();
  return (
    <>
      <Link
        href="/live"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> All broadcasts
      </Link>
      <RoomLive key={ruid} ruid={ruid} roomName={room.roomName} />
    </>
  );
}
