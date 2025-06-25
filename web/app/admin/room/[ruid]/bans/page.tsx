import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';

import BansList from '@/components/Admin/BansList';

import { getPlayersBans } from '@/lib/api/player';
import { queryKeys } from '@/lib/queries/player';

export default async function BansListPage({ params }: { params: Promise<{ ruid: string }> }) {
  const { ruid } = await params;
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: [...queryKeys.playersBans(ruid), { page: 1, pagingCount: 10 }],
    queryFn: () => getPlayersBans(ruid, { page: 1, pagingCount: 10 }),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BansList ruid={ruid} />
    </HydrationBoundary>
  );
}
