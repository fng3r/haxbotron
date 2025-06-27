import { redirect } from 'next/navigation';

import { getSession } from '../actions/auth';
import { LockOutlined } from '@mui/icons-material';
import { Avatar, Container, Typography } from '@mui/material';

import LoginForm from '@/components/LoginForm';

export default async function SignIn() {
  const session = await getSession();
  if (session) {
    redirect('/admin');
  }

  return (
    <Container component="main" maxWidth="xs">
      <div className="mt-16 flex flex-col items-center">
        <Avatar className="m-1" sx={{ backgroundColor: 'secondary.main' }}>
          <LockOutlined />
        </Avatar>
        <Typography component="h1" variant="h5">
          Admin Account
        </Typography>
        <Typography variant="body1">Login and start managing the server.</Typography>

        <LoginForm />
      </div>
    </Container>
  );
}
