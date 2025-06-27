'use client';

import { PowerSettingsNew as PowerSettingsNewIcon } from '@mui/icons-material';
import { Badge, IconButton } from '@mui/material';

import { logout } from '@/app/actions/auth';

export default function SignOutButton() {
  return (
    <IconButton color="inherit" onClick={logout}>
      <Badge color="secondary">
        <PowerSettingsNewIcon />
      </Badge>
    </IconButton>
  );
}
