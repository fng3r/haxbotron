import { Container, Link, Typography } from '@mui/material';

export default function Footer() {
  return (
    <footer className="relative bottom-0 mt-auto w-full bg-neutral-100 p-6">
      <Container maxWidth="sm">
        <>
          <Typography variant="body1" align="center">
            {'Powered by '}
            <Link color="inherit" href="https://github.com/dapucita/haxbotron">
              Haxbotron
            </Link>
          </Typography>
          <Typography variant="body2" color="textSecondary" align="center">
            {'MIT License Copyright © '}
            {new Date().getFullYear()}{' '}
            <Link color="inherit" href="https://github.com/dapucita">
              dapucita
            </Link>
          </Typography>
        </>
      </Container>
    </footer>
  );
}
