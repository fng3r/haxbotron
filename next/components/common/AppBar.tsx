'use client';

import SideBar from "@/components/Admin/SideBar";
import { AppBar as MuiAppBar, Badge, Divider, Drawer, IconButton, styled, Toolbar, Typography, useTheme, Theme } from "@mui/material";
import {
    HelpOutline as HelpOutlineIcon,
    Notifications as NotificationsIcon,
    Settings as SettingsIcon,
    Menu as MenuIcon,
    ChevronLeft as ChevronLeftIcon
} from "@mui/icons-material";
import { useState } from "react";
import LogoutButton from "./LogoutButton";

const drawerWidth = 240;

const useStyles = (theme: Theme) => ({
    toolbarIcon: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '0 8px',
        height: 64,
        ...theme.mixins.toolbar,
    },
    menuButton: {
        width: theme.spacing(4),
        marginRight: theme.spacing(4),
    },
    menuButtonHidden: {
        display: 'none',
    },
    title: {
        flexGrow: 1,
    },
    drawerPaper: {
        width: drawerWidth,
        transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
        }),
    },
    drawerPaperClose: {
        transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
        width: theme.spacing(7),
    },
    paper: {
        padding: theme.spacing(2),
        display: 'flex',
        overflow: 'auto',
        flexDirection: 'column',
    },
    fixedHeight: {
        height: 240,
    },
    halfHeight: {
        height: '50%',
    },
});

const StyledAppBar = styled(MuiAppBar, {
    shouldForwardProp: (prop) => prop !== 'open',
  })<{ open?: boolean }>(({ theme, open }) => ({
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    ...(open && {
      marginLeft: drawerWidth,
      width: `calc(100% - ${drawerWidth}px)`,
      transition: theme.transitions.create(['width', 'margin'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
    }),
  }));

export default function AppBar() {
    const [open, setOpen] = useState(true);
    const theme = useTheme();
    const styleClass = useStyles(theme);

    const handleDrawerOpen = () => {
        setOpen(true);
      };
      const handleDrawerClose = () => {
        setOpen(false);
      };

    return (
      <>
        <StyledAppBar position="relative" open={open}>
            <Toolbar sx={{ paddingRight: '24px' }}>
                <IconButton
                    edge="start"
                    color="inherit"
                    aria-label="open drawer"
                    onClick={handleDrawerOpen}
                    sx={open ? styleClass.menuButtonHidden : styleClass.menuButton}
                >
                    <MenuIcon />
                </IconButton>

                <Typography component="h1" variant="h6" color="inherit" noWrap sx={styleClass.title}>
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
        </StyledAppBar>

        <aside>
            <Drawer variant="permanent" open={open}>
                <div style={open ? styleClass.drawerPaper : styleClass.drawerPaperClose}>
                    <div style={styleClass.toolbarIcon}>
                        <IconButton onClick={handleDrawerClose}>
                            <ChevronLeftIcon />
                        </IconButton>
                    </div>
                    <Divider />
                    <SideBar open={open} />
                </div>
            </Drawer>
        </aside>

      </>
    );
}

