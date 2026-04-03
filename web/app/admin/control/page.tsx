import ControlOverview from '@/components/Admin/ControlOverview';
import ControlPlaneAutoRefresh from '@/components/Admin/ControlPlaneAutoRefresh';

import { getServerControlHosts, getServerControlSummary, getServerManagedRooms } from '@/lib/server/control-plane';

export const dynamic = 'force-dynamic';

export default async function ControlOverviewPage() {
  const [summary, hosts, rooms] = await Promise.all([
    getServerControlSummary(),
    getServerControlHosts(),
    getServerManagedRooms(),
  ]);

  return (
    <>
      <ControlPlaneAutoRefresh />
      <ControlOverview summary={summary} hosts={hosts} rooms={rooms} />
    </>
  );
}
