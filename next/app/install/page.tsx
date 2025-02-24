import { Avatar, Grid2 as Grid, Container, CssBaseline, Typography } from '@mui/material';
import client from '@/lib/client';
import SignUp from '@/components/SignUp';
import Link from 'next/link';
import { Link as MuiLink } from '@mui/material';
import { LockOutlined } from '@mui/icons-material';


export default async function Install() {
    let installedAlready = false;
    try {
        const result = await client.get('/api/v1/init');
        if(result.status === 204) {
            installedAlready = true;
        }
    } catch { }

    return (
        installedAlready ? (
            <Container component="main" maxWidth="xs">
                <CssBaseline />
                <Grid container spacing={1} flexDirection="column" alignItems="center" mt={8}>
                    <Avatar>
                        <LockOutlined color="success" />
                    </Avatar>
                    <Grid size={12} textAlign="center">
                        <Typography component="h1" variant="h5">
                            Initial Configuration
                        </Typography>
                        <Typography variant="body1">
                            Already done. Log in and <MuiLink component={Link} href="/admin">start</MuiLink> managing the server.
                        </Typography>
                    </Grid>
                </Grid>
            </Container>
        )
        : (
            <SignUp />
        )
    )
}
