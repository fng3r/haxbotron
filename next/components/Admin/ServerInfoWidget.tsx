'use client';

import client from '../../lib/client';
import Link from 'next/link';
import WidgetTitle from './WidgetTitle';
import { Grid2, Link as MuiLink, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

export default function ServerInfoWidget() {
    const [serverInfo, setServerInfo] = useState({
        usedMemoryMB: 0,
        upTimeSecs: 0,
        serverVersion: '0.0'
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
        <Grid2 container flexDirection="column" sx={{ height: 240 }}>
            <Grid2 size={12} sx={{ flex: 1 }}>
                <WidgetTitle>Server Info</WidgetTitle>
                <Typography component="p" variant="h4">
                    {serverInfo.usedMemoryMB}MB
                </Typography>
                <Typography color="textSecondary">
                        uptime {Math.round(serverInfo.upTimeSecs/60)} minutes.
                </Typography>   
            </Grid2>

            <Grid2 size={12}>
                <MuiLink component={Link} href="/admin/serverinfo" underline="hover">
                    <Typography variant="body2" color="primary">
                        Get more information
                    </Typography>
                </MuiLink>
            </Grid2>
        </Grid2>
    );
}
