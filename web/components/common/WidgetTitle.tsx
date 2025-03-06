import React from 'react';

import { Typography } from '@mui/material';

interface Props {
  children: React.ReactNode;
}

export default function WidgetTitle(props: Props) {
  return (
    <Typography component="h2" variant="h6" color="primary" gutterBottom>
      {props.children}
    </Typography>
  );
}
