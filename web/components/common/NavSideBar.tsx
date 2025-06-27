'use client';

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

export default function NavSideBar() {
  const { ruid } = useParams<{ ruid?: string }>();

  return (
    <>
      <List>
        <NavItem href="/admin" label="Dashboard" Icon={Dashboard} />
      </List>

      <Divider />

      <List>
        <ListSubheader inset>Management</ListSubheader>

        <NavItem href="/admin/newroom" label="New Room" Icon={AddCircle} />
        <NavItem href="/admin/roomlist" label="Room List" Icon={SportsEsports} />
        <NavItem href="/admin/roleslist" label="Player Roles" Icon={SupervisedUserCircle} />
      </List>

      <Divider />

      {ruid && (
        <List>
          <ListSubheader inset>{ruid}</ListSubheader>

          <NavItem href={`/admin/room/${ruid}`} label="Information" Icon={Dns} />
          <NavItem href={`/admin/room/${ruid}/logs`} label="Log Messages" Icon={FormatListBulleted} />
          <NavItem href={`/admin/room/${ruid}/social`} label="Social" Icon={Send} />
          <NavItem href={`/admin/room/${ruid}/players`} label="Player List" Icon={PeopleAlt} />
          <NavItem href={`/admin/room/${ruid}/bans`} label="Ban List" Icon={ListAlt} />
          <NavItem href={`/admin/room/${ruid}/assets`} label="Assets" Icon={Attachment} />
          <NavItem href={`/admin/room/${ruid}/shutdown`} label="Close this room" Icon={CancelPresentation} />
        </List>
      )}
    </>
  );
}

function NavItem({ href, label, Icon }: { href: string; label: string; Icon: React.ElementType }) {
  const pathName = usePathname();

  return (
    <ListItemButton component={Link} href={href} selected={pathName === href} sx={classes.selectedButton}>
      <ListItemIcon>
        <Icon />
      </ListItemIcon>
      <ListItemText primary={label} />
    </ListItemButton>
  );
}
