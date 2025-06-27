'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';

import {
  Ban,
  Gamepad2,
  LayoutDashboard,
  List,
  Paperclip,
  PlusCircle,
  Server,
  Share2,
  User,
  Users2,
  XOctagon,
} from 'lucide-react';

import { Separator } from '@/components/ui/separator';

export default function NavSideBar({ open }: { open: boolean }) {
  const { ruid } = useParams<{ ruid?: string }>();

  return (
    <nav className="flex flex-col gap-2 p-2">
      <NavItem href="/admin" label="Dashboard" Icon={LayoutDashboard} open={open} />
      <Separator />
      {open && <div className="text-sm font-semibold text-muted-foreground px-4 py-2">Management</div>}
      <NavItem href="/admin/newroom" label="New Room" Icon={PlusCircle} open={open} />
      <NavItem href="/admin/roomlist" label="Room List" Icon={Gamepad2} open={open} />
      <NavItem href="/admin/roleslist" label="Player Roles" Icon={Users2} open={open} />
      <Separator />
      {ruid && (
        <>
          {open && <div className="text-sm font-semibold text-muted-foreground px-4 py-2">{ruid}</div>}
          <NavItem href={`/admin/room/${ruid}`} label="Information" Icon={Server} open={open} />
          <NavItem href={`/admin/room/${ruid}/logs`} label="Log Messages" Icon={List} open={open} />
          <NavItem href={`/admin/room/${ruid}/social`} label="Social" Icon={Share2} open={open} />
          <NavItem href={`/admin/room/${ruid}/players`} label="Player List" Icon={User} open={open} />
          <NavItem href={`/admin/room/${ruid}/bans`} label="Ban List" Icon={Ban} open={open} />
          <NavItem href={`/admin/room/${ruid}/assets`} label="Assets" Icon={Paperclip} open={open} />
          <NavItem href={`/admin/room/${ruid}/shutdown`} label="Close this room" Icon={XOctagon} open={open} />
        </>
      )}
    </nav>
  );
}

function NavItem({
  href,
  label,
  Icon,
  open,
}: {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  open: boolean;
}) {
  const pathName = usePathname();
  const selected = pathName === href;
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-md ${open ? 'px-3' : 'px-2'} py-1 transition-colors ${
        selected ? 'bg-blue-600 text-white' : 'hover:bg-accent hover:text-accent-foreground'
      }`}
    >
      <div className="flex items-center justify-center w-10 h-10 flex-shrink-0">
        <Icon className="w-6 h-6 flex-shrink-0" />
      </div>
      <span
        className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
          open ? 'w-auto opacity-100' : 'w-0 opacity-0'
        }`}
      >
        {label}
      </span>
    </Link>
  );
}
