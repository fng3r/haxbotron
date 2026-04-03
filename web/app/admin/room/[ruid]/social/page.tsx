import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';

import RoomSocial from '@/components/Admin/RoomSocial';

import { queryKeys } from '@/lib/queries/room';
import { getServerRoomDiscordWebhookConfig, getServerRoomNoticeMessage } from '@/lib/server/control-plane';

export default async function RoomSocialPage({ params }: { params: Promise<{ ruid: string }> }) {
  const { ruid } = await params;
  const queryClient = new QueryClient();

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.roomNoticeMessage(ruid),
      queryFn: () => getServerRoomNoticeMessage(ruid),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.roomDiscordWebhookConfig(ruid),
      queryFn: () => getServerRoomDiscordWebhookConfig(ruid),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <RoomSocial ruid={ruid} />
    </HydrationBoundary>
  );
}
