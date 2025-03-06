import React from 'react';

import { Link, Typography } from '@mui/material';

export default function Copyright() {
  return (
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
  );
}
