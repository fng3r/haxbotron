import { SnackbarKey, VariantType, useSnackbar } from 'notistack';

let useSnackbarRef: ReturnType<typeof useSnackbar>;
export const SnackbarUtilsConfigurator = () => {
  useSnackbarRef = useSnackbar();
  return null;
};

const SnackBarNotification = {
  success(msg: string, autoHideDuration: number = 3000) {
    return this.toast(msg, 'success', autoHideDuration);
  },
  warning(msg: string, autoHideDuration: number = 3000) {
    return this.toast(msg, 'warning', autoHideDuration);
  },
  info(msg: string, autoHideDuration: number = 3000) {
    return this.toast(msg, 'info', autoHideDuration);
  },
  error(msg: string, autoHideDuration: number = 5000) {
    return this.toast(msg, 'error', autoHideDuration);
  },
  toast(msg: string, variant: VariantType = 'default', autoHideDuration: number = 3000) {
    return useSnackbarRef.enqueueSnackbar(msg, { variant, autoHideDuration });
  },
  dismiss(id: SnackbarKey) {
    useSnackbarRef.closeSnackbar(id);
  },
};

export default SnackBarNotification;
