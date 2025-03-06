'use client';

import React, { useEffect, useState } from 'react';

import { useParams } from 'next/navigation';

import { Button, Container, Divider, Grid2 as Grid, Paper, TextField, Typography } from '@mui/material';

import SnackBarNotification from '@/components/Notifications/SnackBarNotification';
import WidgetTitle from '@/components/common/WidgetTitle';

import client from '@/lib/client';

export default function RoomTextFilter() {
  const { ruid } = useParams();

  const [nicknameFilteringPool, setNicknameFilteringPool] = useState('');
  const [chatFilteringPool, setChatFilteringPool] = useState('');

  const onChangeNicknameFilteringPool = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNicknameFilteringPool(e.target.value);
  };

  const onChangeChatFilteringPool = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChatFilteringPool(e.target.value);
  };

  const handleNicknameFilteringPoolClear = async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();
    clearFilteringPool('nickname');
    setNicknameFilteringPool('');
  };

  const handleChatFilteringPoolClear = async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();
    clearFilteringPool('chat');
    setChatFilteringPool('');
  };

  const clearFilteringPool = async (endpoint: string) => {
    try {
      const result = await client.delete(`/api/v1/room/${ruid}/filter/${endpoint}`);
      if (result.status === 204) {
        SnackBarNotification.success('Successfully cleared filtering pool.');
      }
    } catch (error: any) {
      SnackBarNotification.error('Failed to clear filtering pool.');
    }
  };

  const handleNicknameFilteringPoolSet = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFilteringPool('nickname', nicknameFilteringPool);
  };

  const handleChatFilteringPoolSet = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFilteringPool('chat', chatFilteringPool);
  };

  const setFilteringPool = async (endpoint: string, pool: string) => {
    localStorage.setItem(`_${endpoint}FilteringPool`, pool);
    try {
      const result = await client.post(`/api/v1/room/${ruid}/filter/${endpoint}`, { pool: pool });
      if (result.status === 201) {
        SnackBarNotification.success('Successfully set new filtering pool.');
      }
    } catch (error: any) {
      let errorMessage = '';
      switch (error.response.status) {
        case 400: {
          errorMessage = 'No words in text pool.';
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

  const getNicknameFilteringPool = async () => {
    getFilteringPool('nickname', setNicknameFilteringPool);
  };

  const getChatFilteringPool = async () => {
    getFilteringPool('chat', setChatFilteringPool);
  };

  const getFilteringPool = async (endpoint: string, setterFunction: (textPool: string) => void) => {
    try {
      const result = await client.get(`/api/v1/room/${ruid}/filter/${endpoint}`);
      if (result.status === 200) {
        const textPool: string = result.data.pool;
        setterFunction(textPool);
      }
    } catch (error: any) {
      if (error.response.status === 404) {
        SnackBarNotification.error('Failed to load filtering pool.');
        setNicknameFilteringPool('');
      } else {
        SnackBarNotification.error('Unexpected error occurred. Please try again.');
      }
    }
  };

  const handleNicknameFilteringPoolLoad = async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();

    setNicknameFilteringPool(localStorage.getItem('_nicknameFilteringPool') || '');
  };

  const handleChatFilteringPoolLoad = async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();

    setChatFilteringPool(localStorage.getItem('_chatFilteringPool') || '');
  };

  useEffect(() => {
    getNicknameFilteringPool();
    getChatFilteringPool();
  }, []);

  return (
    <Container maxWidth="lg" className="py-8">
      <Grid container spacing={3}>
        <Grid size={12}>
          <Paper className="p-4">
            <React.Fragment>
              <WidgetTitle>Nickname Filtering Pool</WidgetTitle>
              <Typography variant="body1">Seperate by |,| and click Apply button.</Typography>
              <form className="mt-2 mb-2 w-full" onSubmit={handleNicknameFilteringPoolSet} method="post">
                <TextField
                  fullWidth
                  variant="outlined"
                  margin="normal"
                  multiline
                  required
                  value={nicknameFilteringPool}
                  onChange={onChangeNicknameFilteringPool}
                  id="nicknameFilteringPoolField"
                  name="nicknameFilteringPoolField"
                  label="Seperate by |,|"
                />
                <Button size="small" type="submit" variant="contained" color="primary" className="mr-1!">
                  Apply
                </Button>
                <Button
                  size="small"
                  type="button"
                  variant="contained"
                  color="secondary"
                  className="mr-1!"
                  onClick={handleNicknameFilteringPoolClear}
                >
                  Clear
                </Button>
                <Button
                  size="small"
                  type="button"
                  variant="outlined"
                  color="inherit"
                  onClick={handleNicknameFilteringPoolLoad}
                >
                  Load
                </Button>
              </form>
              <Divider />

              <WidgetTitle>Chat Filtering Pool</WidgetTitle>
              <Typography variant="body1">Seperate by |,| and click Apply button.</Typography>
              <form className="mt-2 w-full" onSubmit={handleChatFilteringPoolSet} method="post">
                <TextField
                  fullWidth
                  variant="outlined"
                  margin="normal"
                  multiline
                  required
                  value={chatFilteringPool}
                  onChange={onChangeChatFilteringPool}
                  id="chatFilteringPoolField"
                  name="chatFilteringPoolField"
                  label="Seperate by |,|"
                />
                <Button size="small" type="submit" variant="contained" color="primary" className="mr-1!">
                  Apply
                </Button>
                <Button
                  size="small"
                  type="button"
                  variant="contained"
                  color="secondary"
                  className="mr-1!"
                  onClick={handleChatFilteringPoolClear}
                >
                  Clear
                </Button>
                <Button
                  size="small"
                  type="button"
                  variant="outlined"
                  color="inherit"
                  onClick={handleChatFilteringPoolLoad}
                >
                  Load
                </Button>
              </form>
            </React.Fragment>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
