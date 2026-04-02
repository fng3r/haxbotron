import ControlHosts from '@/components/Admin/ControlHosts';
import ControlPlaneAutoRefresh from '@/components/Admin/ControlPlaneAutoRefresh';

import { getServerControlHosts } from '@/lib/server/control-plane';

export default async function ControlHostsPage() {
  const hosts = await getServerControlHosts();

  return (
    <>
      <ControlPlaneAutoRefresh />
      <ControlHosts hosts={hosts} />
    </>
  );
}
