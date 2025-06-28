'use client';

import { useParams, useRouter } from 'next/navigation';

import SnackBarNotification from '@/components/Notifications/SnackBarNotification';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { mutations } from '@/lib/queries/room';

export default function RoomPower() {
  const { ruid } = useParams<{ ruid: string }>();
  const router = useRouter();

  const shutdownRoomMutation = mutations.shutdownRoom();

  const handleShutdownClick = async () => {
    shutdownRoomMutation.mutate(ruid, {
      onSuccess: () => {
        SnackBarNotification.success('Shutdown succeeded.');
        router.push('/admin/roomlist');
      },
      onError: (error) => {
        SnackBarNotification.error(error.message);
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{ruid}</CardTitle>
      </CardHeader>
      <CardContent>
        <Button type="button" variant="destructive" className="w-full" onClick={handleShutdownClick}>
          Shutdown this room right now
        </Button>
      </CardContent>
    </Card>
  );
}
