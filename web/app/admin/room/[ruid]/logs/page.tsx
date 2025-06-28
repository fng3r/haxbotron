'use client';

import React, { useEffect, useState } from 'react';

import { useParams } from 'next/navigation';

import { Bell } from 'lucide-react';

import SnackBarNotification from '@/components/Notifications/SnackBarNotification';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useWSocket } from '@/context/ws';
import { mutations } from '@/lib/queries/room';

interface LogMessage {
  id: string;
  ruid: string;
  origin: string;
  type: string;
  message: string;
  timestamp: number;
}

export default function RoomLogs() {
  const ws = useWSocket();
  const { ruid } = useParams<{ ruid: string }>();

  const [logMessages, setLogMessages] = useState<LogMessage[]>([]);

  const [broadcastMessage, setBroadcastMessage] = useState('');

  const sendBroadcastMessageMutation = mutations.sendBroadcastMessage();

  const handleBroadcast = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    sendBroadcastMessageMutation.mutate(
      { ruid, message: broadcastMessage },
      {
        onSuccess: () => {
          SnackBarNotification.success('Successfully sent broadcast message.');
          setBroadcastMessage('');
        },
        onError: (error) => {
          SnackBarNotification.error(error.message);
        },
      },
    );
  };

  const onChangeBroadcastMessage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBroadcastMessage(e.target.value);
  };

  useEffect(() => {
    const updateMessages = (content: LogMessage) => {
      if (content.ruid === ruid) {
        setLogMessages((prev: LogMessage[]) => {
          if (prev.some((msg) => msg.id === content.id)) return prev;
          return [...prev, content];
        });
      }
    };

    ws.on('log', updateMessages);

    return () => {
      ws.off('log', updateMessages);
    };
  }, [ws, ruid]);

  return (
    <div className="flex flex-col gap-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Broadcast</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex gap-2 w-full" onSubmit={handleBroadcast} method="post">
            <div className="flex flex-col gap-2">
              <Label htmlFor="broadcast">Message</Label>
              <Input
                required
                id="broadcast"
                name="broadcast"
                value={broadcastMessage}
                onChange={onChangeBroadcastMessage}
                autoFocus
                className="w-lg"
              />
            </div>
            <div className="flex gap-2 items-end">
              <Button type="submit" variant="default">
                Send
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Log Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-2 max-h-[400px] overflow-auto">
            {logMessages.map((message: LogMessage) => (
              <li key={message.id} className="flex items-center gap-2 text-sm">
                <Bell className="size-4 shrink-0 font-semibold" />
                <span>
                  [{message.origin}] {message.message}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
