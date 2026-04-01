import { connection } from 'next/server';

import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';

import ControlOverview from '@/components/Admin/ControlOverview';

import { queryKeys } from '@/lib/queries/control';
import { getServerControlHosts, getServerControlSummary, getServerManagedRooms } from '@/lib/server/control-plane';

export default async function ControlOverviewPage() {
  await connection();

  const queryClient = new QueryClient();
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.summary,
      queryFn: getServerControlSummary,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.hosts,
      queryFn: getServerControlHosts,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.rooms,
      queryFn: getServerManagedRooms,
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ControlOverview />
    </HydrationBoundary>
  );
}
