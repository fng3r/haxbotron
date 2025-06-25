import Link from 'next/link';

import { LockOutlined } from '@mui/icons-material';
import { Avatar, Container, Grid2 as Grid, Link as MuiLink, Typography } from '@mui/material';

import SignUp from '@/components/SignUp';

import { installationNeeded } from '@/lib/auth/auth';

export default async function Install() {
  const isInstallationNeeded = await installationNeeded();

  return isInstallationNeeded ? (
    <SignUp />
  ) : (
    <Container component="main" maxWidth="xs">
      <Grid container spacing={1} flexDirection="column" alignItems="center" mt={8}>
        <Avatar>
          <LockOutlined color="success" />
        </Avatar>
        <Grid size={12} textAlign="center">
          <Typography component="h1" variant="h5">
            Initial Configuration
          </Typography>
          <Typography variant="body1">
            Already done. Log in and{' '}
            <MuiLink component={Link} href="/admin">
              start
            </MuiLink>{' '}
            managing the server.
          </Typography>
        </Grid>
      </Grid>
    </Container>
  );
}
