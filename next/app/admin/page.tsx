'use client';

import React from 'react';
import { Container, Grid2 as Grid, Paper, Theme, useTheme } from '@mui/material';
import ServerInfoWidget from '@/components/Admin/ServerInfoWidget';
import RoomWidget from '@/components/Admin/RoomWidget';

const useStyles = (theme: Theme) => ({
    container: {
        paddingTop: theme.spacing(4),
        paddingBottom: theme.spacing(4),
    },
    paper: {
        padding: theme.spacing(2),
    },
    fixedHeight: {
        height: 240,
    },
});

export default function Mainboard() {
    const theme = useTheme();
    const classes = useStyles(theme);

    return (
        <Container maxWidth="lg" sx={classes.container}>
            <Grid container spacing={3}>
                <Grid size={{xs: 12, md: 4, lg: 3}}>
                    <Paper sx={classes.paper}>
                        <ServerInfoWidget />
                    </Paper>
                </Grid>
                <Grid size={{xs: 12}}>
                    <Paper sx={classes.paper}>
                        <RoomWidget />
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
}
