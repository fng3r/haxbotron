'use client';

import React, { useEffect, useState } from 'react';
import { 
  Container, Grid2 as Grid, Paper, Typography 
} from '@mui/material';
import client from '@/lib/client';
import WidgetTitle from '@/components/Admin/WidgetTitle';


export default function ServerInfo() {

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
        <Container maxWidth="lg" className="py-8">
            <Grid container spacing={3}>
                <Grid size={{xs: 12, md: 4, lg: 3}}>
                    <Paper className="p-4">
                        <React.Fragment>
                            <WidgetTitle>Memory Usage</WidgetTitle>
                            <Typography component="p" variant="h4">
                                {serverInfo.usedMemoryMB}MB
                            </Typography>
                        </React.Fragment>
                    </Paper>
                </Grid>
                <Grid size={{xs: 12, md: 4, lg: 3}}>
                    <Paper className="p-4">
                        <React.Fragment>
                            <WidgetTitle>Server Uptime</WidgetTitle>
                            <Typography component="p" variant="h4">
                                {Math.round(serverInfo.upTimeSecs / 60)} minutes
                            </Typography>
                        </React.Fragment>
                    </Paper>
                </Grid>
                <Grid size={{xs: 12, md: 4, lg: 3}}>
                    <Paper className="p-4">
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
