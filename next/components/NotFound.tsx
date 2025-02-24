import React from 'react';
import { 
  CssBaseline, Typography, Container, Box,
  styled 
} from '@mui/material';
import { usePathname } from 'next/navigation';
import Footer from './common/Footer';

const RootDiv = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
});

const MainContainer = styled(Container)(({ theme }) => ({
  marginTop: theme.spacing(8),
  marginBottom: theme.spacing(2),
}));

export default function NotFound() {
  const pathname = usePathname();

  return (
    <RootDiv>
      <CssBaseline />
      <MainContainer maxWidth="sm">
        <Typography variant="h2" component="h1" gutterBottom>
          Haxbotron 🤖
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom>
          {'This page is not found.'}
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom>
          <Box fontStyle="italic">{pathname}</Box>
        </Typography>
      </MainContainer>
      <Footer />
    </RootDiv>
  );
}
