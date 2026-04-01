import { connection } from 'next/server';

import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';

import ControlHosts from '@/components/Admin/ControlHosts';

import { queryKeys } from '@/lib/queries/control';
import { getServerControlHosts } from '@/lib/server/control-plane';

export default async function ControlHostsPage() {
  await connection();

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: queryKeys.hosts,
    queryFn: getServerControlHosts,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ControlHosts />
    </HydrationBoundary>
  );
}
