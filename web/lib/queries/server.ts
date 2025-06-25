import { useQuery } from '@tanstack/react-query';

import { getServerInfo } from '@/lib/api/server';

const queryKeys = {
  info: ['server', 'info'],
};

const queries = {
  getInfo: () =>
    useQuery({
      queryKey: queryKeys.info,
      queryFn: getServerInfo,
    }),
};

export { queries, queryKeys };
