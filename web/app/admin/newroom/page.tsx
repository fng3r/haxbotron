import 'flag-icons/css/flag-icons.min.css';

import RoomConfigWorkspace from '@/components/Admin/RoomConfigWorkspace';

import { getServerControlMappings, getServerRoomConfigs } from '@/lib/server/control-plane';

export const dynamic = 'force-dynamic';

export default async function RoomCreatePage() {
  const [mappings, configs] = await Promise.all([getServerControlMappings(), getServerRoomConfigs()]);

  return <RoomConfigWorkspace mappings={mappings} initialConfigs={configs} />;
}
