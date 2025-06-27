import { connection } from 'next/server';

import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';

import RoomList from '@/components/Admin/RoomList';

import { getAllRoomsList, getRoomsInfoList } from '@/lib/api/room';
import { queryKeys } from '@/lib/queries/room';

export default async function RoomListPage() {
  await connection();

  const queryClient = new QueryClient();
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.rooms,
      queryFn: getRoomsInfoList,
    }),

    queryClient.prefetchQuery({
      queryKey: queryKeys.allRooms,
      queryFn: getAllRoomsList,
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <RoomList />
    </HydrationBoundary>
  );
}
