import { connection } from 'next/server';

import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';

import RoomList from '@/components/Admin/RoomList';

import { queryKeys } from '@/lib/queries/room';
import { getServerAllRoomsList, getServerRoomsInfoList } from '@/lib/server/control-plane';

export default async function RoomListPage() {
  await connection();

  const queryClient = new QueryClient();
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.rooms,
      queryFn: getServerRoomsInfoList,
    }),

    queryClient.prefetchQuery({
      queryKey: queryKeys.allRooms,
      queryFn: getServerAllRoomsList,
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <RoomList />
    </HydrationBoundary>
  );
}
