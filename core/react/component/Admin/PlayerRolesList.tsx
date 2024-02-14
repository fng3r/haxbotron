import React, { useContext, useEffect, useState } from 'react';
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
import { Button, Collapse, Divider, IconButton, makeStyles, TextField, Typography } from '@material-ui/core';
import Alert, { AlertColor } from '../common/Alert';
import { isNumber } from '../../lib/numcheck';
import BackspaceIcon from "@material-ui/icons/Backspace";


interface styleClass {
    styleClass: any
}

interface rolesListItem {
    auth: string
    name: string,
    role: string
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

const useRowStyles = makeStyles({
    root: {
        '& > *': {
            borderBottom: 'unset',
        },
    },
});

export default function RoomPlayerList({ styleClass }: styleClass) {
    const classes = styleClass;
    const rowStyles = useRowStyles();

    const fixedHeightPaper = clsx(classes.paper, classes.fullHeight);

    const [flashMessage, setFlashMessage] = useState('');
    const [alertStatus, setAlertStatus] = useState("success" as AlertColor);

    const [pagingOrder, setPagingOrder] = useState(1);
    const [pagingCount, setPagingCount] = useState(10);
    const [pagingCountInput, setPagingCountInput] = useState('10');
    const [searchQuery, setSearchQuery] = useState('');

    const [playerRolesList, setPlayerRolesList] = useState([] as PlayerRole[]);
    const [newRole, setNewRole] = useState({ auth: '', name: '', role: 'player' } as newRoleFields);

    const onClickPaging = (move: number) => {
        if (pagingOrder + move >= 1) {
            setPagingOrder(pagingOrder + move);
            getPlayerRolesList(pagingOrder + move);
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

        getPlayerRolesList(pagingOrder, query)
    }

    const onChangeNewRole = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        console.log('onChangeNewRole');

        setNewRole({
            ...newRole,
            [name]: value
        });
    }

    const getPlayerRolesList = async (page: number, searchQuery: string = '') => {
        const index: number = (page - 1) * pagingCount;
        try {
            const result = await client.get(`/api/v1/roleslist?searchQuery=${searchQuery}&start=${index}&count=${pagingCount}`);
            if (result.status === 200) {
                const playerRoles: PlayerRole[] = result.data;

                setPlayerRolesList(playerRoles);
            }
        } catch (e) {
            setFlashMessage('Failed to load roles list.');
            setAlertStatus('error');
        }
    }

    const addRole = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        try {
            const result = await client.post(`/api/v1/roleslist/${newRole.auth}?name=${newRole.name}&role=${newRole.role}`);
            if (result.status === 204) {
                setFlashMessage('Successfully added new role.');
                setAlertStatus('success');
                setNewRole({ auth: '', name: '', role: 'player' });
                setTimeout(() => {
                    setFlashMessage('');
                }, 3000);
            }
        } catch (error) {
            //error.response.status
            setFlashMessage('Failed to add new role.');
            setAlertStatus('error');
            setTimeout(() => {
                setFlashMessage('');
            }, 3000);
        }
        getPlayerRolesList(pagingOrder);
    }

    const deleteRole = async (auth: string) => {
        try {
            const result = await client.delete(`/api/v1/roleslist/${auth}`);
            if (result.status === 204) {
                setFlashMessage('Successfully deleted role.');
                setAlertStatus('success');
                setTimeout(() => {
                    setFlashMessage('');
                }, 3000);
            }
        } catch (error) {
            //error.response.status
            setFlashMessage('Failed to delete player role.');
            setTimeout(() => {
                setFlashMessage('');
                setAlertStatus('error');
            }, 3000);
        }
        getPlayerRolesList(pagingOrder);
    }

    useEffect(() => {
        getPlayerRolesList(1);

        return (() => {
            setPlayerRolesList([]);
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
                                            id="auth" label="Public id" name="auth"
                                        />
                                        <TextField
                                            variant="outlined" margin="normal" required size="small" value={newRole.role} onChange={onChangeNewRole}
                                            id="role" label="Role" name="role"
                                        />
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
                                            variant="outlined" margin="normal" required size="small" value={searchQuery} onChange={onChangeSearchQuery}
                                            id="searchQuery" label="Search query" name="searchQuery" fullWidth
                                        />
                                        <Typography>Page {pagingOrder}</Typography>
                                    </Grid>
                                </Grid>

                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Name</TableCell>
                                            <TableCell>Public id</TableCell>
                                            <TableCell>Role</TableCell>
                                            <TableCell align="right"></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {playerRolesList && playerRolesList.map((item, idx) => (
                                            // <PlayerRoleRow key={idx} idx={idx} row={item} />
                                            <React.Fragment>
                                                <TableRow className={rowStyles.root}>
                                                    <TableCell component="th" scope="row">{item.name}</TableCell>
                                                    <TableCell>{item.auth}</TableCell>
                                                    <TableCell>{item.role}</TableCell>
                                                    <TableCell align="right">
                                                        <IconButton name={item.auth} onClick={() => deleteRole(item.auth)} aria-label="delete">
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
                    </Paper>
                </Grid>
            </Grid>
            <Box pt={4}>
                <Copyright />
            </Box>
        </Container>
    );
}
