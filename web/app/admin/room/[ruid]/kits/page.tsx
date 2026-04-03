import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';

import TeamKits from '@/components/Admin/TeamKits';

import { queryKeys } from '@/lib/queries/room';
import { getServerTeamColours } from '@/lib/server/control-plane';

export default async function RoomKitsPage({ params }: { params: Promise<{ ruid: string }> }) {
  const { ruid } = await params;

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: queryKeys.roomTeamColours(ruid),
    queryFn: () => getServerTeamColours(ruid),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TeamKits ruid={ruid} />
    </HydrationBoundary>
  );
}
