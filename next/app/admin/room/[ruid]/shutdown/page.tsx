'use client';

import React, { useState } from 'react';

import { useParams, useRouter } from 'next/navigation';

import { Button, Container, Grid2 as Grid, Paper } from '@mui/material';

import Alert, { AlertColor } from '@/components/common/Alert';
import WidgetTitle from '@/components/common/WidgetTitle';

import client from '@/lib/client';

export default function RoomPower() {
  const { ruid } = useParams();
  const router = useRouter();
  const [flashMessage, setFlashMessage] = useState('');
  const [alertStatus, setAlertStatus] = useState('success' as AlertColor);

  const handleShutdownClick = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();

    try {
      const result = await client.delete('/api/v1/room/' + ruid);
      if (result.status === 204) {
        setFlashMessage('Shutdown succeeded.');
        setAlertStatus('success');
        router.push('/admin/roomlist');
      }
    } catch (e: any) {
      setAlertStatus('error');
      switch (e.response.status) {
        case 401: {
          setFlashMessage('No permission.');
          break;
        }
        case 404: {
          setFlashMessage('No exists room.');
          break;
        }
        default: {
          setFlashMessage('Unexpected error is caused. Please try again.');
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
              {flashMessage && <Alert severity={alertStatus}>{flashMessage}</Alert>}
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
