import React from 'react';
import { Container, Grid2 as Grid, Paper } from '@mui/material';
import ServerInfoWidget from '@/components/Admin/ServerInfoWidget';
import RoomWidget from '@/components/Admin/RoomWidget';

export default function Mainboard() {
    return (
        <Container maxWidth="lg" className="py-8">
            <Grid container spacing={3}>
                <Grid size={{xs: 12, md: 4, lg: 3}}>
                    <Paper className="p-4">
                        <ServerInfoWidget />
                    </Paper>
                </Grid>
                <Grid size={{xs: 12}}>
                    <Paper className="p-4">
                        <RoomWidget />
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
}
