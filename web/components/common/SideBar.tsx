'use client';

import React from 'react';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';

import {
  AddCircle,
  Attachment,
  CancelPresentation,
  Dashboard,
  Dns,
  FormatListBulleted,
  ListAlt,
  PeopleAlt,
  Send,
  SportsEsports,
  SupervisedUserCircle,
} from '@mui/icons-material';
import { Divider, List, ListItemButton, ListItemIcon, ListItemText, ListSubheader } from '@mui/material';

const classes = {
  selectedButton: {
    '&.Mui-selected': {
      backgroundColor: '#618fbd',
      '&:hover': {
        backgroundColor: '#3f6a95',
      },
    },
  },
};

export default function SideBar() {
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
        <ListItemButton
          component={Link}
          href="/admin/newroom"
          selected={pathName === '/admin/newroom'}
          sx={classes.selectedButton}
        >
          <ListItemIcon>
            <AddCircle />
          </ListItemIcon>
          <ListItemText primary="New Room" />
        </ListItemButton>
        <ListItemButton
          component={Link}
          href="/admin/roomlist"
          selected={pathName === '/admin/roomlist'}
          sx={classes.selectedButton}
        >
          <ListItemIcon>
            <SportsEsports />
          </ListItemIcon>
          <ListItemText primary="Room List" />
        </ListItemButton>
        <ListItemButton
          component={Link}
          href="/admin/roleslist"
          selected={pathName === '/admin/roleslist'}
          sx={classes.selectedButton}
        >
          <ListItemIcon>
            <SupervisedUserCircle />
          </ListItemIcon>
          <ListItemText primary="Player Roles" />
        </ListItemButton>
      </List>
      <Divider />

      {ruid && (
        <List>
          <ListSubheader inset>{ruid}</ListSubheader>

          <ListItemButton
            component={Link}
            href={`/admin/room/${ruid}`}
            selected={pathName === `/admin/room/${ruid}`}
            sx={classes.selectedButton}
          >
            <ListItemIcon>
              <Dns />
            </ListItemIcon>
            <ListItemText primary="Information" />
          </ListItemButton>

          <ListItemButton
            component={Link}
            href={`/admin/room/${ruid}/logs`}
            selected={pathName === `/admin/room/${ruid}/logs`}
            sx={classes.selectedButton}
          >
            <ListItemIcon>
              <FormatListBulleted />
            </ListItemIcon>
            <ListItemText primary="Log Messages" />
          </ListItemButton>

          <ListItemButton
            component={Link}
            href={`/admin/room/${ruid}/social`}
            selected={pathName === `/admin/room/${ruid}/social`}
            sx={classes.selectedButton}
          >
            <ListItemIcon>
              <Send />
            </ListItemIcon>
            <ListItemText primary="Social" />
          </ListItemButton>

          <ListItemButton
            component={Link}
            href={`/admin/room/${ruid}/players`}
            selected={pathName === `/admin/room/${ruid}/players`}
            sx={classes.selectedButton}
          >
            <ListItemIcon>
              <PeopleAlt />
            </ListItemIcon>
            <ListItemText primary="Player List" />
          </ListItemButton>

          <ListItemButton
            component={Link}
            href={`/admin/room/${ruid}/bans`}
            selected={pathName === `/admin/room/${ruid}/bans`}
            sx={classes.selectedButton}
          >
            <ListItemIcon>
              <ListAlt />
            </ListItemIcon>
            <ListItemText primary="Ban List" />
          </ListItemButton>

          <ListItemButton
            component={Link}
            href={`/admin/room/${ruid}/assets`}
            selected={pathName === `/admin/room/${ruid}/assets`}
            sx={classes.selectedButton}
          >
            <ListItemIcon>
              <Attachment />
            </ListItemIcon>
            <ListItemText primary="Assets" />
          </ListItemButton>

          <ListItemButton
            component={Link}
            href={`/admin/room/${ruid}/shutdown`}
            selected={pathName === `/admin/room/${ruid}/shutdown`}
            sx={classes.selectedButton}
          >
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
