import { connection } from 'next/server';

import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';

import RoomWidget from '@/components/Admin/RoomWidget';
import ServerInfoWidget from '@/components/Admin/ServerInfoWidget';

import { getRoomsInfoList } from '@/lib/api/room';
import { getServerInfo } from '@/lib/api/server';
import { queryKeys as roomQueryKeys } from '@/lib/queries/room';
import { queryKeys as serverQueryKeys } from '@/lib/queries/server';

export default async function Mainboard() {
  await connection();

  const queryClient = new QueryClient();
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: serverQueryKeys.info,
      queryFn: getServerInfo,
    }),
    queryClient.prefetchQuery({
      queryKey: roomQueryKeys.rooms,
      queryFn: getRoomsInfoList,
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="flex flex-col gap-6">
        <ServerInfoWidget />
        <RoomWidget />
      </div>
    </HydrationBoundary>
  );
}
