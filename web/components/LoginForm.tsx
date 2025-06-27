'use client';

import { useActionState, useState } from 'react';

import { Alert, Button, TextField } from '@mui/material';

import { login } from '@/app/actions/auth';

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [state, formAction] = useActionState(login, { error: '' });

  const onChangeUsername = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  const onChangePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  return (
    <>
      {state.error && (
        <Alert severity="error" className="w-full mt-3! mb-2">
          {state.error}
        </Alert>
      )}
      <form className="mt-1 w-full" action={formAction}>
        <TextField
          variant="outlined"
          margin="normal"
          required
          fullWidth
          id="username"
          label="Account Name"
          name="username"
          value={username}
          onChange={onChangeUsername}
          autoFocus
        />
        <TextField
          variant="outlined"
          margin="normal"
          required
          fullWidth
          name="password"
          label="Password"
          type="password"
          id="password"
          value={password}
          onChange={onChangePassword}
        />
        <Button type="submit" fullWidth variant="contained" color="primary" className="mt-1!">
          Login
        </Button>
      </form>
    </>
  );
}
