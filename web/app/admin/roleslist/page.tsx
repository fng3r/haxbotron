import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';

import RolesList from '@/components/Admin/RolesList';

import { getPlayersRoleEvents, getPlayersRoles } from '@/lib/api/roles';
import { queryKeys } from '@/lib/queries/roles';

export default async function RolesListPage() {
  const queryClient = new QueryClient();
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: [...queryKeys.roles, { page: 1, pagingCount: 10, searchQuery: '' }],
      queryFn: () => getPlayersRoles({ page: 1, pagingCount: 10 }),
    }),
    queryClient.prefetchQuery({
      queryKey: [...queryKeys.rolesEvents, { page: 1, pagingCount: 10, searchQuery: '' }],
      queryFn: () => getPlayersRoleEvents({ page: 1, pagingCount: 10 }),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <RolesList />
    </HydrationBoundary>
  );
}
