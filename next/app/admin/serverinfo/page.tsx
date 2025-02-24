'use client';

import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import { 
  Container, Grid, Paper, Typography 
} from '@mui/material';
import { Theme, useTheme } from '@mui/material/styles';
import client from '@/lib/client';
import WidgetTitle from '@/components/Admin/WidgetTitle';

const useStyles = (theme: Theme) => ({
    container: {
        paddingTop: theme.spacing(4),
        paddingBottom: theme.spacing(4),
    },
    paper: {
        padding: theme.spacing(2),
        display: 'flex',
        overflow: 'auto',
        flexDirection: 'column',
    },
    fixedHeight: {
        height: 240,
    },
    infoContext: {
        flex: 1,
    },
});

export default function ServerInfo() {
    const theme = useTheme();
    const classes = useStyles(theme);

    const [serverInfo, setServerInfo] = useState({
        usedMemoryMB: 0,
        upTimeSecs: 0,
        serverVersion: '0.0.0'
    });

    useEffect(() => {
        const getInfo = async () => {
            try {
                const result = await client.get('/api/v1/system');
                if (result.status === 200) {
                    setServerInfo(result.data);
                }
            } catch (e: any) {
                if (e.status === 401) { }
            }
        }
        getInfo();
    }, []);

    return (
        <Container maxWidth="lg" sx={classes.container}>
            <Grid container spacing={3}>
                <Grid item xs={12} md={4} lg={3}>
                    <Paper sx={classes.paper}>
                        <React.Fragment>
                            <WidgetTitle>Memory Usage</WidgetTitle>
                            <Typography component="p" variant="h4">
                                {serverInfo.usedMemoryMB}MB
                            </Typography>
                        </React.Fragment>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={4} lg={3}>
                    <Paper sx={classes.paper}>
                        <React.Fragment>
                            <WidgetTitle>Server Uptime</WidgetTitle>
                            <Typography component="p" variant="h4">
                                {Math.round(serverInfo.upTimeSecs / 60)} minutes
                            </Typography>
                        </React.Fragment>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={4} lg={3}>
                    <Paper sx={classes.paper}>
                        <React.Fragment>
                            <WidgetTitle>Server Version</WidgetTitle>
                            <Typography component="p" variant="h4">
                                v{serverInfo.serverVersion}
                            </Typography>
                        </React.Fragment>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
}
