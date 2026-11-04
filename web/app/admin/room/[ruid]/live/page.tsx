import RoomLive from '@/components/Admin/RoomLive';

export default async function RoomLivePage({ params }: { params: Promise<{ ruid: string }> }) {
  const { ruid } = await params;
  return <RoomLive key={ruid} ruid={ruid} />;
}
