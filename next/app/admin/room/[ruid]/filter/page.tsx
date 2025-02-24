'use client';

import React, { useEffect, useState } from 'react';
import { 
  Container, Grid2 as Grid, Paper, Button, 
  Divider, TextField, Typography, 
  Theme, useTheme
} from '@mui/material';
import WidgetTitle from '@/components/Admin/WidgetTitle';
import { useParams } from 'next/navigation';
import client from '@/lib/client';
import Alert, { AlertColor } from '@/components/common/Alert';

const useStyles = (theme: Theme) => ({
    container: {
        paddingTop: theme.spacing(4),
        paddingBottom: theme.spacing(4),
    },
    paper: {
        padding: theme.spacing(2),
    },
    form: {
        margin: theme.spacing(2),
    },
    margin: {
        margin: theme.spacing(1),
    },
    submit: {
        marginRight: theme.spacing(1),
    },
});

export default function RoomTextFilter() {
    const theme = useTheme();
    const classes = useStyles(theme);

    const { ruid } = useParams();

    const [nicknameFilteringPool, setNicknameFilteringPool] = useState('');
    const [chatFilteringPool, setChatFilteringPool] = useState('');

    const [flashMessage, setFlashMessage] = useState('');
    const [alertStatus, setAlertStatus] = useState("success" as AlertColor);

    const onChangeNicknameFilteringPool = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNicknameFilteringPool(e.target.value);
    }

    const onChangeChatFilteringPool = (e: React.ChangeEvent<HTMLInputElement>) => {
        setChatFilteringPool(e.target.value);
    }

    const handleNicknameFilteringPoolClear = async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>)  => {
        event.preventDefault();
        clearFilteringPool('nickname');
        setNicknameFilteringPool('');
    }

    const handleChatFilteringPoolClear = async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>)  => {
        event.preventDefault();
        clearFilteringPool('chat');
        setChatFilteringPool('');
    }

    const clearFilteringPool = async (endpoint: string)  => {
        try {
            const result = await client.delete(`/api/v1/room/${ruid}/filter/${endpoint}`);
            if (result.status === 204) {
                setFlashMessage('Successfully clear.');
                setAlertStatus('success');
                setTimeout(() => {
                    setFlashMessage('');
                }, 3000);
            }
        } catch (error: any) {
            setFlashMessage('Failed to clear.');
            setAlertStatus('error');
            setTimeout(() => {
                setFlashMessage('');
            }, 3000);
        }
    }

    const handleNicknameFilteringPoolSet = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFilteringPool('nickname', nicknameFilteringPool);
    }

    const handleChatFilteringPoolSet = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFilteringPool('chat', chatFilteringPool);
    }

    const setFilteringPool = async (endpoint: string, pool: string) => {
        localStorage.setItem(`_${endpoint}FilteringPool`, pool);
        try {
            const result = await client.post(`/api/v1/room/${ruid}/filter/${endpoint}`, { pool: pool });
            if (result.status === 201) {
                setFlashMessage('Successfully set.');
                setAlertStatus('success');
                setTimeout(() => {
                    setFlashMessage('');
                }, 3000);
            }
        } catch (error: any) {
            setAlertStatus('error');
            switch (error.response.status) {
                case 400: {
                    setFlashMessage('No words in text pool.');
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

    const getNicknameFilteringPool = async () => {
        getFilteringPool('nickname', setNicknameFilteringPool)
    }

    const getChatFilteringPool = async () => {
        getFilteringPool('chat', setChatFilteringPool)
    }

    const getFilteringPool = async (endpoint: string, setterFunction: (textPool: string) => void) => {
        try {
            const result = await client.get(`/api/v1/room/${ruid}/filter/${endpoint}`);
            if (result.status === 200) {
                const textPool: string = result.data.pool;
                setterFunction(textPool);
            }
        } catch (error: any) {
            setAlertStatus('error');
            if (error.response.status === 404) {
                setFlashMessage('Failed to load filtering pool.');
                setNicknameFilteringPool('');
            } else {
                setFlashMessage('Unexpected error is caused. Please try again.');
            }
        }
    }

    const handleNicknameFilteringPoolLoad = async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        event.preventDefault();

        setNicknameFilteringPool(localStorage.getItem('_nicknameFilteringPool') || '');
    }

    const handleChatFilteringPoolLoad = async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        event.preventDefault();

        setChatFilteringPool(localStorage.getItem('_chatFilteringPool') || '');
    }

    useEffect(() => {
        getNicknameFilteringPool();
        getChatFilteringPool();
    }, []);

    return (
        <Container maxWidth="lg" sx={classes.container}>
            <Grid container spacing={3}>
                <Grid size={12}>
                    <Paper sx={classes.paper}>
                        <React.Fragment>
                            {flashMessage && <Alert severity={alertStatus}>{flashMessage}</Alert>}
                            <WidgetTitle>Nickname Filtering Pool</WidgetTitle>
                            <Typography variant="body1">Seperate by |,| and click Apply button.</Typography>
                            <form style={classes.form} onSubmit={handleNicknameFilteringPoolSet} method="post">
                                <TextField
                                    fullWidth variant="outlined" margin="normal" multiline required
                                    value={nicknameFilteringPool} onChange={onChangeNicknameFilteringPool}
                                    id="nicknameFilteringPoolField" name="nicknameFilteringPoolField" label="Seperate by |,|"
                                />
                                <Button size="small" type="submit" variant="contained" color="primary" sx={classes.submit}>Apply</Button>
                                <Button size="small" type="button" variant="contained" color="secondary" sx={classes.submit} onClick={handleNicknameFilteringPoolClear}>Clear</Button>
                                <Button size="small" type="button" variant="outlined" color="inherit" sx={classes.submit} onClick={handleNicknameFilteringPoolLoad}>Load</Button>
                            </form>
                            <Divider />

                            <WidgetTitle>Chat Filtering Pool</WidgetTitle>
                            <Typography variant="body1">Seperate by |,| and click Apply button.</Typography>
                            <form style={classes.form} onSubmit={handleChatFilteringPoolSet} method="post">
                                <TextField
                                    fullWidth variant="outlined" margin="normal" multiline required
                                    value={chatFilteringPool} onChange={onChangeChatFilteringPool}
                                    id="chatFilteringPoolField" name="chatFilteringPoolField" label="Seperate by |,|"
                                />
                                <Button size="small" type="submit" variant="contained" color="primary" sx={classes.submit}>Apply</Button>
                                <Button size="small" type="button" variant="contained" color="secondary" sx={classes.submit} onClick={handleChatFilteringPoolClear}>Clear</Button>
                                <Button size="small" type="button" variant="outlined" color="inherit" sx={classes.submit} onClick={handleChatFilteringPoolLoad}>Load</Button>
                            </form>
                        </React.Fragment>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
}
