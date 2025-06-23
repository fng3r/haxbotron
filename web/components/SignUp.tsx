'use client';

import { useActionState, useState } from 'react';

import Link from 'next/link';

import { LockOutlined } from '@mui/icons-material';
import {
  Avatar,
  Button,
  Container,
  CssBaseline,
  Grid2 as Grid,
  Link as MuiLink,
  TextField,
  Typography,
} from '@mui/material';

import { signup } from '@/app/actions/auth';

export default function SignUp() {
  const [adminAccount, setAdminAccount] = useState({
    username: '',
    password: '',
  });

  const { username, password } = adminAccount;

  const [signupState, signupAction] = useActionState(signup, { error: '' });

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAdminAccount({
      ...adminAccount,
      [name]: value,
    });
  };

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <Container className="mt-16 flex flex-col items-center">
        <Avatar>
          <LockOutlined />
        </Avatar>
        <Typography component="h1" variant="h5">
          Initial Configuration
        </Typography>
        <Typography variant="body1">Sign up new admin account.</Typography>
        <form action={signupAction} style={{ marginTop: 20 }}>
          <Grid container spacing={2}>
            <Grid size={12}>
              <TextField
                name="username"
                variant="outlined"
                required
                fullWidth
                id="username"
                label="Account Name"
                autoFocus
                value={username}
                onChange={onChange}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                variant="outlined"
                required
                fullWidth
                name="password"
                label="Password (3-20 characters)"
                type="password"
                id="password"
                value={password}
                onChange={onChange}
              />
            </Grid>
            <Grid size={12}>
              <Button type="submit" fullWidth variant="contained" color="primary">
                Sign Up
              </Button>
            </Grid>
          </Grid>

          <Grid container justifyContent="end" marginTop={1}>
            <Grid justifySelf="end">
              <MuiLink component={Link} href="/admin" variant="body2">
                Already have an account? Sign in
              </MuiLink>
            </Grid>
          </Grid>
        </form>
      </Container>
    </Container>
  );
}
