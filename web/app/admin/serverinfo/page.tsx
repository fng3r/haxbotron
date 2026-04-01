import { connection } from 'next/server';

import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';

import ServerInfo from '@/components/Admin/ServerInfo';

import { queryKeys } from '@/lib/queries/server';
import { getServerControlHosts, getServerControlSummary } from '@/lib/server/control-plane';

export default async function ServerInfoPage() {
  await connection();

  const queryClient = new QueryClient();
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.info,
      queryFn: getServerControlSummary,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.hosts,
      queryFn: getServerControlHosts,
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ServerInfo />
    </HydrationBoundary>
  );
}
