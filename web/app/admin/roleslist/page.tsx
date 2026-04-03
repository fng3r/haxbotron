import { connection } from 'next/server';

import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';

import RolesList from '@/components/Admin/RolesList';

import { queryKeys } from '@/lib/queries/roles';
import { getServerPlayersRoleEvents, getServerPlayersRoles } from '@/lib/server/control-plane';

export default async function RolesListPage() {
  await connection();

  const queryClient = new QueryClient();
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: [...queryKeys.roles, { page: 1, pagingCount: 10, searchQuery: '' }],
      queryFn: () => getServerPlayersRoles({ page: 1, pagingCount: 10 }),
    }),
    queryClient.prefetchQuery({
      queryKey: [...queryKeys.rolesEvents, { page: 1, pagingCount: 10, searchQuery: '' }],
      queryFn: () => getServerPlayersRoleEvents({ page: 1, pagingCount: 10 }),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <RolesList />
    </HydrationBoundary>
  );
}
