'use client';

import React, { useState } from 'react';
import { 
  Container, Grid2 as Grid, Paper, Button, Theme, useTheme
} from '@mui/material';
import WidgetTitle from '@/components/Admin/WidgetTitle';
import { useParams, useRouter } from 'next/navigation';
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
    submit: {
        margin: theme.spacing(3, 0, 2),
    },
});

export default function RoomPower() {
    const theme = useTheme();
    const classes = useStyles(theme);
    const { ruid } = useParams();
    const router = useRouter();
    const [flashMessage, setFlashMessage] = useState('');
    const [alertStatus, setAlertStatus] = useState("success" as AlertColor);
    
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
    }

    return (
        <Container maxWidth="lg" sx={classes.container}>
            <Grid container spacing={3}>
                <Grid size={12}>
                    <Paper sx={classes.paper}>
                        <React.Fragment>
                        {flashMessage && <Alert severity={alertStatus}>{flashMessage}</Alert>}
                            <WidgetTitle>{ruid}</WidgetTitle>
                            <Button
                                type="submit"
                                variant="contained"
                                color="secondary"
                                sx={classes.submit}
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
