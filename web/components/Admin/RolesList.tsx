'use client';

import React, { ChangeEvent, useState } from 'react';

import { AddCircle, Cancel, Help, Refresh } from '@mui/icons-material';
import BackspaceOutlined from '@mui/icons-material/BackspaceOutlined';
import {
  Button,
  Container,
  Divider,
  Grid2 as Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useDebounce } from 'use-debounce';

import SnackBarNotification from '@/components/Notifications/SnackBarNotification';
import WidgetTitle from '@/components/common/WidgetTitle';

import { isNumber } from '@/lib/numcheck';
import { mutations, queries } from '@/lib/queries/roles';
import { NewRole, PlayerRoleEvent, PlayerRoleEventType } from '@/lib/types/roles';

const convertDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString();
};

const convertEventToString = (event: PlayerRoleEvent): string => {
  switch (event.type) {
    case PlayerRoleEventType.addRole:
      return `Player ${event.name} with id ${event.auth} was added with role '${event.role}'`;
    case PlayerRoleEventType.updateRole:
      return `Player's ${event.name} (id: ${event.auth}) role was updated to '${event.role}'`;
    case PlayerRoleEventType.removeRole:
      return `Player ${event.name} with id ${event.auth} was removed`;
    default:
      throw new Error(`Unknown event type: ${event.type}`);
  }
};

const convertEventTypeToIcon = (eventType: PlayerRoleEventType): React.ReactNode => {
  switch (eventType) {
    case PlayerRoleEventType.addRole:
      return <AddCircle titleAccess="Player added" htmlColor="green" />;
    case PlayerRoleEventType.updateRole:
      return <Refresh titleAccess="Role updated" htmlColor="blue" />;
    case PlayerRoleEventType.removeRole:
      return <Cancel titleAccess="Player removed" htmlColor="red" />;
    default:
      return <Help />;
  }
};

