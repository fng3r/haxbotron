'use client';

import { SnackbarKey, SnackbarProvider, useSnackbar } from 'notistack';

import { SnackbarUtilsConfigurator } from './SnackBarNotification';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';

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
    <Button variant="ghost" size="icon" className="hover:bg-transparent" onClick={() => closeSnackbar(snackbarKey)}>
      <X className="text-white size-4" />
    </Button>
  );
}
