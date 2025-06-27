'use client';

import { SnackbarKey, SnackbarProvider, useSnackbar } from 'notistack';

import { SnackbarUtilsConfigurator } from './SnackBarNotification';
import { Close } from '@mui/icons-material';
import { IconButton } from '@mui/material';

export default function SnackBarProviderWrapper() {
  return (
    <SnackbarProvider
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      autoHideDuration={3000}
      action={(snackbarKey) => <SnackbarCloseButton snackbarKey={snackbarKey} />}
    >
      <SnackbarUtilsConfigurator />
    </SnackbarProvider>
  );
}

function SnackbarCloseButton({ snackbarKey }: { snackbarKey: SnackbarKey }) {
  const { closeSnackbar } = useSnackbar();
  return (
    <IconButton onClick={() => closeSnackbar(snackbarKey)}>
      <Close className="text-white dark:text-gray-500" />
    </IconButton>
  );
}
