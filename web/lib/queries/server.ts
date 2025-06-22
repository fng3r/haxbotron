import client from '../client';
import { useQuery } from '@tanstack/react-query';

const queryKeys = {
  info: ['server', 'info'],
};

const queries = {
  getInfo: () =>
    useQuery({
      queryKey: queryKeys.info,
      queryFn: async () => {
        try {
          const result = await client.get('/api/v1/system');
          return result.data;
        } catch (e: any) {
          throw new Error('Failed to load server info.');
        }
      },
    }),
};

export { queryKeys, queries };
