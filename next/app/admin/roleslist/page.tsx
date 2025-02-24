'use client';

import React, {ChangeEvent, useEffect, useState} from 'react';
import { 
  Container, Paper, Table, TableBody, 
  TableCell, TableHead, TableRow, Button, Divider, 
  IconButton, MenuItem, TextField, Typography,
  Grid2 as Grid
} from '@mui/material';
import WidgetTitle from '@/components/Admin/WidgetTitle';
import client from '@/lib/client';
import Alert, { AlertColor } from '@/components/common/Alert';
import { isNumber } from '@/lib/numcheck';
import BackspaceOutlined from '@mui/icons-material/BackspaceOutlined';
import { AddCircle, Cancel, Help, Refresh } from '@mui/icons-material';
import { styled, useTheme } from '@mui/material/styles';


interface newRoleFields {
    auth: string
    name: string,
    role: string
}

interface PlayerRole {
    auth: string
    name: string
    role: string
}

enum PlayerRoleEventType {
    addRole = 'addrole',
    removeRole = 'rmrole',
    updateRole = 'updaterole'
}

interface PlayerRoleEvent {
    type: PlayerRoleEventType;
    auth: string;
    name: string;
    role: string;
    timestamp: number;
}

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '& > *': {
        borderBottom: 'unset',
    },
}));

const StyledDivider = styled(Divider)({
    marginBottom: 10
});

const convertDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
}

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
}

const convertEventTypeToIcon = (eventType: PlayerRoleEventType): any => {
    switch (eventType) {
        case PlayerRoleEventType.addRole:
            return <AddCircle titleAccess='Player added' htmlColor='green' />;
        case PlayerRoleEventType.updateRole:
            return <Refresh titleAccess='Role updated' htmlColor='blue' />;
        case PlayerRoleEventType.removeRole:
            return <Cancel titleAccess='Player removed' htmlColor='red' />;
        default:
            return <Help />
    }
}

const useStyles = (theme: any) => ({
    container: {
        paddingTop: theme.spacing(4),
        paddingBottom: theme.spacing(4),
    },
    paper: {
        padding: theme.spacing(2),
        display: 'flex',
        overflow: 'auto',
        flexDirection: 'column',
    },
    fullHeight: {
        height: '100%',
    },
    form: {
        width: '100%', // Fix IE 11 issue.
        marginTop: theme.spacing(1),
    },
    submit: {
        margin: theme.spacing(3, 0, 2),
    },
});

