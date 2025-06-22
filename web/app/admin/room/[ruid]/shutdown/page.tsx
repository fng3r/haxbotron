'use client';

import React from 'react';

import { useParams, useRouter } from 'next/navigation';

import { Button, Container, Grid2 as Grid, Paper } from '@mui/material';

import SnackBarNotification from '@/components/Notifications/SnackBarNotification';
import WidgetTitle from '@/components/common/WidgetTitle';

import { mutations } from '@/lib/queries/room';

export default function RoomPower() {
  const { ruid } = useParams<{ ruid: string }>();
  const router = useRouter();

  const shutdownRoomMutation = mutations.shutdownRoom();

  const handleShutdownClick = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();

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
    <Container maxWidth="lg" className="py-8">
      <Grid container spacing={3}>
        <Grid size={12}>
          <Paper className="p-4">
            <React.Fragment>
              <WidgetTitle>{ruid}</WidgetTitle>
              <Button
                type="submit"
                variant="contained"
                color="error"
                className="mt-3!"
                onClick={handleShutdownClick}
                fullWidth
              >
                Shutdown this room right now
              </Button>
            </React.Fragment>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
