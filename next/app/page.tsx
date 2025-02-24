'use client';

import React from 'react';
import { 
  CssBaseline, Typography, Container, styled} from '@mui/material';
import Link from 'next/link';


const StyledRoot = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'column',
}));

const StyledContainer = styled(Container)(({ theme }) => ({
  marginTop: theme.spacing(8),
  marginBottom: theme.spacing(2),
}));


export default function Main() {
  return (
      <StyledRoot>
          <CssBaseline />
          <StyledContainer maxWidth="sm">
            <Typography variant="h2" component="h1" gutterBottom>
                Haxbotron 🤖
            </Typography>
            <Typography variant="h5" component="h2" gutterBottom>
                {'Welcome to use Haxbotron!'}
            </Typography>
            <Typography variant="h5" component="h2" gutterBottom>
                <Link href="/install" color="inherit">
                    Installation
                </Link>
            </Typography>
            <Typography variant="body1">You have to do initial configuration if this is your first run.</Typography>
            <Typography variant="h5" component="h2" gutterBottom>
                <Link href="/admin" color="inherit">
                    Administration
                </Link>
            </Typography>
            <Typography variant="body1">You can control and manage your headless host server.</Typography>
            <Typography variant="h5" component="h2" gutterBottom>
                <Link color="inherit" href="https://github.com/dapucita/haxbotron/wiki">
                    Documentation
                </Link>
            </Typography>
            <Typography variant="body1">See our wiki for how to use Haxbotron.</Typography>
          </StyledContainer>
      </StyledRoot>
  );
}
