import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';

import RoomGeneral from '@/components/Admin/RoomGeneral';

import { queryKeys } from '@/lib/queries/room';
import { getServerRoomConfig, getServerRoomFreezeStatus, getServerRoomInfo } from '@/lib/server/control-plane';

export default async function RoomGeneralPage({ params }: { params: Promise<{ ruid: string }> }) {
  const { ruid } = await params;

  const queryClient = new QueryClient();
  const [, roomConfig] = await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.room(ruid),
      queryFn: () => getServerRoomInfo(ruid),
    }),
    getServerRoomConfig(ruid),
    queryClient.prefetchQuery({
      queryKey: queryKeys.roomFreezeStatus(ruid),
      queryFn: () => getServerRoomFreezeStatus(ruid),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <RoomGeneral ruid={ruid} roomConfig={roomConfig} />
    </HydrationBoundary>
  );
}
