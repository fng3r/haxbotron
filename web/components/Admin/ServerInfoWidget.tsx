'use client';

import Link from 'next/link';

import WidgetTitle from '../common/WidgetTitle';
import { Grid2 as Grid, Link as MuiLink, Typography } from '@mui/material';

import { queries } from '@/lib/queries/server';

export default function ServerInfoWidget() {
  const { data: serverInfo } = queries.getInfo();

  return (
    <Grid container flexDirection="column" className="h-40">
      <Grid size={12} sx={{ flex: 1 }}>
        <WidgetTitle>Server Info</WidgetTitle>
        {serverInfo && (
          <>
            <Typography component="p" variant="h4">
              {serverInfo.usedMemoryMB}MB
            </Typography>
            <Typography color="textSecondary">uptime {Math.round(serverInfo.upTimeSecs / 60)} minutes.</Typography>
          </>
        )}
      </Grid>

      <Grid size={12}>
        <MuiLink component={Link} href="/admin/serverinfo" underline="hover">
          <Typography variant="body2" color="primary">
            Get more information
          </Typography>
        </MuiLink>
      </Grid>
    </Grid>
  );
}
