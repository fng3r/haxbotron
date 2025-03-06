'use client';

import React, { useContext, useEffect, useState } from 'react';

import { useParams } from 'next/navigation';

import { Alert, Button, Container, Divider, Grid2 as Grid, Paper, TextField } from '@mui/material';

import SnackBarNotification from '@/components/Notifications/SnackBarNotification';
import WidgetTitle from '@/components/common/WidgetTitle';

import {
  BrowserHostRoomConfig,
  BrowserHostRoomGameRule,
  BrowserHostRoomSettings,
} from '@/../core/lib/browser.hostconfig';
import { WSocketContext } from '@/context/ws';
import client from '@/lib/client';

interface roomInfo {
  roomName: string;
  onlinePlayers: number;
  _link: string;
  _roomConfig: BrowserHostRoomConfig;
  _settings: BrowserHostRoomSettings;
  _rules: BrowserHostRoomGameRule;
}

export default function RoomInfo() {
  const { ruid } = useParams();

  const ws = useContext(WSocketContext);

  const [roomInfoJSON, setRoomInfoJSON] = useState({} as roomInfo);
  const [roomInfoJSONText, setRoomInfoJSONText] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [plainPassword, setPlainPassword] = useState('');
  const [freezeStatus, setFreezeStatus] = useState(false);

  const getFreezeStatus = async () => {
    try {
      const result = await client.get(`/api/v1/room/${ruid}/info/freeze`);
      if (result.status === 200) {
        setFreezeStatus(result.data.freezed);
      }
    } catch (error: any) {
      if (error.response.status === 404) {
        SnackBarNotification.error('Failed to load status of chat.');
      } else {
        SnackBarNotification.error('Unexpected error is caused. Please try again.');
      }
    }
  };

  const getRoomInfo = async () => {
    try {
      const result = await client.get(`/api/v1/room/${ruid}/info`);
      if (result.status === 200) {
        setRoomInfoJSON(result.data);
        setPlainPassword(result.data._roomConfig.password || '');
        setAdminPassword(result.data.adminPassword);
      }
    } catch (error: any) {
      if (error.response.status === 404) {
        SnackBarNotification.error('Failed to load room info.');
      } else {
        SnackBarNotification.error('Unexpected error is caused. Please try again.');
      }
    }
  };

  const onChangePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlainPassword(e.target.value);
  };

  const handleSetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const result = await client.post(`/api/v1/room/${ruid}/info/password`, {
        password: plainPassword,
      });
      if (result.status === 201) {
        SnackBarNotification.success(`Successfully set password (pass: ${plainPassword}).`);
        setPlainPassword('');

        getRoomInfo();
      }
    } catch {
      SnackBarNotification.error(`Failed to set password.`);
    }
  };

  const handleFreezeChat = async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();
    try {
      if (freezeStatus) {
        const result = await client.delete(`/api/v1/room/${ruid}/info/freeze`);
        if (result.status === 204) {
          SnackBarNotification.success('Successfully unfreezed whole chat.');

          getFreezeStatus();
        }
      } else {
        const result = await client.post(`/api/v1/room/${ruid}/info/freeze`);
        if (result.status === 204) {
          SnackBarNotification.success('Successfully freezed whole chat.');

          getFreezeStatus();
        }
      }
    } catch {
      SnackBarNotification.error('Failed to freeze whole chat.');
    }
  };

  const handleClearPassword = async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();
    try {
      const result = await client.delete(`/api/v1/room/${ruid}/info/password`);
      if (result.status === 204) {
        SnackBarNotification.success('Successfully cleared password.');
        setPlainPassword('');

        getRoomInfo();
      }
    } catch {
      SnackBarNotification.error('Failed to clear password.');
    }
  };

  useEffect(() => {
    getRoomInfo();
    getFreezeStatus();
  }, []);

  useEffect(() => {
    try {
      setRoomInfoJSONText(JSON.stringify(roomInfoJSON, null, 4));
    } catch {
      SnackBarNotification.error('Failed to load room info JSON.');
    }
  }, [roomInfoJSON]);

  useEffect(() => {
    // websocket with socket.io
    ws.on('statuschange', (content: { ruid: string }) => {
      if (content.ruid === ruid) {
        getFreezeStatus();
      }
    });
    return () => {
      // before the component is destroyed
      // unbind all event handlers used in this component
    };
  }, [ws]);

  return (
    <Container maxWidth="lg" className="py-8">
      <Grid container spacing={3}>
        <Grid size={12}>
          <Paper className="p-4">
            <WidgetTitle>Room Information</WidgetTitle>

            <Grid container spacing={2}>
              <Grid size={12}>
                <Button
                  size="small"
                  type="button"
                  variant="contained"
                  color="inherit"
                  className="mt-1!"
                  onClick={handleFreezeChat}
                >
                  {freezeStatus ? 'Unfreeze Chat' : 'Freeze Chat'}
                </Button>

                <form className="mt-6 w-full" onSubmit={handleSetPassword} method="post">
                  <Grid container spacing={0} alignItems="center">
                    <TextField
                      variant="outlined"
                      margin="normal"
                      required
                      size="small"
                      value={plainPassword}
                      onChange={onChangePassword}
                      id="password"
                      label="Password"
                      name="password"
                    />
                    <Grid size={3} alignContent="center">
                      <Button size="small" type="submit" variant="contained" className="mt-4!" color="primary">
                        Set
                      </Button>
                      <Button
                        size="small"
                        type="button"
                        variant="contained"
                        className="mt-4!"
                        color="secondary"
                        onClick={handleClearPassword}
                      >
                        Clear
                      </Button>
                    </Grid>
                  </Grid>
                </form>

                <TextField
                  variant="outlined"
                  margin="normal"
                  required
                  size="small"
                  value={adminPassword}
                  id="admin-password"
                  label="Admin password"
                  name="admin-password"
                  InputProps={{ readOnly: true }}
                />
              </Grid>
            </Grid>
            <Divider />

            <Grid container spacing={2}>
              <Grid size={12}>
                <TextField
                  fullWidth
                  variant="outlined"
                  margin="normal"
                  multiline
                  value={roomInfoJSONText}
                  id="roomInfoJSONText"
                  name="roomInfoJSONText"
                  label="JSON Data"
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
