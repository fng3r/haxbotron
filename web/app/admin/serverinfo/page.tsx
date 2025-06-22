'use client';

import React from 'react';

import { Container, Grid2 as Grid, Paper, Typography } from '@mui/material';

import WidgetTitle from '@/components/common/WidgetTitle';

import { queries } from '@/lib/queries/server';

export default function ServerInfo() {
  const { data: serverInfo } = queries.getInfo();

  return (
    <Container maxWidth="lg" className="py-8">
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4, lg: 3 }}>
          <Paper className="p-4">
            <React.Fragment>
              <WidgetTitle>Memory Usage</WidgetTitle>
              <Typography component="p" variant="h4">
                {serverInfo.usedMemoryMB}MB
              </Typography>
            </React.Fragment>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 4, lg: 3 }}>
          <Paper className="p-4">
            <React.Fragment>
              <WidgetTitle>Server Uptime</WidgetTitle>
              <Typography component="p" variant="h4">
                {Math.round(serverInfo.upTimeSecs / 60)} minutes
              </Typography>
            </React.Fragment>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 4, lg: 3 }}>
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