export default function RoomPlayerList() {
    const theme = useTheme();
    const classes = useStyles(theme);

    const [flashMessage, setFlashMessage] = useState('');
    const [alertStatus, setAlertStatus] = useState("success" as AlertColor);

    const [pagingOrder, setPagingOrder] = useState(1);
    const [pagingCount, setPagingCount] = useState(10);
    const [pagingCountInput, setPagingCountInput] = useState('10');
    const [searchQuery, setSearchQuery] = useState('');

    const [playerRolesList, setPlayerRolesList] = useState([] as PlayerRole[]);
    const [newRole, setNewRole] = useState({ auth: '', name: '', role: 'player' } as newRoleFields);

    const [eventsPagingOrder, setEventsPagingOrder] = useState(1);
    const [eventsPagingCount, setEventsPagingCount] = useState(10);
    const [eventsPagingCountInput, setEventsPagingCountInput] = useState('10');
    const [playerRolesEventsList, setPlayerRolesEventsList] = useState([] as PlayerRoleEvent[]);

    const showAlert = (status: AlertColor, message: string, hideAfter: number | null = 3000) => {
        setFlashMessage(message);
        setAlertStatus(status);
        if (hideAfter !== null) {
            setTimeout(() => {
                setFlashMessage('');
            }, hideAfter);
        }
    }

    const onClickPaging = (move: number) => {
        if (pagingOrder + move >= 1) {
            setPagingOrder(pagingOrder + move);
            getPlayersRoles(pagingOrder + move);
        }
    }

    const onChangePagingCountInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPagingCountInput(e.target.value);

        if (isNumber(parseInt(e.target.value))) {
            const count: number = parseInt(e.target.value);
            if (count >= 1) {
                setPagingCount(count);
                getPlayersRoles(pagingOrder, searchQuery, count);
            }
        }
    }

    const onChangeSearchQuery = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);

        getPlayersRoles(pagingOrder, query);
        getPlayersRolesEvents(eventsPagingOrder, query);
    }

    const onChangeNewRole = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        console.log('onChangeNewRole');

        setNewRole({
            ...newRole,
            [name]: value
        });
    }

    const getPlayersRoles = async (page: number, searchQuery: string = '', count: number | null = null) => {
        count ??= pagingCount;
        const index: number = (page - 1) * count;
        try {
            const result = await client.get(`/api/v1/roleslist?searchQuery=${searchQuery}&start=${index}&count=${count}`);
            if (result.status === 200) {
                const playerRoles: PlayerRole[] = result.data;

                setPlayerRolesList(playerRoles);
            }
        } catch (e: any) {
            showAlert('error', 'Failed to load roles list.', null);
        }
    }

    const onClickEventsPaging = (move: number) => {
        if (eventsPagingOrder + move >= 1) {
            setEventsPagingOrder(eventsPagingOrder + move);
            getPlayersRolesEvents(eventsPagingOrder + move);
        }
    }

    const onChangeEventsPagingCountInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEventsPagingCountInput(e.target.value);

        if (isNumber(parseInt(e.target.value))) {
            const count: number = parseInt(e.target.value);
            if (count >= 1) {
                setEventsPagingCount(count);
                getPlayersRolesEvents(eventsPagingOrder, searchQuery, count);
            }
        }
    }

    const getPlayersRolesEvents = async (page: number, searchQuery: string = '', pagingCount: number | null = null) => {
        pagingCount = pagingCount ?? eventsPagingCount;
        const index: number = (page - 1) * pagingCount;
        try {
            const result = await client.get(`/api/v1/roleslist/events?searchQuery=${searchQuery}&start=${index}&count=${pagingCount}`);
            if (result.status === 200) {
                const playerRoles: PlayerRoleEvent[] = result.data;

                setPlayerRolesEventsList(playerRoles);
            }
        } catch (e: any) {
            showAlert('error', 'Failed to load roles events list.', null);
        }
    }

    const addRole = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        try {
            const result = await client.post(
                `/api/v1/roleslist/${newRole.auth}`, {
                    name: newRole.name, role: newRole.role
                });
            if (result.status === 204) {
                setNewRole({ auth: '', name: '', role: 'player' });
                showAlert('success', 'Successfully added new role.');
            }
        } catch (error: any) {
            if (error.response.status === 409) {
                showAlert('error', `Player '${newRole.name}' with public id '${newRole.auth}' already added`);
            } else {
                showAlert('error', 'Failed to add new role.');
            }
        }

        getPlayersRoles(pagingOrder, searchQuery);
        getPlayersRolesEvents(eventsPagingOrder, searchQuery);
    }

    const updateRole = async (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, playerIndex: number) => {
        const { value: role } = e.target;
        const selectedRole = playerRolesList[playerIndex];
        try {
            const result = await client.put(
                `/api/v1/roleslist/${selectedRole.auth}`, {
                    name: selectedRole.name, role: role
                });
            if (result.status === 204) {
                showAlert('success', `Successfully updated '${selectedRole.name}' role.`);
                setPlayerRolesList(playerRolesList.map(
                    (playerRole: PlayerRole, i: number) => {
                        if (i === playerIndex)
                            return {...playerRolesList[playerIndex], role: role}

                        return playerRole
                    })
                );
            }

            getPlayersRolesEvents(eventsPagingOrder, searchQuery);
        } catch {
            showAlert('error', 'Failed to update player role.');
        }
    }

    const deleteRole = async (auth: string, name: string) => {
        try {
            const result = await client.delete(`/api/v1/roleslist/${auth}?name=${name}`);
            if (result.status === 204) {
                showAlert('success', 'Successfully deleted role.');
            }
        } catch {
            showAlert('error', 'Failed to delete player role.');
        }

        getPlayersRoles(pagingOrder, searchQuery);
        getPlayersRolesEvents(eventsPagingOrder, searchQuery);
    }

    useEffect(() => {
        getPlayersRoles(1);
        getPlayersRolesEvents(1);
    }, []);

    return (
        <Container maxWidth="lg" sx={classes.container}>
            <Grid container spacing={3}>
                <Grid size={{xs: 12}}>
                    <Paper sx={classes.paper}>
                        <React.Fragment>
                            {flashMessage && <Alert severity={alertStatus}>{flashMessage}</Alert>}
                            <WidgetTitle>Player Accounts List</WidgetTitle>
                            <Grid container spacing={1} flexDirection="column">
                                <form style={classes.form} onSubmit={addRole} method="post">
                                    <Grid size={{xs: 12, sm: 12}}>
                                        <TextField
                                            variant="outlined" margin="normal" required size="small" value={newRole.name} onChange={onChangeNewRole}
                                            id="name" label="Name" name="name"
                                        />
                                        <TextField
                                            variant="outlined" margin="normal" required size="small" value={newRole.auth} onChange={onChangeNewRole}
                                            id="auth" label="Public id" name="auth" style={{width: 450}}
                                        />
                                        <TextField
                                            variant="outlined" margin="normal" required size="small" value={newRole.role} onChange={onChangeNewRole}
                                            id="role" label="Role" name="role" select>
                                            <MenuItem value="player">player</MenuItem>
                                            <MenuItem value="adm">adm</MenuItem>
                                            <MenuItem value="s-adm">s-adm</MenuItem>
                                            <MenuItem value="co-host">co-host</MenuItem>
                                            <MenuItem value="bad">bad</MenuItem>
                                        </TextField>
                                        <Button size="small" type="submit" variant="contained" color="primary" sx={classes.submit}>Add</Button>
                                    </Grid>
                                </form>

                                <Grid container size={12} spacing={1} flexDirection="row">
                                    <Grid size={{xs: 12, sm: 5}}>
                                        <TextField
                                            variant="outlined" margin="normal" size="small" value={searchQuery} onChange={onChangeSearchQuery}
                                            id="searchQuery" label="Search query" name="searchQuery" fullWidth
                                        />
                                    </Grid>

                                    <Grid size={{xs: 12, sm: 5}}>
                                        <TextField
                                            variant="outlined"
                                            margin="normal"
                                            size="small"
                                            style={{width: 150}}
                                            id="pagingCountInput"
                                            label="Paging Items Count"
                                            name="pagingCountInput"
                                            type="number"
                                            value={pagingCountInput}
                                            onChange={onChangePagingCountInput}
                                            slotProps={{htmlInput: {min: 1, max: 50}}}
                                        />
                                        {/* previous page */}
                                        <Button onClick={() => onClickPaging(-1)} size="small" type="button" variant="outlined" color="inherit" sx={classes.submit}>&lt;&lt;</Button>
                                        {/* next page */}
                                        <Button onClick={() => onClickPaging(1)} size="small" type="button" variant="outlined" color="inherit" sx={classes.submit}>&gt;&gt;</Button>
                                    </Grid>
                                </Grid>
                            </Grid>

                            <Grid container spacing={1}>
                                <Grid size={12}>
                                    <Typography>Page {pagingOrder}</Typography>
                                </Grid>

                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell width="20%">Name</TableCell>
                                            <TableCell width="35%">Public id</TableCell>
                                            <TableCell width="10%">Role</TableCell>
                                            <TableCell></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {playerRolesList && playerRolesList.map((item, idx) => (
                                            <StyledTableRow key={item.auth}>
                                                <TableCell width="20%" component="th" scope="row">{item.name}</TableCell>
                                                <TableCell width="35%">{item.auth}</TableCell>
                                                <TableCell width="5%">
                                                    <TextField variant="outlined" margin="normal" required size="small" value={item.role} onChange={e => updateRole(e, idx)}
                                                                id="role" name="role" select>
                                                        <MenuItem value="player">player</MenuItem>
                                                        <MenuItem value="adm">adm</MenuItem>
                                                        <MenuItem value="s-adm">s-adm</MenuItem>
                                                        <MenuItem value="co-host">co-host</MenuItem>
                                                        <MenuItem value="bad">bad</MenuItem>
                                                    </TextField>
                                                </TableCell>
                                                <TableCell align="left">
                                                    <IconButton name={item.auth} onClick={() => deleteRole(item.auth, item.name)} aria-label="delete">
                                                        <BackspaceOutlined fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
                                            </StyledTableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Grid>
                        </React.Fragment>

                        <StyledDivider />

                        <React.Fragment>
                            <WidgetTitle>Event log</WidgetTitle>

                            <Grid container spacing={1}>
                                <Grid size={{xs: 8, sm: 4}}>
                                    <TextField
                                        variant="outlined"
                                        margin="normal"
                                        size="small"
                                        style={{width: 150}}
                                        id="eventsPagingCountInput"
                                        label="Paging Items Count"
                                        name="pagingCountInput"
                                        type="number"
                                        value={eventsPagingCountInput}
                                        onChange={onChangeEventsPagingCountInput}
                                        slotProps={{htmlInput: {min: 1, max: 50}}}
                                    />
                                    {/* previous page */}
                                    <Button onClick={() => onClickEventsPaging(-1)} size="small" type="button" variant="outlined" color="inherit" sx={classes.submit}>&lt;&lt;</Button>
                                    {/* next page */}
                                    <Button onClick={() => onClickEventsPaging(1)} size="small" type="button" variant="outlined" color="inherit" sx={classes.submit}>&gt;&gt;</Button>

                                    <Typography>Page {eventsPagingOrder}</Typography>

                                </Grid>

                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell width="5%">Type</TableCell>
                                            <TableCell width="75%">Event</TableCell>
                                            <TableCell width="20%">Date</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {playerRolesEventsList && playerRolesEventsList.map((event) => (
                                            <StyledTableRow key={event.timestamp}>
                                                <TableCell width="5%" component="th" scope="row">{convertEventTypeToIcon(event.type)}</TableCell>
                                                <TableCell width="75%" component="th" scope="row">{convertEventToString(event)}</TableCell>
                                                <TableCell width="20%">{convertDate(event.timestamp)}</TableCell>
                                            </StyledTableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Grid>
                        </React.Fragment>

                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
}
