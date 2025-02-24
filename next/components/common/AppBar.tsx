'use client';

import SideBar from "@/components/common/SideBar";
import {
    AppBar as MuiAppBar, Badge, Divider, Drawer,
    IconButton, Toolbar, Typography
} from "@mui/material";
import {
    HelpOutline as HelpOutlineIcon,
    Notifications as NotificationsIcon,
    Settings as SettingsIcon,
    Menu as MenuIcon,
    ChevronLeft as ChevronLeftIcon
} from "@mui/icons-material";
import { useState } from "react";
import LogoutButton from "./LogoutButton";


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
        <MuiAppBar position="relative" className={open ? "ml-[240px]! w-[calc(100%-240px)]! transition-all! duration-300 ease-in-out" : "z-9999 transition-all! duration-300 ease-in-out"}>
            <Toolbar sx={{ paddingRight: '24px' }}>
                <IconButton
                    edge="start"
                    color="inherit"
                    aria-label="open drawer"
                    onClick={handleDrawerOpen}
                    className={open ? "hidden!" : "w-8! mr-10!"}
                >
                    <MenuIcon />
                </IconButton>

                <Typography component="h1" variant="h6" color="inherit" noWrap className="grow">
                    Haxbotron Administrative Dashboard
                </Typography>

                <IconButton color="inherit">
                    <Badge color="secondary">
                        <HelpOutlineIcon onClick={() => window.open('https://github.com/dapucita/haxbotron/wiki', '_blank')} />
                    </Badge>
                </IconButton>

                <IconButton color="inherit">
                    <Badge color="secondary">
                        <NotificationsIcon />
                    </Badge>
                </IconButton>

                <IconButton color="inherit">
                    <Badge color="secondary">
                        <SettingsIcon />
                    </Badge>
                </IconButton>

                <LogoutButton />
            </Toolbar>
        </MuiAppBar>

        <aside>
            <Drawer PaperProps={{ className: "overflow-hidden whitespace-nowrap" }} variant="permanent" open={open} className="overflow-hidden">
                <div className={open ? `w-[240px] transition-width duration-300 ease-in-out` : "w-[64px] transition-width duration-300 ease-in-out"}>
                    <div className="flex items-center justify-end p-2 h-16">
                        <IconButton onClick={handleDrawerClose}>
                            <ChevronLeftIcon />
                        </IconButton>
                    </div>
                    <Divider />
                    <SideBar />
                </div>
            </Drawer>
        </aside>

      </>
    );
}

