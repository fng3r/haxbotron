'use client';

import React from 'react';
import Link from 'next/link';
import { 
  List, ListItemIcon, ListItemText, ListSubheader, Divider, 
  ListItemButton,
} from '@mui/material';
import { 
  Dashboard, SportsEsports, AddCircle,
  SupervisedUserCircle, 
  CancelPresentation,
  Attachment,
  ListAlt,
  PeopleAlt,
  FilterList,
  Send,
  Dns,
  FormatListBulleted
} from '@mui/icons-material';
import { useParams, usePathname } from 'next/navigation';


const classes = {
    'selectedButton': {
        '&.Mui-selected': {
            backgroundColor: '#618fbd',
            '&:hover': {
                backgroundColor: '#3f6a95',
            },
        },
    },
};

export default function SideBar({ open }: { open: boolean }) {
    const pathName = usePathname();
    const { ruid } = useParams<{ ruid?: string }>();

    return (
        <>
            <List>
                <ListItemButton component={Link} href="/admin" selected={pathName === '/admin'} sx={classes.selectedButton}>
                    <ListItemIcon>
                        <Dashboard />
                    </ListItemIcon>
                    <ListItemText primary="Dashboard" />
                </ListItemButton>
            </List>
            <Divider />
            <List>
                <ListSubheader inset>Management</ListSubheader>
                <ListItemButton component={Link} href="/admin/newroom" selected={pathName === '/admin/newroom'} sx={classes.selectedButton}>
                    <ListItemIcon>
                        <AddCircle />
                    </ListItemIcon>
                    <ListItemText primary={open ? "New Room": ""} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }} />
                </ListItemButton>
                <ListItemButton component={Link} href="/admin/roomlist" selected={pathName === '/admin/roomlist'} sx={classes.selectedButton}>
                    <ListItemIcon>
                        <SportsEsports />
                    </ListItemIcon>
                    <ListItemText primary={open ? "Room List" : ""} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }} />
                </ListItemButton>
                <ListItemButton component={Link} href="/admin/roleslist" selected={pathName === '/admin/roleslist'} sx={classes.selectedButton}>
                    <ListItemIcon>
                        <SupervisedUserCircle />
                    </ListItemIcon>
                    <ListItemText primary={open ? "Player Roles" : ""} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }} />
                </ListItemButton>
            </List>
            <Divider />

            {ruid && (
                <List>
                    <ListSubheader inset>{ruid}</ListSubheader>
                    <ListItemButton component={Link} href={`/admin/room/${ruid}`} selected={pathName === `/admin/room/${ruid}`} sx={classes.selectedButton}>
                        <ListItemIcon>
                            <Dns />
                            </ListItemIcon>
                            <ListItemText primary="Information" />
                    </ListItemButton>
                    <ListItemButton component={Link} href={`/admin/room/${ruid}/logs`} selected={pathName === `/admin/room/${ruid}/logs`} sx={classes.selectedButton}>
                        <ListItemIcon>
                            <FormatListBulleted />
                        </ListItemIcon>
                        <ListItemText primary="Log Messages" />
                    </ListItemButton>
                    <ListItemButton component={Link} href={`/admin/room/${ruid}/social`} selected={pathName === `/admin/room/${ruid}/social`} sx={classes.selectedButton}>
                        <ListItemIcon>
                            <Send />
                            </ListItemIcon>
                            <ListItemText primary="Social" />
                    </ListItemButton>
                    <ListItemButton component={Link} href={`/admin/room/${ruid}/filter`} selected={pathName === `/admin/room/${ruid}/filter`} sx={classes.selectedButton}>
                        <ListItemIcon>
                            <FilterList />
                        </ListItemIcon>
                        <ListItemText primary="Text Filter" />
                    </ListItemButton>
                    <ListItemButton component={Link} href={`/admin/room/${ruid}/players`} selected={pathName === `/admin/room/${ruid}/players`} sx={classes.selectedButton}>
                        <ListItemIcon>
                            <PeopleAlt />
                        </ListItemIcon>
                            <ListItemText primary="Player List" />
                    </ListItemButton>
                    <ListItemButton component={Link} href={`/admin/room/${ruid}/bans`} selected={pathName === `/admin/room/${ruid}/bans`} sx={classes.selectedButton}>
                        <ListItemIcon>
                            <ListAlt />
                            </ListItemIcon>
                            <ListItemText primary="Ban List" />
                    </ListItemButton>
                    <ListItemButton component={Link} href={`/admin/room/${ruid}/assets`} selected={pathName === `/admin/room/${ruid}/assets`} sx={classes.selectedButton}>
                        <ListItemIcon>
                            <Attachment />
                            </ListItemIcon>
                            <ListItemText primary="Assets" />
                    </ListItemButton>
                    <ListItemButton component={Link} href={`/admin/room/${ruid}/shutdown`} selected={pathName === `/admin/room/${ruid}/shutdown`} sx={classes.selectedButton}>
                        <ListItemIcon>
                            <CancelPresentation />
                        </ListItemIcon>
                        <ListItemText primary="Close this room" />
                    </ListItemButton>
                </List>
            )}
        </>
    );
}
