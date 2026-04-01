import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';

import BansList from '@/components/Admin/BansList';

import { queryKeys } from '@/lib/queries/player';
import { getServerPlayersBans } from '@/lib/server/control-plane';

export default async function BansListPage({ params }: { params: Promise<{ ruid: string }> }) {
  const { ruid } = await params;
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: [...queryKeys.playersBans(ruid), { page: 1, pagingCount: 10 }],
    queryFn: () => getServerPlayersBans(ruid, { page: 1, pagingCount: 10 }),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BansList ruid={ruid} />
    </HydrationBoundary>
  );
}
