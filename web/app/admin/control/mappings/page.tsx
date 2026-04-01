import { connection } from 'next/server';

import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';

import ControlMappings from '@/components/Admin/ControlMappings';

import { queryKeys } from '@/lib/queries/control';
import { getServerControlHosts, getServerControlMappings } from '@/lib/server/control-plane';

export default async function ControlMappingsPage() {
  await connection();

  const queryClient = new QueryClient();
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.hosts,
      queryFn: getServerControlHosts,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.mappings,
      queryFn: getServerControlMappings,
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ControlMappings />
    </HydrationBoundary>
  );
}
