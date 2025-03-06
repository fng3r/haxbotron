'use client';

import React from 'react';

import { useParams, useRouter } from 'next/navigation';

import { Button, Container, Grid2 as Grid, Paper } from '@mui/material';

import SnackBarNotification from '@/components/Notifications/SnackBarNotification';
import WidgetTitle from '@/components/common/WidgetTitle';

import client from '@/lib/client';

export default function RoomPower() {
  const { ruid } = useParams();
  const router = useRouter();

  const handleShutdownClick = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();

    try {
      const result = await client.delete('/api/v1/room/' + ruid);
      if (result.status === 204) {
        SnackBarNotification.success('Shutdown succeeded.');
        router.push('/admin/roomlist');
      }
    } catch (e: any) {
      switch (e.response.status) {
        case 401: {
          SnackBarNotification.error('No permission.');
          break;
        }
        case 404: {
          SnackBarNotification.error('Room does not exist.');
          break;
        }
        default: {
          SnackBarNotification.error('Unexpected error occurred. Please try again.');
          break;
        }
      }
    }
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
