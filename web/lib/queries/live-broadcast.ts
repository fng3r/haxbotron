import { useMutation, useQueryClient } from '@tanstack/react-query';

import { setLiveBroadcast } from '@/lib/api/room';
import { queryKeys } from '@/lib/queries/room';
import type { RoomInfo } from '@/lib/types/room';

export function useSetLiveBroadcast() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setLiveBroadcast,
    onSuccess: ({ enabled }, { ruid }) => {
      queryClient.setQueryData<RoomInfo>(queryKeys.room(ruid), (info) =>
        info
          ? {
              ...info,
              botSettings: { ...info.botSettings, liveBroadcast: enabled },
            }
          : info,
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.roomConfigs });
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms });
    },
  });
}
