import RoomCreate from '@/components/Admin/RoomCreate';

import { getServerControlMappings } from '@/lib/server/control-plane';

export const dynamic = 'force-dynamic';

export default async function RoomCreatePage() {
  const mappings = await getServerControlMappings();

  return <RoomCreate mappings={mappings} />;
}
