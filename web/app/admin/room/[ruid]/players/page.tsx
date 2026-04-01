import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';

import OnlinePlayerList from '@/components/Admin/OnlinePlayersList';
import RoomPlayersList from '@/components/Admin/RoomPlayersList';

import { queryKeys } from '@/lib/queries/player';
import { getServerOnlinePlayers, getServerPlayerAccountList } from '@/lib/server/control-plane';

export default async function RoomPlayerList({ params }: { params: Promise<{ ruid: string }> }) {
  const { ruid } = await params;
  const queryClient = new QueryClient();

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: [...queryKeys.players(ruid), { page: 1, pagingCount: 10, searchQuery: '' }],
      queryFn: () => getServerPlayerAccountList(ruid, { page: 1, pagingCount: 10 }),
    }),

    queryClient.prefetchQuery({
      queryKey: queryKeys.onlinePlayers(ruid),
      queryFn: () => getServerOnlinePlayers(ruid),
    }),
  ]);

  return (
    <div className="space-y-4">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <OnlinePlayerList ruid={ruid} />
        <RoomPlayersList ruid={ruid} />
      </HydrationBoundary>
    </div>
  );
}
