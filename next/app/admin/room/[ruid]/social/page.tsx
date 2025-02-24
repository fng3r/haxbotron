'use client';

import React, { useEffect, useState } from 'react';
import { 
  Container, Grid2 as Grid, Paper, Button, Divider, 
  FormControlLabel, IconButton, Switch, Table, 
  TableBody, TableCell, TableHead, TableRow, 
  TextField, Typography
} from '@mui/material';
import Title from '@/components/Admin/WidgetTitle';
import { useParams } from 'next/navigation';
import client from '@/lib/client';
import Alert, { AlertColor } from '@/components/common/Alert';
import { Backspace, LiveHelp } from '@mui/icons-material';


type DiscordWebhookConfig = {
    feed: boolean
    passwordWebhookId: string
    passwordWebhookToken: string
    replaysWebhookId: string
    replaysWebhookToken: string
    replayUpload: boolean
}

export default function RoomSocial() {
    const { ruid } = useParams();

    const [newNoticeMessage, setNewNoticeMessage] = useState('');
    const [noticeMessage, setNoticeMessage] = useState('');

    const [newReplaysWebhookID, setNewReplaysWebhookID] = useState('');
    const [newReplaysWebhookToken, setNewReplaysWebhookToken] = useState('');
    const [newPasswordWebhookID, setNewPasswordWebhookID] = useState('');
    const [newPasswordWebhookToken, setNewPasswordWebhookToken] = useState('');
    const [newDiscordWebhookFeed, setNewDiscordWebhookFeed] = useState(false);
    const [newDiscordWebhookReplayUpload, setNewDiscordWebhookReplayUpload] = useState(false);

    const [flashMessage, setFlashMessage] = useState('');
    const [alertStatus, setAlertStatus] = useState("success" as AlertColor);

    const handleNoticeSet = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        localStorage.setItem(`_NoticeMessage`, newNoticeMessage);
        try {
            const result = await client.post(`/api/v1/room/${ruid}/social/notice`, { message: newNoticeMessage });
            if (result.status === 201) {
                setFlashMessage('Successfully set.');
                setAlertStatus('success');
                setNewNoticeMessage('');
                getNoticeMessage();
                setTimeout(() => {
                    setFlashMessage('');
                }, 3000);
            }
        } catch (error: any) {
            setAlertStatus('error');
            switch (error.response.status) {
                case 400: {
                    setFlashMessage('No message.');
                    break;
                }
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
            setTimeout(() => {
                setFlashMessage('');
            }, 3000);
        }
    }

    const handleDiscordWebhookSet = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        localStorage.setItem(`_DiscordWebhookConfig`, JSON.stringify({
            feed: newDiscordWebhookFeed, passwordWebhookId: newPasswordWebhookID, passwordWebhookToken: newPasswordWebhookToken, replaysWebhookId: newReplaysWebhookID, replaysWebhookToken: newReplaysWebhookToken, replayUpload: newDiscordWebhookReplayUpload
        } as DiscordWebhookConfig));
        try {
            const result = await client.post(`/api/v1/room/${ruid}/social/discord/webhook`, {
                feed: newDiscordWebhookFeed,
                replaysWebhookId: newReplaysWebhookID,
                replaysWebhookToken: newReplaysWebhookToken,
                passwordWebhookId: newPasswordWebhookID,
                passwordWebhookToken: newPasswordWebhookToken,
                replayUpload: newDiscordWebhookReplayUpload
            });
            if (result.status === 201) {
                setFlashMessage('Discord Webhook is configured.');
                setAlertStatus('success');
                getDiscordWebhookConfig();
                setTimeout(() => {
                    setFlashMessage('');
                }, 3000);
            }
        } catch (error: any) {
            setAlertStatus('error');
            switch (error.response.status) {
                case 400: {
                    setFlashMessage('Request body for Discord webhook is unfulfilled.');
                    break;
                }
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
            setTimeout(() => {
                setFlashMessage('');
            }, 3000);
        }
    }

    const onChangeNoticeMessage = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewNoticeMessage(e.target.value);
    }

    const onChangeReplaysWebhookID = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewReplaysWebhookID(e.target.value);
    }
    const onChangeReplaysWebhookToken = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewReplaysWebhookToken(e.target.value);
    }
    const onChangePasswordWebhookID = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewPasswordWebhookID(e.target.value);
    }
    const onChangePasswordWebhookToken = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewPasswordWebhookToken(e.target.value);
    }
    const onChangeDiscordWebhookFeed = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewDiscordWebhookFeed(e.target.checked); // switch toggle component
    }
    const onChangeDiscordWebhookReplayUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewDiscordWebhookReplayUpload(e.target.checked); // switch toggle component
    }

    const getNoticeMessage = async () => {
        try {
            const result = await client.get(`/api/v1/room/${ruid}/social/notice`);
            if (result.status === 200) {
                const noticeMessage: string = result.data.message;
                setNoticeMessage(noticeMessage);
            }
        } catch (error: any) {
            setAlertStatus('error');
            if (error.response.status === 404) {
                setFlashMessage('Failed to load notice message.');
                setNoticeMessage('');
            } else {
                setFlashMessage('Unexpected error is caused. Please try again.');
            }
        }
    }
    const getDiscordWebhookConfig = async () => {
        try {
            const result = await client.get(`/api/v1/room/${ruid}/social/discord/webhook`);
            if (result.status === 200) {
                const config: DiscordWebhookConfig = result.data;
                setNewReplaysWebhookID(config.replaysWebhookId);
                setNewReplaysWebhookToken(config.replaysWebhookToken);
                setNewPasswordWebhookID(config.passwordWebhookId);
                setNewPasswordWebhookToken(config.passwordWebhookToken);
                setNewDiscordWebhookFeed(config.feed);
                setNewDiscordWebhookReplayUpload(config.replayUpload);
            }
        } catch (error: any) {
            setAlertStatus('error');
            if (error.response.status === 404) {
                setFlashMessage('Failed to load Discord webhook configuration.');
                setNoticeMessage('');
            } else {
                setFlashMessage('Unexpected error is caused. Please try again.');
            }
        }
    }

    const deleteNoticeMessage = async () => {
        try {
            const result = await client.delete(`/api/v1/room/${ruid}/social/notice`);
            if (result.status === 204) {
                setAlertStatus('success');
                setFlashMessage('Successfully delete notice.');
                getNoticeMessage();
            }
        } catch (error: any) {
            setAlertStatus('error');
            if (error.response.status === 404) {
                setFlashMessage('Failed to access notice message.');
            } else {
                setFlashMessage('Unexpected error is caused. Please try again.');
            }
        }
    }

    const handleNoticeLoad = async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        event.preventDefault();

        if (localStorage.getItem(`_NoticeMessage`) !== null) {
            setNewNoticeMessage(localStorage.getItem(`_NoticeMessage`)!);
        }
    }

    const handleDiscordWebhookLoad = async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        event.preventDefault();

        if (localStorage.getItem(`_DiscordWebhookConfig`) !== null) {
            const config: DiscordWebhookConfig = JSON.parse(localStorage.getItem(`_DiscordWebhookConfig`)!);
            setNewReplaysWebhookID(config.replaysWebhookId);
            setNewReplaysWebhookToken(config.replaysWebhookToken);
            setNewPasswordWebhookID(config.passwordWebhookId);
            setNewPasswordWebhookToken(config.passwordWebhookToken);
            setNewDiscordWebhookFeed(config.feed);
            setNewDiscordWebhookReplayUpload(config.replayUpload);
        }
    }

    useEffect(() => {
        getNoticeMessage();
        getDiscordWebhookConfig();
    }, []);

    return (
        <Container maxWidth="lg" className="py-8">
            <Grid container spacing={3}>
                <Grid size={12}>
                    <Paper className="p-4">
                        <React.Fragment>
                            {flashMessage && <Alert severity={alertStatus}>{flashMessage}</Alert>}

                            <Title>Notice</Title>
                            <form className="w-full mt-2" onSubmit={handleNoticeSet} method="post">
                                <Grid container spacing={1}>
                                    <Grid size={{xs: 12, sm: 8}}>
                                        <TextField
                                            variant="outlined" margin="normal" required size="small" fullWidth
                                            id="notice" label="Notice Message" name="notice"
                                            value={newNoticeMessage} onChange={onChangeNoticeMessage}
                                        />
                                    </Grid>
                                    <Grid size={{xs: 3, sm: 1}}>
                                        <Button fullWidth size="small" type="submit" variant="contained" color="primary" className="mt-5!">Publish</Button>
                                    </Grid>
                                    <Grid size={{xs: 3, sm: 1}}>
                                        <Button fullWidth size="small" type="button" variant="outlined" color="inherit" className="mt-5!" onClick={handleNoticeLoad}>Load</Button>
                                    </Grid>
                                </Grid>
                            </form>
                            <Grid container spacing={2}>
                                <Grid size={{xs: 12, sm: 12}}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell className="font-bold!">Notice Message</TableCell>
                                                <TableCell align="right" />
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell>{noticeMessage ?? 'There is no notice message'}</TableCell>
                                                <TableCell align="right">
                                                    {noticeMessage &&
                                                        <IconButton name='deleteNotice' onClick={deleteNoticeMessage} aria-label="delete" className="mr-1!">
                                                            <Backspace fontSize="small" />
                                                        </IconButton>
                                                    }
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
                                        {'Create a webhook in the Discord application and submit your webhook\'s ID and Token. (e.g. https://discord.com/api/webhooks/id/token)'}
                                        <IconButton onClick={() => window.open('https://github.com/dapucita/haxbotron/wiki/Discord-Webhook-Configuration', '_blank')}
                                                    edge="start" size="medium" aria-label="get help" className="-ml-1!">
                                            <LiveHelp />
                                        </IconButton>
                                    </Typography>
                                </Grid>
                            </Grid>
                            <form className="w-full mt-2" onSubmit={handleDiscordWebhookSet} method="post">
                                <Grid container spacing={2}>
                                    <Grid container spacing={2} size={12}>
                                        <Grid size={1}>
                                            <FormControlLabel
                                                control={<Switch id="discordWebhookFeed" name="discordWebhookFeed" size="small" checked={newDiscordWebhookFeed} onChange={onChangeDiscordWebhookFeed} color="primary" />}
                                                label="Enable" labelPlacement="top"
                                            />
                                        </Grid>
                                        <Grid size={{xs: 2, sm: 2}}>
                                            <FormControlLabel
                                                control={<Switch id="discordWebhookReplayUpload" name="discordWebhookReplayUpload" size="small" checked={newDiscordWebhookReplayUpload} onChange={onChangeDiscordWebhookReplayUpload} color="primary" />}
                                                label="Replay Upload" labelPlacement="top"
                                            />
                                        </Grid>
                                    </Grid>


                                    <Grid size={{xs: 6, sm: 3}}>
                                        <TextField
                                            variant="outlined" margin="normal" size="small" fullWidth
                                            id="discordReplaysWebhookID" label="Replays Webhook ID" name="discordReplaysWebhookID"
                                            value={newReplaysWebhookID} onChange={onChangeReplaysWebhookID}
                                        />
                                    </Grid>
                                    <Grid size={8}>
                                        <TextField
                                            variant="outlined" margin="normal" size="small" fullWidth
                                            id="discordReplaysWebhookToken" label="Replays Webhook Token" name="discordReplaysWebhookToken"
                                            value={newReplaysWebhookToken} onChange={onChangeReplaysWebhookToken}
                                        />
                                    </Grid>

                                    <Grid size={{xs: 6, sm: 3}}>
                                        <TextField
                                            variant="outlined" margin="normal" size="small" fullWidth
                                            id="discordPasswordWebhookID" label="Password Webhook ID" name="discordPasswordWebhookID"
                                            value={newPasswordWebhookID} onChange={onChangePasswordWebhookID}
                                        />
                                    </Grid>
                                    <Grid size={8}>
                                        <TextField
                                            variant="outlined" margin="normal" size="small" fullWidth
                                            id="discordPasswordWebhookToken" label="Password Webhook Token" name="discordPasswordWebhookToken"
                                            value={newPasswordWebhookToken} onChange={onChangePasswordWebhookToken}
                                        />
                                    </Grid>
                                </Grid>

                                <Grid container spacing={1} size={12}>  
                                        <Grid size={{xs: 3, sm: 1}}>
                                            <Button fullWidth size="small" type="submit" variant="contained" color="primary" className="mt-1!">Apply</Button>
                                        </Grid>
                                        <Grid size={{xs: 3, sm: 1}}>
                                            <Button fullWidth size="small" type="button" variant="outlined" color="inherit" className="mt-1!" onClick={handleDiscordWebhookLoad}>Load</Button>
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
