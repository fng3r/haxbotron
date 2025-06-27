'use client';

import { Power } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { logout } from '@/app/actions/auth';

export default function LogoutButton() {
  return (
    <Button variant="ghost" size="icon" onClick={logout} aria-label="Sign out">
      <Power className="size-6" />
    </Button>
  );
}
