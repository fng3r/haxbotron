'use client';

import React, { useContext, useEffect, useState } from 'react';

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

import SnackBarNotification from '@/components/Notifications/SnackBarNotification';
import WidgetTitle from '@/components/common/WidgetTitle';

import { WSocketContext } from '@/context/ws';
import client from '@/lib/client';

interface LogMessage {
  ruid: string;
  origin: string;
  type: string;
  message: string;
}

export default function RoomLogs() {
  const ws = useContext(WSocketContext);
  const { ruid } = useParams();

  const [logMessage, setLogMessage] = useState([] as LogMessage[]);
  const [recentLogMessage, setRecentLogMessage] = useState({} as LogMessage);

  const [broadcastMessage, setBroadcastMessage] = useState('');

  const handleBroadcast = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const result = await client.post(`/api/v1/room/${ruid}/chat`, { message: broadcastMessage });
      if (result.status === 201) {
        SnackBarNotification.success('Successfully sent broadcast message.');
        setBroadcastMessage('');
      }
    } catch (error: any) {
      let errorMessage = '';
      switch (error.response.status) {
        case 400: {
          errorMessage = 'No message.';
          break;
        }
        case 401: {
          errorMessage = 'Insufficient permissions.';
          break;
        }
        case 404: {
          errorMessage = 'Room does not exist.';
          break;
        }
        default: {
          errorMessage = 'Unexpected error occurred. Please try again.';
          break;
        }
      }
      SnackBarNotification.error(errorMessage);
    }
  };

  const onChangeBroadcastMessage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBroadcastMessage(e.target.value);
  };

  useEffect(() => {
    ws.on('log', (content: LogMessage) => {
      if (content.ruid === ruid) {
        setRecentLogMessage(content);
      }
    });
  }, []);

  useEffect(() => {
    if (Object.keys(recentLogMessage).length > 0) {
      setLogMessage(logMessage.concat(recentLogMessage));
    }
    setRecentLogMessage({} as LogMessage);
  }, [recentLogMessage.message]);

  return (
    <Container maxWidth="lg" className="py-8">
      <Grid container spacing={3}>
        <Grid size={12}>
          <Paper className="overflow-auto p-4">
            <React.Fragment>
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
            </React.Fragment>
            <Divider />

            <React.Fragment>
              <WidgetTitle>Log Messages</WidgetTitle>
              <List>
                {logMessage.map((message, idx) => (
                  <ListItem key={idx}>
                    <ListItemIcon sx={{ minWidth: '30px' }}>
                      <CircleNotificationsTwoTone />
                    </ListItemIcon>
                    [{message.origin}] {message.message}
                  </ListItem>
                ))}
              </List>
            </React.Fragment>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
