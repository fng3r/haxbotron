'use client';

import React, { useState } from 'react';
import { 
  Avatar, Button, CssBaseline, TextField,
  Typography, Container, styled 
} from '@mui/material';
import { LockOutlined } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import client from '../lib/client';
import Alert, { AlertColor } from './common/Alert';

const StyledDiv = styled('div')(({ theme }) => ({
  marginTop: theme.spacing(8),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  margin: theme.spacing(1),
  backgroundColor: theme.palette.secondary.main,
}));

const StyledForm = styled('form')(({ theme }) => ({
  width: '100%',
  marginTop: theme.spacing(1),
}));

const SubmitButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(3, 0, 2),
}));

export default function SignIn() {
    const router = useRouter();

    const [flashMessage, setFlashMessage] = useState('');
    const [alertStatus, setAlertStatus] = useState("success" as AlertColor);
    const [adminAccount, setAdminAccount] = useState({
        username: '',
        password: ''
    });

    const { username, password } = adminAccount;

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setAdminAccount({
            ...adminAccount,
            [name]: value
        });
    }

    const validateForm = (): boolean => {
        if(username && password && password.length >= 3 && password.length <= 20) return true;
        else return false;
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if(validateForm()) {
            try {
                const result = await client.post('/api/v1/auth', { username, password });
                if(result.status === 201) {
                    setFlashMessage('Configuration succeeded.');
                    setAlertStatus('success');
                    router.push('/admin');
                }
            } catch (e: any) {
                setAlertStatus('error');
                switch(e.response.status) {
                    case 401: {
                        setFlashMessage('Login failed.');
                        break;
                    }
                    default :{
                        setFlashMessage('Unexpected error is caused. Please try again.');
                        break;
                    }
                }
            }
        } else {
            setAlertStatus('error');
            setFlashMessage('Form is unfulfilled.');
        }
    }

    return (
        <Container component="main" maxWidth="xs">
            <CssBaseline />
            <StyledDiv>
                <StyledAvatar>
                    <LockOutlined />
                </StyledAvatar>
                <Typography component="h1" variant="h5">
                    Admin Account
                </Typography>
                <Typography variant="body1">Login and start managing the server.</Typography>
                {flashMessage && <Alert severity={alertStatus}>{flashMessage}</Alert>}
                <StyledForm onSubmit={handleSubmit} method="post">
                    <TextField
                        variant="outlined"
                        margin="normal"
                        required
                        fullWidth
                        id="username"
                        label="Account Name"
                        name="username"
                        value={username}
                        onChange={onChange}
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
                        onChange={onChange}
                    />
                    <SubmitButton
                        type="submit"
                        fullWidth
                        variant="contained"
                        color="primary"
                    >
                        Login
                    </SubmitButton>
                </StyledForm>
            </StyledDiv>
        </Container>
    );
}
