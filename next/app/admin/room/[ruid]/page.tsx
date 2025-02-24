'use client';

import React, { useContext, useEffect, useState } from 'react';
import { 
  Container, Grid2 as Grid, Paper, Button, 
  Divider, TextField, Alert
} from '@mui/material';
import WidgetTitle from '@/components/Admin/WidgetTitle';
import client from '@/lib/client';
import { BrowserHostRoomConfig, BrowserHostRoomGameRule, BrowserHostRoomSettings } from '@/../core/lib/browser.hostconfig';
import { WSocketContext } from '@/context/ws';
import { useParams } from 'next/navigation';


type AlertColor = 'success' | 'info' | 'warning' | 'error';

interface roomInfo {
    roomName: string
    onlinePlayers: number
    _link: string
    _roomConfig: BrowserHostRoomConfig
    _settings: BrowserHostRoomSettings
    _rules: BrowserHostRoomGameRule
}

export default function RoomInfo() {
    const { ruid } = useParams();

    const ws = useContext(WSocketContext);

    const [flashMessage, setFlashMessage] = useState('');
    const [alertStatus, setAlertStatus] = useState("success" as AlertColor);

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
                setFlashMessage('Failed to load status of chat');
                setAlertStatus("error");
            } else {
                setFlashMessage('Unexpected error is caused. Please try again.');
                setAlertStatus("error");
            }
        }
    }

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
                setFlashMessage('Failed to load information.');
                setAlertStatus("error");
            } else {
                setFlashMessage('Unexpected error is caused. Please try again.');
                setAlertStatus("error");
            }
        }
    }

    const onChangePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPlainPassword(e.target.value);
    }

    const handleSetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        try {
            const result = await client.post(`/api/v1/room/${ruid}/info/password`, {
                password: plainPassword
            });
            if (result.status === 201) {
                setFlashMessage('Successfully set password.');
                setAlertStatus('success');
                setPlainPassword('');
                setTimeout(() => {
                    setFlashMessage('');
                }, 3000);

                getRoomInfo();
            }
        } catch {
            setFlashMessage('Failed to set password.');
            setAlertStatus('error');
            setTimeout(() => {
                setFlashMessage('');
            }, 3000);
        }
    }

    const handleFreezeChat = async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        event.preventDefault();
        try {
            if (freezeStatus) {
                const result = await client.delete(`/api/v1/room/${ruid}/info/freeze`);
                if (result.status === 204) {
                    setFlashMessage('Successfully unfreezed whole chat.');
                    setAlertStatus('success');
                    setTimeout(() => {
                        setFlashMessage('');
                    }, 3000);

                    getFreezeStatus();
                }
            } else {
                const result = await client.post(`/api/v1/room/${ruid}/info/freeze`);
                if (result.status === 204) {
                    setFlashMessage('Successfully freezed whole chat.');
                    setAlertStatus('success');
                    setTimeout(() => {
                        setFlashMessage('');
                    }, 3000);

                    getFreezeStatus();
                }
            }

        } catch (error: any) {
            setFlashMessage('Failed to freeze whole chat.');
            setAlertStatus('error');
            setTimeout(() => {
                setFlashMessage('');
            }, 3000);
        }
    }

    const handleClearPassword = async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        event.preventDefault();
        try {
            const result = await client.delete(`/api/v1/room/${ruid}/info/password`);
            if (result.status === 204) {
                setFlashMessage('Successfully clear password.');
                setAlertStatus('success');
                setPlainPassword('');
                setTimeout(() => {
                    setFlashMessage('');
                }, 3000);

                getRoomInfo();
            }
        } catch {
            setFlashMessage('Failed to clear password.');
            setAlertStatus('error');
            setTimeout(() => {
                setFlashMessage('');
            }, 3000);
        }
    }

    useEffect(() => {
        getRoomInfo();
        getFreezeStatus();
    }, []);

    useEffect(() => {
        try {
            setRoomInfoJSONText(JSON.stringify(roomInfoJSON, null, 4));
        } catch {
            setFlashMessage('Failed to load text.');
            setAlertStatus("error");
        }
    }, [roomInfoJSON]);

    useEffect(() => { // websocket with socket.io
        ws.on('statuschange', (content: {ruid: string}) => {
            if (content.ruid === ruid) {
                getFreezeStatus();
            }
        });
        return () => {
            // before the component is destroyed
            // unbind all event handlers used in this component
        }
    }, [ws]);

    return (
        <Container maxWidth="lg" className="py-8">
            <Grid container spacing={3}>
                <Grid size={12}>
                    <Paper className="p-4">
                        <React.Fragment>
                            {flashMessage && <Alert severity={alertStatus}>{flashMessage}</Alert>}
                            <WidgetTitle>Room Information</WidgetTitle>

                            <Grid container spacing={2}>
                                <Grid size={12}>
                                    <Button size="small" type="button" variant="contained" color="inherit" className="mt-1!" onClick={handleFreezeChat}>
                                        {freezeStatus ? 'Unfreeze Chat' : 'Freeze Chat'}
                                    </Button>

                                    <form className="w-full mt-6" onSubmit={handleSetPassword} method="post">
                                        <Grid container spacing={0} alignItems="center">
                                            <TextField
                                                variant="outlined" margin="normal" required size="small" value={plainPassword} onChange={onChangePassword}
                                                id="password" label="Password" name="password"
                                            />
                                            <Grid size={3} alignContent="center">
                                                <Button size="small" type="submit" variant="contained" className="mt-4!" color="primary">Set</Button>
                                                <Button size="small" type="button" variant="contained" className="mt-4!" color="secondary" onClick={handleClearPassword}>Clear</Button>
                                            </Grid>
                                        </Grid>
                                        
                                    </form>

                                    <TextField
                                        variant="outlined" margin="normal" required size="small" value={adminPassword}
                                        id="admin-password" label="Admin password" name="admin-password" InputProps={{readOnly: true}}
                                    />
                                </Grid>
                            </Grid>
                            <Divider />

                            <Grid container spacing={2}>
                                <Grid size={12}>
                                    <TextField
                                        fullWidth variant="outlined" margin="normal" multiline
                                        value={roomInfoJSONText} id="roomInfoJSONText" name="roomInfoJSONText" label="JSON Data"
                                        slotProps={{ input: { readOnly: true } }}
                                    />
                                </Grid>
                            </Grid>
                        </React.Fragment>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
}
