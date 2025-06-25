'use client';

import React, { useEffect, useState } from 'react';

import { useParams } from 'next/navigation';

import { CircleNotificationsTwoTone } from '@mui/icons-material';
import {
  Button,
  Container,
  Divider,
  Grid2 as Grid,
  List,
  ListItem,
  ListItemIcon,
  Paper,
  TextField,
} from '@mui/material';
import { OrderedSet } from 'immutable';

import SnackBarNotification from '@/components/Notifications/SnackBarNotification';
import WidgetTitle from '@/components/common/WidgetTitle';

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

  const [logMessages, setLogMessages] = useState(OrderedSet.of<LogMessage>());

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
        setLogMessages((prev) => prev.add(content));
      }
    };

    ws.on('log', updateMessages);

    return () => {
      ws.off('log', updateMessages);
    };
  }, [ws, ruid]);

  return (
    <Container maxWidth="lg" className="py-8">
      <Grid container spacing={3}>
        <Grid size={12}>
          <Paper className="overflow-auto p-4">
            <>
              <WidgetTitle>Broadcast</WidgetTitle>
              <form className="mt-2 w-full" onSubmit={handleBroadcast} method="post">
                <TextField
                  variant="outlined"
                  margin="normal"
                  required
                  size="small"
                  id="broadcast"
                  label="Message"
                  name="broadcast"
                  value={broadcastMessage}
                  onChange={onChangeBroadcastMessage}
                  autoFocus
                  sx={{ width: '50%' }}
                />
                <Button size="small" type="submit" variant="contained" color="primary" className="mt-5! ml-1!">
                  Send
                </Button>
              </form>
            </>
            <Divider />

            <>
              <WidgetTitle>Log Messages</WidgetTitle>
              <List>
                {logMessages.map((message) => (
                  <ListItem key={message.id}>
                    <ListItemIcon sx={{ minWidth: '30px' }}>
                      <CircleNotificationsTwoTone />
                    </ListItemIcon>
                    [{message.origin}] {message.message}
                  </ListItem>
                ))}
              </List>
            </>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
