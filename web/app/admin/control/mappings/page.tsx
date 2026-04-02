import ControlMappings from '@/components/Admin/ControlMappings';
import ControlPlaneAutoRefresh from '@/components/Admin/ControlPlaneAutoRefresh';

import { getServerControlHosts, getServerControlMappings } from '@/lib/server/control-plane';

export const dynamic = 'force-dynamic';

export default async function ControlMappingsPage() {
  const [hosts, mappings] = await Promise.all([getServerControlHosts(), getServerControlMappings()]);

  return (
    <>
      <ControlPlaneAutoRefresh />
      <ControlMappings hosts={hosts} mappings={mappings} />
    </>
  );
}
