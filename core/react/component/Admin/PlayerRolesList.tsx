import React, {ChangeEvent, useEffect, useState} from 'react';
import clsx from 'clsx';
import Box from '@material-ui/core/Box';
import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Copyright from '../common/Footer.Copyright';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Title from './common/Widget.Title';
import client from '../../lib/client';
import {Button, Divider, IconButton, makeStyles, MenuItem, Select, TextField, Typography} from '@material-ui/core';
import Alert, { AlertColor } from '../common/Alert';
import { isNumber } from '../../lib/numcheck';
import BackspaceIcon from "@material-ui/icons/Backspace";
import { AddCircle, Cancel, Help, QuestionAnswer, Refresh, SvgIconComponent } from '@material-ui/icons';


interface styleClass {
    styleClass: any
}

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

const useRowStyles = makeStyles({
    root: {
        '& > *': {
            borderBottom: 'unset',
        },
    },
});

const useDividerStyle = makeStyles({
    root: {
        marginBottom: 10
    }
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

export default function RoomPlayerList({ styleClass }: styleClass) {
    const classes = styleClass;
    const rowStyles = useRowStyles();
    const titleStyles = useDividerStyle();

    const fixedHeightPaper = clsx(classes.paper, classes.fullHeight);

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

    const getPlayersRoles = async (page: number, searchQuery: string = '') => {
        const index: number = (page - 1) * pagingCount;
        try {
            const result = await client.get(`/api/v1/roleslist?searchQuery=${searchQuery}&start=${index}&count=${pagingCount}`);
            if (result.status === 200) {
                const playerRoles: PlayerRole[] = result.data;

                setPlayerRolesList(playerRoles);
            }
        } catch (e) {
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
            }
        }

        getPlayersRolesEvents(eventsPagingOrder, searchQuery);
    }

    const getPlayersRolesEvents = async (page: number, searchQuery: string = '') => {
        const index: number = (page - 1) * eventsPagingCount;
        try {
            const result = await client.get(`/api/v1/roleslist/events?searchQuery=${searchQuery}&start=${index}&count=${eventsPagingCount}`);
            if (result.status === 200) {
                const playerRoles: PlayerRoleEvent[] = result.data;

                setPlayerRolesEventsList(playerRoles);
            }
        } catch (e) {
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
        } catch (error) {
            //error.response.status
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
        } catch (error) {
            showAlert('error', 'Failed to update player role.');
        }
    }

    const deleteRole = async (auth: string, name: string) => {
        try {
            const result = await client.delete(`/api/v1/roleslist/${auth}?name=${name}`);
            if (result.status === 204) {
                showAlert('success', 'Successfully deleted role.');
            }
        } catch (error) {
            showAlert('error', 'Failed to delete player role.');
        }

        getPlayersRoles(pagingOrder, searchQuery);
        getPlayersRolesEvents(eventsPagingOrder, searchQuery);
    }

    useEffect(() => {
        getPlayersRoles(1);
        getPlayersRolesEvents(1);

        return (() => {
            setPlayerRolesList([]);
            setPlayerRolesEventsList([]);
        });
    }, []);

    return (
        <Container maxWidth="lg" className={classes.container}>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Paper className={fixedHeightPaper}>
                        <React.Fragment>
                            {flashMessage && <Alert severity={alertStatus}>{flashMessage}</Alert>}
                            <Title>Player Accounts List</Title>
                            <Grid container spacing={2}>
                                <form className={classes.form} onSubmit={addRole} method="post">
                                    <Grid item xs={12} sm={12}>
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
                                        <Button size="small" type="submit" variant="contained" color="primary" className={classes.submit}>Add</Button>
                                    </Grid>
                                </form>
                            </Grid>

                            <Grid container spacing={1}>
                                <Grid item xs={8} sm={4}>
                                    {/* previous page */}
                                    <Button onClick={() => onClickPaging(-1)} size="small" type="button" variant="outlined" color="inherit" className={classes.submit}>&lt;&lt;</Button>
                                    {/* next page */}
                                    <Button onClick={() => onClickPaging(1)} size="small" type="button" variant="outlined" color="inherit" className={classes.submit}>&gt;&gt;</Button>

                                    <TextField
                                        variant="outlined"
                                        margin="normal"
                                        size="small"
                                        id="pagingCountInput"
                                        label="Paging Items Count"
                                        name="pagingCountInput"
                                        type="number"
                                        value={pagingCountInput}
                                        onChange={onChangePagingCountInput}
                                    />
                                </Grid>

                                <Grid container spacing={1}>
                                    <Grid item xs={8} sm={4}>
                                        <TextField
                                            variant="outlined" margin="normal" size="small" value={searchQuery} onChange={onChangeSearchQuery}
                                            id="searchQuery" label="Search query" name="searchQuery" fullWidth
                                        />
                                        <Typography>Page {pagingOrder}</Typography>
                                    </Grid>
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
                                            // <PlayerRoleRow key={idx} idx={idx} row={item} />
                                            <React.Fragment>
                                                <TableRow className={rowStyles.root}>
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
                                                            <BackspaceIcon fontSize="small" />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            </React.Fragment>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Grid>
                        </React.Fragment>

                        <Divider className={titleStyles.root} />

                        <React.Fragment>
                            <Title>Event log</Title>

                            <Grid container spacing={1}>
                                <Grid item xs={8} sm={4}>
                                    {/* previous page */}
                                    <Button onClick={() => onClickEventsPaging(-1)} size="small" type="button" variant="outlined" color="inherit" className={classes.submit}>&lt;&lt;</Button>
                                    {/* next page */}
                                    <Button onClick={() => onClickEventsPaging(1)} size="small" type="button" variant="outlined" color="inherit" className={classes.submit}>&gt;&gt;</Button>

                                    <TextField
                                        variant="outlined"
                                        margin="normal"
                                        size="small"
                                        id="eventsPagingCountInput"
                                        label="Paging Items Count"
                                        name="pagingCountInput"
                                        type="number"
                                        value={eventsPagingCountInput}
                                        onChange={onChangeEventsPagingCountInput}
                                    />

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
                                        {playerRolesEventsList && playerRolesEventsList.map((event, idx) => (
                                            <React.Fragment>
                                                <TableRow className={rowStyles.root}>
                                                    <TableCell width="5%" component="th" scope="row">{convertEventTypeToIcon(event.type)}</TableCell>
                                                    <TableCell width="75%" component="th" scope="row">{convertEventToString(event)}</TableCell>
                                                    <TableCell width="20%">{convertDate(event.timestamp)}</TableCell>
                                                </TableRow>
                                            </React.Fragment>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Grid>
                        </React.Fragment>

                    </Paper>
                </Grid>
            </Grid>
            <Box pt={4}>
                <Copyright />
            </Box>
        </Container>
    );
}
