'use client';

import React, { useState } from 'react';

import { Alert, Button, Container, Divider, Grid2 as Grid, Paper, TextField } from '@mui/material';

import SnackBarNotification from '@/components/Notifications/SnackBarNotification';
import WidgetTitle from '@/components/common/WidgetTitle';

import { mutations, queries } from '@/lib/queries/room';

export default function RoomInfo({ ruid }: { ruid: string }) {
  const { data: roomInfo, error: roomInfoError } = queries.getRoomInfo(ruid);
  const roomInfoJSON = JSON.stringify(roomInfo, null, 4);

  const [password, setPassword] = useState(roomInfo?._roomConfig?.password ?? '');

  if (roomInfoError) {
    SnackBarNotification.error(roomInfoError.message);
  }

  const { data: freezeStatus, error: freezeStatusError } = queries.getRoomFreezeStatus(ruid);

  // Mutations
  const setPasswordMutation = mutations.setPassword();
  const clearPasswordMutation = mutations.clearPassword();
  const toggleFreezeMutation = mutations.toggleFreeze();

  const onChangePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleSetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setPasswordMutation.mutateAsync(
      { ruid, password },
      {
        onSuccess: () => {
          SnackBarNotification.success(`Successfully set password (pass: ${password}).`);
        },
        onError: (error: any) => {
          SnackBarNotification.error(error.message);
        },
      },
    );
  };

  const handleClearPassword = async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();

    clearPasswordMutation.mutateAsync(
      { ruid },
      {
        onSuccess: () => {
          SnackBarNotification.success('Successfully cleared password.');
          setPassword('');
        },
        onError: (error: any) => {
          SnackBarNotification.error(error.message);
        },
      },
    );
  };

  const handleFreezeChat = async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();

    toggleFreezeMutation.mutateAsync(
      { ruid, freezeStatus: freezeStatus! },
      {
        onSuccess: () => {
          SnackBarNotification.success(
            freezeStatus ? 'Successfully unfreezed whole chat.' : 'Successfully freezed whole chat.',
          );
        },
        onError: (error: any) => {
          SnackBarNotification.error(error.message);
        },
      },
    );
  };

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
                  disabled={freezeStatusError !== null}
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
                      value={password}
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
                  value={roomInfo?.adminPassword}
                  id="admin-password"
                  label="Admin password"
                  name="admin-password"
                  slotProps={{ input: { readOnly: true } }}
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
                  value={roomInfoJSON}
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
