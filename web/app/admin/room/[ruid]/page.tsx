import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';

import RoomInfo from '@/components/Admin/RoomInfo';

import { getRoomFreezeStatus, getRoomInfo } from '@/lib/api/room';
import { queryKeys } from '@/lib/queries/room';

export default async function RoomInfoPage({ params }: { params: Promise<{ ruid: string }> }) {
  const { ruid } = await params;

  const queryClient = new QueryClient();
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.room(ruid),
      queryFn: () => getRoomInfo(ruid),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.roomFreezeStatus(ruid),
      queryFn: () => getRoomFreezeStatus(ruid),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <RoomInfo ruid={ruid} />
    </HydrationBoundary>
  );
}
