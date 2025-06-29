import { LogOut } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { logout } from '@/app/actions/auth';

export default function LogoutButton() {
  return (
    <Button variant="outline" size="icon" onClick={logout} aria-label="Sign out">
      <LogOut />
    </Button>
  );
}
