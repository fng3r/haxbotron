import { connection } from 'next/server';

import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';

import ServerInfo from '@/components/Admin/ServerInfo';

import { getServerInfo } from '@/lib/api/server';
import { queryKeys } from '@/lib/queries/server';

export default async function ServerInfoPage() {
  await connection();

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: queryKeys.info,
    queryFn: getServerInfo,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ServerInfo />
    </HydrationBoundary>
  );
}
