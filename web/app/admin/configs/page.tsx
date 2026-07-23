import RoomConfigWorkspace from '@/components/Admin/RoomConfigWorkspace';
import { getServerRoomConfigs } from '@/lib/server/control-plane';

export const dynamic = 'force-dynamic';
export default async function RoomConfigsPage() {
  const configs = await getServerRoomConfigs();
  return <RoomConfigWorkspace manageOnly initialConfigs={configs} />;
}
