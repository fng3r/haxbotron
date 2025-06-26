'use client';

import { useState } from 'react';

import { ChevronLeft as ChevronLeftIcon, HelpOutline as HelpOutlineIcon, Menu as MenuIcon } from '@mui/icons-material';
import { Badge, Divider, Drawer, IconButton, Link, AppBar as MuiAppBar, Toolbar, Typography } from '@mui/material';

import LogoutButton from '@/components/common/LogoutButton';
import NavSideBar from '@/components/common/NavSideBar';

export default function AppBar() {
  const [open, setOpen] = useState(true);

  const handleDrawerOpen = () => {
    setOpen(true);
  };
  const handleDrawerClose = () => {
    setOpen(false);
  };

  return (
    <>
      <MuiAppBar
        position="relative"
        className={
          open
            ? 'ml-[240px]! w-[calc(100%-240px)]! transition-all! duration-300 ease-in-out'
            : 'z-1201 transition-all! duration-300 ease-in-out'
        }
      >
        <Toolbar sx={{ paddingRight: '24px' }}>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            className={open ? 'hidden!' : 'mr-10! w-8!'}
          >
            <MenuIcon />
          </IconButton>

          <div className="m-2 flex-grow p-2"></div>
          <Typography component="h1" variant="h6" color="inherit" noWrap className="m-2 w-full grow p-2 mt-10 mb-2">
            Haxbotron Administrative Dashboard
          </Typography>

          <IconButton color="inherit">
            <Badge color="secondary">
              <HelpOutlineIcon>
                <Link href="https://github.com/dapucita/haxbotron/wiki" target="_blank" />
              </HelpOutlineIcon>
            </Badge>
          </IconButton>

          <LogoutButton />
        </Toolbar>
      </MuiAppBar>

      <aside>
        <Drawer
          PaperProps={{ className: 'overflow-hidden whitespace-nowrap' }}
          variant="permanent"
          open={open}
          className="overflow-hidden"
        >
          <div
            className={
              open
                ? `transition-width w-[240px] duration-300 ease-in-out`
                : 'transition-width w-[58px] duration-300 ease-in-out'
            }
          >
            <div className="flex h-16 items-center justify-end p-2">
              <IconButton onClick={handleDrawerClose}>
                <ChevronLeftIcon />
              </IconButton>
            </div>
            <Divider />
            <NavSideBar />
          </div>
        </Drawer>
      </aside>
    </>
  );
}
