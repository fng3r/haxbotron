import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';

import RoomInfo from '@/components/Admin/RoomInfo';

import { queryKeys } from '@/lib/queries/room';
import { getServerRoomFreezeStatus, getServerRoomInfo } from '@/lib/server/control-plane';

export default async function RoomInfoPage({ params }: { params: Promise<{ ruid: string }> }) {
  const { ruid } = await params;

  const queryClient = new QueryClient();
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.room(ruid),
      queryFn: () => getServerRoomInfo(ruid),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.roomFreezeStatus(ruid),
      queryFn: () => getServerRoomFreezeStatus(ruid),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <RoomInfo ruid={ruid} />
    </HydrationBoundary>
  );
}
