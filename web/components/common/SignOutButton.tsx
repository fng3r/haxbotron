'use client';

import { useRouter } from 'next/navigation';

import { PowerSettingsNew as PowerSettingsNewIcon } from '@mui/icons-material';
import { Badge, IconButton } from '@mui/material';

import client from '@/lib/client';

export default function SignOutButton() {
  const router = useRouter();

  const onClickLogout = async () => {
    try {
      const result = await client.delete('/api/v1/auth');
      if (result.status === 204) {
        router.push('/');
      }
    } catch {}
  };

  return (
    <IconButton color="inherit" onClick={onClickLogout}>
      <Badge color="secondary">
        <PowerSettingsNewIcon />
      </Badge>
    </IconButton>
  );
}
