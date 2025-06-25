import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';

import RoomSocial from '@/components/Admin/RoomSocial';

import { getRoomDiscordWebhookConfig, getRoomNoticeMessage } from '@/lib/api/room';
import { queryKeys } from '@/lib/queries/room';

export default async function RoomSocialPage({ params }: { params: Promise<{ ruid: string }> }) {
  const { ruid } = await params;
  const queryClient = new QueryClient();

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.roomNoticeMessage(ruid),
      queryFn: () => getRoomNoticeMessage(ruid),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.roomDiscordWebhookConfig(ruid),
      queryFn: () => getRoomDiscordWebhookConfig(ruid),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <RoomSocial ruid={ruid} />
    </HydrationBoundary>
  );
}
