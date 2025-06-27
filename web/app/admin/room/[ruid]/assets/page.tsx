import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';

import RoomTeamColours from '@/components/Admin/TeamColours';

import { getTeamColours } from '@/lib/api/room';
import { queryKeys } from '@/lib/queries/room';

export default async function RoomAssetsPage({ params }: { params: Promise<{ ruid: string }> }) {
  const { ruid } = await params;

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: queryKeys.roomTeamColours(ruid),
    queryFn: () => getTeamColours(ruid),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <RoomTeamColours ruid={ruid} />
    </HydrationBoundary>
  );
}