export default function RoomPlayerList() {
  const [newRole, setNewRole] = useState({ auth: '', name: '', role: 'player' } as NewRole);
  const [page, setPage] = useState(1);
  const [pagingCount, setPagingCount] = useState(10);

  const [eventsPage, setEventsPage] = useState(1);
  const [eventsPagingCount, setEventsPagingCount] = useState(10);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchQueryDebounced] = useDebounce(searchQuery, 300);

  const { data: roles, isPlaceholderData: isRolesPlaceholderData } = queries.getPlayersRoles({
    page,
    pagingCount,
    searchQuery: searchQueryDebounced,
  });
  const { data: roleEvents, isPlaceholderData: isEventsPlaceholderData } = queries.getPlayersRoleEvents({
    page: eventsPage,
    pagingCount: eventsPagingCount,
    searchQuery: searchQueryDebounced,
  });

  const addRoleMutation = mutations.addRole();
  const updateRoleMutation = mutations.updateRole();
  const deleteRoleMutation = mutations.deleteRole();

  const onClickPaging = (shift: number) => {
    setPage((prev) => Math.max(prev + shift, 1));
  };

  const onChangePagingCountInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isNumber(parseInt(e.target.value))) {
      const count: number = parseInt(e.target.value);
      if (count >= 1) {
        setPagingCount(count);
      }
    }
  };

  const onChangeSearchQuery = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
  };

  const onChangeNewRole = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setNewRole({
      ...newRole,
      [name]: value,
    });
  };

  const onClickEventsPaging = (shift: number) => {
    setEventsPage((prev) => Math.max(prev + shift, 1));
  };

  const onChangeEventsPagingCountInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isNumber(parseInt(e.target.value))) {
      const count: number = parseInt(e.target.value);
      if (count >= 1) {
        setEventsPagingCount(count);
      }
    }
  };

  const addRole = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    addRoleMutation.mutate(newRole, {
      onSuccess: () => {
        SnackBarNotification.success(`Player ${newRole.name} (id: ${newRole.auth}) was added.`);
        setNewRole({ auth: '', name: '', role: 'player' });
      },
      onError: (error) => {
        SnackBarNotification.error(error.message);
      },
    });
  };

  const updateRole = async (e: ChangeEvent<HTMLSelectElement>, playerIndex: number) => {
    const { value: role } = e.target;
    const selectedRole = roles![playerIndex];

    updateRoleMutation.mutate(
      { ...selectedRole, role },
      {
        onSuccess: () => {
          SnackBarNotification.success(`Player's ${newRole.name} was updated to '${role}'.`);
        },
        onError: (error) => {
          SnackBarNotification.error(error.message);
        },
      },
    );
  };

  const deleteRole = async (auth: string, name: string) => {
    deleteRoleMutation.mutate(
      { auth, name },
      {
        onSuccess: () => {
          SnackBarNotification.success(`Player ${name} (id: ${auth}) was removed.`);
        },
        onError: (error) => {
          SnackBarNotification.error(error.message);
        },
      },
    );
  };

  return (
    <Container maxWidth="lg" className="py-8">
      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <Paper className="p-4">
            <React.Fragment>
              <WidgetTitle>Player Accounts List</WidgetTitle>
              <Grid container spacing={1} flexDirection="column">
                <form className="w-full" onSubmit={addRole} method="post">
                  <Grid size={{ xs: 12, sm: 12 }} className="space-x-1!">
                    <TextField
                      variant="outlined"
                      margin="normal"
                      required
                      size="small"
                      value={newRole.name}
                      onChange={onChangeNewRole}
                      id="name"
                      label="Name"
                      name="name"
                    />
                    <TextField
                      variant="outlined"
                      margin="normal"
                      required
                      size="small"
                      value={newRole.auth}
                      onChange={onChangeNewRole}
                      id="auth"
                      label="Public id"
                      name="auth"
                      style={{ width: 450 }}
                    />
                    <select
                      value={newRole.role}
                      onChange={onChangeNewRole}
                      id="role"
                      name="role"
                      className="w-24 mt-4 mr-2 p-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="player">player</option>
                      <option value="adm">adm</option>
                      <option value="s-adm">s-adm</option>
                      <option value="co-host">co-host</option>
                      <option value="bad">bad</option>
                    </select>
                    <Button size="small" type="submit" variant="contained" color="primary">
                      Add
                    </Button>
                  </Grid>
                </form>

                <Grid container size={12} spacing={1} flexDirection="row" mb={2}>
                  <Grid size={{ xs: 12, sm: 5 }}>
                    <TextField
                      variant="outlined"
                      margin="normal"
                      size="small"
                      value={searchQuery}
                      onChange={onChangeSearchQuery}
                      id="searchQuery"
                      label="Search query"
                      name="searchQuery"
                      fullWidth
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 5 }}>
                    <TextField
                      variant="outlined"
                      margin="normal"
                      size="small"
                      style={{ width: 150 }}
                      id="pagingCountInput"
                      label="Paging Items Count"
                      name="pagingCountInput"
                      type="number"
                      value={pagingCount}
                      onChange={onChangePagingCountInput}
                      slotProps={{ htmlInput: { min: 1, max: 50 } }}
                    />
                    {/* previous page */}
                    <Button
                      onClick={() => onClickPaging(-1)}
                      size="small"
                      type="button"
                      variant="outlined"
                      color="inherit"
                      className="mt-6!"
                    >
                      &lt;&lt;
                    </Button>
                    {/* next page */}
                    <Button
                      onClick={() => onClickPaging(1)}
                      size="small"
                      type="button"
                      variant="outlined"
                      color="inherit"
                      className="mt-6!"
                    >
                      &gt;&gt;
                    </Button>
                  </Grid>
                </Grid>
              </Grid>

              <Grid container spacing={1}>
                <Grid size={12}>
                  <Typography>Page {page}</Typography>
                </Grid>

                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell width="20%" className="font-bold!">
                        Name
                      </TableCell>
                      <TableCell width="35%" className="font-bold!">
                        Public id
                      </TableCell>
                      <TableCell width="10%" className="font-bold!">
                        Role
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody className={isRolesPlaceholderData ? 'opacity-50' : ''}>
                    {roles &&
                      roles.map((item, idx) => (
                        <TableRow key={item.auth} className="*:border-none!">
                          <TableCell width="20%" component="th" scope="row">
                            {item.name}
                          </TableCell>
                          <TableCell width="35%">{item.auth}</TableCell>
                          <TableCell width="5%">
                            <select
                              value={item.role}
                              onChange={(e) => updateRole(e, idx)}
                              id="role"
                              name="role"
                              className="w-24 p-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="player">player</option>
                              <option value="adm">adm</option>
                              <option value="s-adm">s-adm</option>
                              <option value="co-host">co-host</option>
                              <option value="bad">bad</option>
                            </select>
                          </TableCell>
                          <TableCell align="left">
                            <IconButton
                              name={item.auth}
                              onClick={() => deleteRole(item.auth, item.name)}
                              aria-label="delete"
                            >
                              <BackspaceOutlined fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </Grid>
            </React.Fragment>

            <Divider className="mb-3!" />

            <React.Fragment>
              <WidgetTitle>Event log</WidgetTitle>

              <Grid container spacing={1}>
                <Grid size={12} mb={2}>
                  <TextField
                    variant="outlined"
                    margin="normal"
                    size="small"
                    style={{ width: 150 }}
                    id="eventsPagingCountInput"
                    label="Paging Items Count"
                    name="pagingCountInput"
                    type="number"
                    value={eventsPagingCount}
                    onChange={onChangeEventsPagingCountInput}
                    slotProps={{ htmlInput: { min: 1, max: 50 } }}
                  />
                  {/* previous page */}
                  <Button
                    onClick={() => onClickEventsPaging(-1)}
                    size="small"
                    type="button"
                    variant="outlined"
                    color="inherit"
                    className="mt-6!"
                  >
                    &lt;&lt;
                  </Button>
                  {/* next page */}
                  <Button
                    onClick={() => onClickEventsPaging(1)}
                    size="small"
                    type="button"
                    variant="outlined"
                    color="inherit"
                    className="mt-6!"
                  >
                    &gt;&gt;
                  </Button>
                </Grid>

                <Grid container size={12} spacing={1}>
                  <Typography>Page {eventsPage}</Typography>

                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell width="5%" className="font-bold!">
                          Type
                        </TableCell>
                        <TableCell width="75%" className="font-bold!">
                          Event
                        </TableCell>
                        <TableCell width="20%" className="font-bold!">
                          Date
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody className={isEventsPlaceholderData ? 'opacity-50' : ''}>
                      {roleEvents &&
                        roleEvents.map((event) => (
                          <TableRow key={event.timestamp} className="*:border-none!">
                            <TableCell width="5%" component="th" scope="row">
                              {convertEventTypeToIcon(event.type)}
                            </TableCell>
                            <TableCell width="75%" component="th" scope="row">
                              {convertEventToString(event)}
                            </TableCell>
                            <TableCell width="20%">{convertDate(event.timestamp)}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </Grid>
              </Grid>
            </React.Fragment>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
