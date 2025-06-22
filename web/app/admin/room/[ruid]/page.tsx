'use client';

import React, { useEffect, useState } from 'react';

import { useParams } from 'next/navigation';

import { Alert, AlertTitle, Button, Container, Divider, Grid2 as Grid, Paper, TextField } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';

import SnackBarNotification from '@/components/Notifications/SnackBarNotification';
import WidgetTitle from '@/components/common/WidgetTitle';

import client from '@/lib/client';
import { queries, queryKeys } from '@/lib/queries/room';

export default function RoomInfo() {
  const { ruid } = useParams<{ ruid: string }>();

  const [roomInfoJSONText, setRoomInfoJSONText] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [plainPassword, setPlainPassword] = useState('');

  const queryClient = useQueryClient();
  const { data: roomInfo, error: roomInfoError } = queries.getRoomInfo(ruid);
  if (roomInfoError) {
    SnackBarNotification.error(roomInfoError.message);
  }

  const { data: freezeStatus, error: freezeStatusError } = queries.getRoomFreezeStatus(ruid);
  if (freezeStatusError) {
    SnackBarNotification.error(freezeStatusError.message);
  }

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
      }
    } catch {
      SnackBarNotification.error(`Failed to set password.`);
    }
  };

  const handleClearPassword = async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();
    try {
      const result = await client.delete(`/api/v1/room/${ruid}/info/password`);
      if (result.status === 204) {
        SnackBarNotification.success('Successfully cleared password.');
        setPlainPassword('');
      }
    } catch {
      SnackBarNotification.error('Failed to clear password.');
    }
  };

  const handleFreezeChat = async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();
    try {
      if (freezeStatus) {
        const result = await client.delete(`/api/v1/room/${ruid}/info/freeze`);
        if (result.status === 204) {
          SnackBarNotification.success('Successfully unfreezed whole chat.');

          queryClient.invalidateQueries({ queryKey: queryKeys.roomFreezeStatus(ruid) });
        }
      } else {
        const result = await client.post(`/api/v1/room/${ruid}/info/freeze`);
        if (result.status === 204) {
          SnackBarNotification.success('Successfully freezed whole chat.');

          queryClient.invalidateQueries({ queryKey: queryKeys.roomFreezeStatus(ruid) });
        }
      }
    } catch {
      SnackBarNotification.error('Failed to freeze whole chat.');
    }
  };

  useEffect(() => {
    if (roomInfo?.isOnline) {
      setRoomInfoJSONText(JSON.stringify(roomInfo, null, 4));
      setPlainPassword(roomInfo?._roomConfig.password || '');
      setAdminPassword(roomInfo?.adminPassword || '');
    }
  }, [roomInfo]);

  return (
    <Container maxWidth="lg" className="py-8">
      <Grid container spacing={3}>
        <Grid size={12} rowSpacing={4}>
          <Paper className="p-4">
            {roomInfo?.isOnline == false && (
              <Alert severity="error" className="mb-2">
                Room is offline
              </Alert>
            )}

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
