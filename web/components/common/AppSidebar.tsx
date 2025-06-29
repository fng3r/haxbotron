'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';

import LogoutButton from './LogoutButton';
import {
  Ban,
  Gamepad2,
  LayoutDashboard,
  List,
  PlusCircle,
  Server,
  Share2,
  Shirt,
  User,
  Users2,
  XOctagon,
} from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';

export default function AppSidebar() {
  const { ruid } = useParams<{ ruid?: string }>();
  const pathName = usePathname();
  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathName === '/admin'}>
                  <Link href="/admin">
                    <LayoutDashboard className="size-5" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathName === '/admin/newroom'}>
                  <Link href="/admin/newroom">
                    <PlusCircle className="size-5" />
                    <span>New Room</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathName === '/admin/roomlist'}>
                  <Link href="/admin/roomlist">
                    <Gamepad2 className="size-5" />
                    <span>Room List</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathName === '/admin/roleslist'}>
                  <Link href="/admin/roleslist">
                    <Users2 className="size-5" />
                    <span>Player Roles</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
        {ruid && (
          <SidebarGroup>
            <SidebarGroupLabel>{ruid}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathName === `/admin/room/${ruid}`}>
                    <Link href={`/admin/room/${ruid}`}>
                      <Server className="size-5" />
                      <span>Information</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathName === `/admin/room/${ruid}/logs`}>
                    <Link href={`/admin/room/${ruid}/logs`}>
                      <List className="size-5" />
                      <span>Log Messages</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathName === `/admin/room/${ruid}/social`}>
                    <Link href={`/admin/room/${ruid}/social`}>
                      <Share2 className="size-5" />
                      <span>Social</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathName === `/admin/room/${ruid}/players`}>
                    <Link href={`/admin/room/${ruid}/players`}>
                      <User className="size-5" />
                      <span>Player List</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathName === `/admin/room/${ruid}/bans`}>
                    <Link href={`/admin/room/${ruid}/bans`}>
                      <Ban className="size-5" />
                      <span>Ban List</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathName === `/admin/room/${ruid}/kits`}>
                    <Link href={`/admin/room/${ruid}/kits`}>
                      <Shirt className="size-5" />
                      <span>Kits</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathName === `/admin/room/${ruid}/shutdown`}>
                    <Link href={`/admin/room/${ruid}/shutdown`}>
                      <XOctagon className="size-5" />
                      <span>Close this room</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="px-0">
        <SidebarSeparator />
        <SidebarGroup className="py-0">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  className="group-data-[collapsible=icon]:p-0! hover:bg-transparent active:bg-transparent"
                >
                  <div className="flex items-center justify-between gap-3">
                    <>
                      <Avatar>
                        <AvatarFallback>HA</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">haxbotronadmin</div>
                      </div>
                    </>
                    <LogoutButton />
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}
