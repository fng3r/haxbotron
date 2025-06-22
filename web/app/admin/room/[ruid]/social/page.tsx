'use client';

import React, { useEffect, useState } from 'react';

import { useParams } from 'next/navigation';

import { Backspace, LiveHelp } from '@mui/icons-material';
import {
  Button,
  Container,
  Divider,
  FormControlLabel,
  Grid2 as Grid,
  IconButton,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';

import SnackBarNotification from '@/components/Notifications/SnackBarNotification';
import Title from '@/components/common/WidgetTitle';

import { mutations, queries } from '@/lib/queries/room';

export default function RoomSocial() {
  const { ruid } = useParams<{ ruid: string }>();

  const [newNoticeMessage, setNewNoticeMessage] = useState('');

  const [newReplaysWebhookID, setNewReplaysWebhookID] = useState('');
  const [newReplaysWebhookToken, setNewReplaysWebhookToken] = useState('');
  const [newPasswordWebhookID, setNewPasswordWebhookID] = useState('');
  const [newPasswordWebhookToken, setNewPasswordWebhookToken] = useState('');
  const [newDiscordWebhookFeed, setNewDiscordWebhookFeed] = useState(false);
  const [newDiscordWebhookReplayUpload, setNewDiscordWebhookReplayUpload] = useState(false);

  const { data: noticeMessage } = queries.getRoomNoticeMessage(ruid);
  const { data: discordWebhookConfig } = queries.getRoomDiscordWebhookConfig(ruid);

  const setNoticeMessageMutation = mutations.setNoticeMessage();
  const deleteNoticeMessageMutation = mutations.deleteNoticeMessage();
  const setDiscordWebhookConfigMutation = mutations.setDiscordWebhookConfig();

  useEffect(() => {
    if (discordWebhookConfig) {
      setNewReplaysWebhookID(discordWebhookConfig.replaysWebhookId);
      setNewReplaysWebhookToken(discordWebhookConfig.replaysWebhookToken);
      setNewPasswordWebhookID(discordWebhookConfig.passwordWebhookId);
      setNewPasswordWebhookToken(discordWebhookConfig.passwordWebhookToken);
      setNewDiscordWebhookFeed(discordWebhookConfig.feed);
      setNewDiscordWebhookReplayUpload(discordWebhookConfig.replayUpload);
    }
  }, [discordWebhookConfig]);

  const handleNoticeSet = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNoticeMessageMutation.mutate(
      { ruid, message: newNoticeMessage },
      {
        onSuccess: () => {
          SnackBarNotification.success('Successfully set notice message.');
          setNewNoticeMessage('');
          localStorage.setItem(`_NoticeMessage`, newNoticeMessage);
        },
        onError: (error) => {
          SnackBarNotification.error(error.message);
        },
      },
    );
  };

  const handleDiscordWebhookSet = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const config = {
      feed: newDiscordWebhookFeed,
      replaysWebhookId: newReplaysWebhookID,
      replaysWebhookToken: newReplaysWebhookToken,
      passwordWebhookId: newPasswordWebhookID,
      passwordWebhookToken: newPasswordWebhookToken,
      replayUpload: newDiscordWebhookReplayUpload,
    };
    setDiscordWebhookConfigMutation.mutate(
      { ruid, config },
      {
        onSuccess: () => {
          SnackBarNotification.success('Discord Webhook configuration updated.');
          localStorage.setItem(
            `_DiscordWebhookConfig`,
            JSON.stringify({
              feed: newDiscordWebhookFeed,
              passwordWebhookId: newPasswordWebhookID,
              passwordWebhookToken: newPasswordWebhookToken,
              replaysWebhookId: newReplaysWebhookID,
              replaysWebhookToken: newReplaysWebhookToken,
              replayUpload: newDiscordWebhookReplayUpload,
            }),
          );
        },
        onError: (error) => {
          SnackBarNotification.error(error.message);
        },
      },
    );
  };

  const onChangeNoticeMessage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewNoticeMessage(e.target.value);
  };

  const onChangeReplaysWebhookID = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewReplaysWebhookID(e.target.value);
  };
  const onChangeReplaysWebhookToken = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewReplaysWebhookToken(e.target.value);
  };
  const onChangePasswordWebhookID = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPasswordWebhookID(e.target.value);
  };
  const onChangePasswordWebhookToken = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPasswordWebhookToken(e.target.value);
  };
  const onChangeDiscordWebhookFeed = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewDiscordWebhookFeed(e.target.checked); // switch toggle component
  };
  const onChangeDiscordWebhookReplayUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewDiscordWebhookReplayUpload(e.target.checked); // switch toggle component
  };

  const deleteNoticeMessage = async () => {
    deleteNoticeMessageMutation.mutate(
      { ruid },
      {
        onSuccess: () => {
          SnackBarNotification.success('Successfully deleted notice message.');
        },
        onError: (error) => {
          SnackBarNotification.error(error.message);
        },
      },
    );
  };

  const handleNoticeLoad = async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();

    if (localStorage.getItem(`_NoticeMessage`) !== null) {
      setNewNoticeMessage(localStorage.getItem(`_NoticeMessage`)!);
    }
  };

  const handleDiscordWebhookLoad = async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();

    if (localStorage.getItem(`_DiscordWebhookConfig`) !== null) {
      const config = JSON.parse(localStorage.getItem(`_DiscordWebhookConfig`)!);
      setNewReplaysWebhookID(config.replaysWebhookId);
      setNewReplaysWebhookToken(config.replaysWebhookToken);
      setNewPasswordWebhookID(config.passwordWebhookId);
      setNewPasswordWebhookToken(config.passwordWebhookToken);
      setNewDiscordWebhookFeed(config.feed);
      setNewDiscordWebhookReplayUpload(config.replayUpload);
    }
  };

  return (
    <Container maxWidth="lg" className="py-8">
      <Grid container spacing={3}>
        <Grid size={12}>
          <Paper className="p-4">
            <React.Fragment>
              <Title>Notice</Title>
              <form className="mt-2 w-full" onSubmit={handleNoticeSet} method="post">
                <Grid container spacing={1}>
                  <Grid size={{ xs: 12, sm: 8 }}>
                    <TextField
                      variant="outlined"
                      margin="normal"
                      required
                      size="small"
                      fullWidth
                      id="notice"
                      label="Notice Message"
                      name="notice"
                      value={newNoticeMessage}
                      onChange={onChangeNoticeMessage}
                    />
                  </Grid>
                  <Grid size={{ xs: 3, sm: 1 }}>
                    <Button fullWidth size="small" type="submit" variant="contained" color="primary" className="mt-5!">
                      Update
                    </Button>
                  </Grid>
                  <Grid size={{ xs: 3, sm: 1 }}>
                    <Button
                      fullWidth
                      size="small"
                      type="button"
                      variant="outlined"
                      color="inherit"
                      className="mt-5!"
                      onClick={handleNoticeLoad}
                    >
                      Load
                    </Button>
                  </Grid>
                </Grid>
              </form>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 12 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell className="font-bold!">Notice Message</TableCell>
                        <TableCell align="right" />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>{noticeMessage || 'There is no notice message'}</TableCell>
                        <TableCell align="right">
                          {noticeMessage && (
                            <IconButton
                              name="deleteNotice"
                              onClick={deleteNoticeMessage}
                              aria-label="delete"
                              className="mr-1!"
                            >
                              <Backspace fontSize="small" />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Grid>
              </Grid>
              <Divider className="mb-2!" />

              <Title>Discord Webhook</Title>
              <Grid container spacing={2}>
                <Grid size={12}>
                  <Typography component="h2" variant="subtitle2" color="inherit" gutterBottom>
                    {
                      "Create a webhook in the Discord application and submit your webhook's ID and Token. (e.g. https://discord.com/api/webhooks/id/token)"
                    }
                    <IconButton
                      onClick={() =>
                        window.open(
                          'https://github.com/dapucita/haxbotron/wiki/Discord-Webhook-Configuration',
                          '_blank',
                        )
                      }
                      edge="start"
                      size="medium"
                      aria-label="get help"
                      className="-ml-1!"
                    >
                      <LiveHelp />
                    </IconButton>
                  </Typography>
                </Grid>
              </Grid>
              <form className="mt-2 w-full" onSubmit={handleDiscordWebhookSet} method="post">
                <Grid container spacing={2}>
                  <Grid container spacing={2} size={12}>
                    <Grid size={1}>
                      <FormControlLabel
                        control={
                          <Switch
                            id="discordWebhookFeed"
                            name="discordWebhookFeed"
                            size="small"
                            checked={newDiscordWebhookFeed}
                            onChange={onChangeDiscordWebhookFeed}
                            color="primary"
                          />
                        }
                        label="Enable"
                        labelPlacement="top"
                      />
                    </Grid>
                    <Grid size={{ xs: 2, sm: 2 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            id="discordWebhookReplayUpload"
                            name="discordWebhookReplayUpload"
                            size="small"
                            checked={newDiscordWebhookReplayUpload}
                            onChange={onChangeDiscordWebhookReplayUpload}
                            color="primary"
                          />
                        }
                        label="Replay Upload"
                        labelPlacement="top"
                      />
                    </Grid>
                  </Grid>

                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField
                      variant="outlined"
                      margin="normal"
                      size="small"
                      fullWidth
                      id="discordReplaysWebhookID"
                      label="Replays Webhook ID"
                      name="discordReplaysWebhookID"
                      value={newReplaysWebhookID}
                      onChange={onChangeReplaysWebhookID}
                    />
                  </Grid>
                  <Grid size={8}>
                    <TextField
                      variant="outlined"
                      margin="normal"
                      size="small"
                      fullWidth
                      id="discordReplaysWebhookToken"
                      label="Replays Webhook Token"
                      name="discordReplaysWebhookToken"
                      value={newReplaysWebhookToken}
                      onChange={onChangeReplaysWebhookToken}
                    />
                  </Grid>

                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField
                      variant="outlined"
                      margin="normal"
                      size="small"
                      fullWidth
                      id="discordPasswordWebhookID"
                      label="Password Webhook ID"
                      name="discordPasswordWebhookID"
                      value={newPasswordWebhookID}
                      onChange={onChangePasswordWebhookID}
                    />
                  </Grid>
                  <Grid size={8}>
                    <TextField
                      variant="outlined"
                      margin="normal"
                      size="small"
                      fullWidth
                      id="discordPasswordWebhookToken"
                      label="Password Webhook Token"
                      name="discordPasswordWebhookToken"
                      value={newPasswordWebhookToken}
                      onChange={onChangePasswordWebhookToken}
                    />
                  </Grid>
                </Grid>

                <Grid container spacing={1} size={12}>
                  <Grid size={{ xs: 3, sm: 1 }}>
                    <Button fullWidth size="small" type="submit" variant="contained" color="primary" className="mt-1!">
                      Apply
                    </Button>
                  </Grid>
                  <Grid size={{ xs: 3, sm: 1 }}>
                    <Button
                      fullWidth
                      size="small"
                      type="button"
                      variant="outlined"
                      color="inherit"
                      className="mt-1!"
                      onClick={handleDiscordWebhookLoad}
                    >
                      Load
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </React.Fragment>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
