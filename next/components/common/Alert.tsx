import React from 'react';

import { AlertProps, Alert as MuiAlert } from '@mui/material';

/*
usage: <Alert severity="error/warning/success/info">This is an error message!</Alert>
type Color = 'success' | 'info' | 'warning' | 'error';
https://material-ui.com/components/snackbars/
*/
export type AlertColor = 'success' | 'info' | 'warning' | 'error';

export default function Alert(props: AlertProps) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}
