import React from 'react';
import { 
  CssBaseline, Grid2 as Grid, Link as MuiLink, Typography, Container} from '@mui/material';
import Link from 'next/link';

export default function Main() {
  return (
      <Grid container>
          <CssBaseline />
          <Container maxWidth="sm" sx={{ marginTop: 8, marginBottom: 2 }}>
            <Grid container flexDirection="column" spacing={1}>
              <Grid size={12}>
                <Typography variant="h2" component="h1" gutterBottom>
                  Haxbotron 🤖
                </Typography>
                <Typography variant="h5" component="h2" gutterBottom>
                  Welcome to use Haxbotron!
                </Typography>
              </Grid>

              <Grid size={12}>
                <Typography variant="h5" component="span" gutterBottom>
                    <MuiLink component={Link} href="/install" color="inherit" underline="hover">
                        Installation
                    </MuiLink>
                </Typography>
                <Typography variant="body1">You have to do initial configuration if this is your first run.</Typography>
              </Grid>

              <Grid size={12}>  
                <Typography variant="h5" component="span" gutterBottom>
                  <MuiLink component={Link} href="/admin" color="inherit" underline="hover">
                      Administration
                  </MuiLink>
                </Typography>
                <Typography variant="body1">You can control and manage your headless host server.</Typography>
              </Grid>

              <Grid size={12}>
                <Typography variant="h5" component="span" gutterBottom>
                    <MuiLink component={Link} href="https://github.com/dapucita/haxbotron/wiki" color="inherit" underline="hover">
                      Documentation
                  </MuiLink>
                </Typography>
                <Typography variant="body1">See our wiki for how to use Haxbotron.</Typography>
              </Grid>
            </Grid>
          </Container>
      </Grid>
  );
}
