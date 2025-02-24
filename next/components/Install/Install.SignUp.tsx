import { useState } from 'react';
import { 
  Avatar, Button, CssBaseline, TextField,
  Grid2 as Grid, Link, Typography, Container, styled 
} from '@mui/material';
import { LockOutlined } from '@mui/icons-material';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import client from '../../lib/client';
import Alert, { AlertColor } from '../common/Alert';

interface checkProps {
    installed: boolean
}

const StyledDiv = styled('div')(({ theme }) => ({
  marginTop: theme.spacing(8),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
}));

export default function SignUp({ installed }: checkProps) {
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
                const result = await client.post('/api/v1/init', { username, password });
                if(result.status === 201) {
                    setFlashMessage('Configuration succeeded.');
                    setAlertStatus('success');
                    setTimeout(()=>{
                        router.push('/admin');
                    }, 5000);
                }
            } catch (e: any) {
                setAlertStatus('error');
                switch(e.response.status) {
                    case 400: {
                        setFlashMessage('Form is unfulfilled.');
                        break;
                    }
                    case 405: {
                        setFlashMessage('Already done.');
                        break;
                    }
                    default :{
                        setFlashMessage('Unexpected error is caused. Please try again.');
                        break;
                    }
                }
            }
        } else {
            setFlashMessage('Form is unfulfilled.');
            setAlertStatus('error');
        }
        
    }

    if(installed) {
        return (
            <Container component="main" maxWidth="xs">
                <CssBaseline />
                <StyledDiv>
                    <Avatar>
                        <LockOutlined />
                    </Avatar>
                    <Typography component="h1" variant="h5">
                        Initial Configuration
                    </Typography>
                    <Typography variant="body1">Already done. Login and start managing the server.</Typography>
                </StyledDiv>
            </Container>
        )
    } else {
        return (
            <Container component="main" maxWidth="xs">
                <CssBaseline />
                <StyledDiv>
                    <Avatar>
                        <LockOutlined />
                    </Avatar>
                    <Typography component="h1" variant="h5">
                        Initial Configuration
                    </Typography>
                    <Typography variant="body1">Sign up new admin account.</Typography>
                    {flashMessage && <Alert severity={alertStatus}>{flashMessage}</Alert>}
                    <form onSubmit={handleSubmit} method="post">
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
                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    color="primary"
                                >
                                    Sign Up
                                </Button>
                            </Grid>
                        </Grid>

                        <Grid container justifyContent="end" marginTop={1}>
                            <Grid justifySelf="end">
                                <Link component={NextLink} href="/admin" variant="body2">
                                    Already have an account? Sign in
                                </Link>
                            </Grid>
                        </Grid>
                    </form>
                </StyledDiv>
            </Container>
        )
    }
}