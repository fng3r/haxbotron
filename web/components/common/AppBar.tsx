'use client';

import { useState } from 'react';

import { ChevronLeft, Menu } from 'lucide-react';

import LogoutButton from '@/components/common/LogoutButton';
import NavSideBar from '@/components/common/NavSideBar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function AppBar() {
  const [drawerOpen, setDrawerOpen] = useState(true);

  const handleDrawerOpen = () => {
    setDrawerOpen(true);
  };
  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  return (
    <>
      {/* Main App Bar */}
      <header
        className={`relative z-50 flex h-16 items-center bg-blue-700 px-5 text-primary-foreground shadow-sm transition-all duration-300 ease-in-out ${
          drawerOpen ? 'ml-[240px] w-[calc(100%-240px)]' : 'w-full'
        }`}
      >
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDrawerOpen}
              className={`${drawerOpen ? 'hidden' : 'mr-4'}`}
            >
              <Menu className="size-5" />
            </Button>

            <h1 className="text-xl font-semibold">Haxbotron Administrative Dashboard</h1>
          </div>

          <LogoutButton />
        </div>
      </header>

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-full">
        <div
          className={`h-full bg-background border-r transition-all duration-300 ease-in-out overflow-hidden ${
            drawerOpen ? 'w-[240px]' : 'w-[72px]'
          }`}
        >
          <div className="flex h-16 items-center justify-end p-2">
            <Button variant="ghost" size="icon" onClick={handleDrawerClose} className="size-10">
              <ChevronLeft className="size-5" />
            </Button>
          </div>
          <Separator />
          <NavSideBar open={drawerOpen} />
        </div>
      </aside>
    </>
  );
}
