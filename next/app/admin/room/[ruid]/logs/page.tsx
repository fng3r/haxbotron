'use client';

import React, { useContext, useEffect, useState } from 'react';
import { 
  Container, Grid2 as Grid, Paper, Button, 
  Divider, TextField, List, ListItem, ListItemIcon
} from '@mui/material';
import WidgetTitle from '@/components/Admin/WidgetTitle';
import { WSocketContext } from '@/context/ws';
import { useParams } from 'next/navigation';
import Alert, { AlertColor } from '@/components/common/Alert';
import client from '@/lib/client';
import { CircleNotificationsTwoTone } from '@mui/icons-material';

interface LogMessage {
    ruid: string
    origin: string
    type: string
    message: string
}


export default function RoomLogs() {
    const ws = useContext(WSocketContext);
    const { ruid } = useParams();

    const [logMessage, setLogMessage] = useState([] as LogMessage[]);
    const [recentLogMessage, setRecentLogMessage] = useState({} as LogMessage);

    const [flashMessage, setFlashMessage] = useState('');
    const [alertStatus, setAlertStatus] = useState("success" as AlertColor);

    const [broadcastMessage, setBroadcastMessage] = useState('');

    const handleBroadcast = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        try {
            const result = await client.post(`/api/v1/room/${ruid}/chat`, { message: broadcastMessage });
            if (result.status === 201) {
                setFlashMessage('Successfully sent.');
                setAlertStatus('success');
                setBroadcastMessage('');
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

    const onChangeBroadcastMessage = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBroadcastMessage(e.target.value);
    }

    useEffect(() => {
        ws.on('log', (content: LogMessage) => {
            if (content.ruid === ruid) {
                setRecentLogMessage(content);
            }
        });
    }, []);

    useEffect(() => {
        if (Object.keys(recentLogMessage).length > 0) {
            setLogMessage(logMessage.concat(recentLogMessage));
        }
        setRecentLogMessage({} as LogMessage);
    }, [recentLogMessage.message]);

    return (
        <Container maxWidth="lg" className="py-8">
            <Grid container spacing={3}>
                <Grid size={12}>
                    <Paper className="p-4 overflow-auto">
                        <React.Fragment>
                            {flashMessage && <Alert severity={alertStatus}>{flashMessage}</Alert>}
                            <WidgetTitle>Broadcast</WidgetTitle>
                            <form className="w-full mt-2" onSubmit={handleBroadcast} method="post">
                                <TextField
                                    variant="outlined"
                                    margin="normal"
                                    required
                                    size="small"
                                    id="broadcast"
                                    label="Message"
                                    name="broadcast"
                                    value={broadcastMessage}
                                    onChange={onChangeBroadcastMessage}
                                    autoFocus
                                    sx={{width: '50%'}}
                                />
                                <Button size="small" type="submit" variant="contained" color="primary" className="mt-5! ml-1!">Send</Button>
                            </form>
                        </React.Fragment>
                        <Divider />
                        
                        <React.Fragment>
                            <WidgetTitle>Log Messages</WidgetTitle>
                            <List>
                                {logMessage.map((message, idx) => (
                                    <ListItem key={idx}>
                                        <ListItemIcon sx={{minWidth: '30px'}}>
                                            <CircleNotificationsTwoTone />
                                        </ListItemIcon>
                                        [{message.origin}] {message.message}
                                    </ListItem>
                                ))}
                            </List>
                        </React.Fragment>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
}
