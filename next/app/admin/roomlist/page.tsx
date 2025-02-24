'use client';

import React, { useContext, useEffect, useState } from 'react';
import clsx from 'clsx';
import { 
  Container, Grid, Paper, Table, TableBody,
  TableCell, TableHead, TableRow, Divider, 
  useTheme,
  Theme
} from '@mui/material';
import WidgetTitle from '@/components/Admin/WidgetTitle';
import client from '../../../lib/client';
import { WSocketContext } from '../../../context/ws';
import Link from 'next/link';

interface roomInfoItem {
    ruid: string
    roomName: string
    roomLink: string
    onlinePlayers: number
}

interface ruidListItem {
    ruid: string
}

interface allRoomListItem {
    ruid: string
    online: boolean
}

const useStyles = (theme: Theme) => ({
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
});


export default function RoomList() {
    const theme = useTheme();
    const classes = useStyles(theme);

    const [roomInfoList, setRoomInfoList] = useState([] as roomInfoItem[]);
    const [allRoomList, setAllRoomList] = useState([] as allRoomListItem[]);
    const ws = useContext(WSocketContext);

    const getRoomList = async () => {
        try {
            const result = await client.get('/api/v1/room');
            if (result.status === 200) {
                const roomList: string[] = result.data;
                const roomInfoList: roomInfoItem[] = await Promise.all(roomList.map(async (ruid) => {
                    const result = await client.get(`/api/v1/room/${ruid}/info`);
                    return {
                        ruid: ruid,
                        roomName: result.data.roomName,
                        roomLink: result.data._link,
                        onlinePlayers: result.data.onlinePlayers
                    }
                }));

                setRoomInfoList(roomInfoList);
            }
        } catch (e) { }
    }

    const getAllRUIDList = async () => {
        try {
            const result = await client.get('/api/v1/ruidlist');
            if (result.status === 200) {
                const allRuidList: ruidListItem[] = result.data;
                const onlineRoomList = await client.get(`/api/v1/room`)
                    .then((response: any) => {return response.data as string[]})
                    .catch((error: any) => {return [] as string[]});
                const allRoomList: allRoomListItem[] = await Promise.all(allRuidList.map(async (item) => {
                    return {
                        ruid: item.ruid,
                        online: onlineRoomList?.includes(item.ruid) || false
                    }
                }));
                setAllRoomList(allRoomList);
            }
        } catch (e) { }
    }

    useEffect(() => {
        getRoomList();
        getAllRUIDList();
    }, []);

    useEffect(() => {
        ws.on('roomct', () => {
            getRoomList();
            getAllRUIDList();
        });
        ws.on('joinleft', () => {
            getRoomList();
        });
        return () => {
            ws.off('roomct');
            ws.off('joinleft');
            console.log('unbound');
        }
    }, [ws]);

    return (
        <Container maxWidth="lg" sx={classes.container}>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Paper sx={classes.paper}>
                        <React.Fragment>
                            <WidgetTitle>Current Game Rooms</WidgetTitle>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell align="left" sx={{fontWeight: 600}}>RUID</TableCell>
                                        <TableCell sx={{fontWeight: 600}}>Title</TableCell>
                                        <TableCell align="right" sx={{fontWeight: 600}}>Link</TableCell>
                                        <TableCell align="right" sx={{fontWeight: 600}}>Online Players</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {roomInfoList.map((item, idx) => (
                                        <TableRow hover key={item.ruid} component={Link} href={`/admin/room/${item.ruid}`}>
                                            <TableCell align="left">{item.ruid}</TableCell>
                                            <TableCell>{item.roomName}</TableCell>
                                            <TableCell align="right">{item.roomLink}</TableCell>
                                            <TableCell align="right">{item.onlinePlayers}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </React.Fragment>
                        <Divider />

                        <React.Fragment>
                            <WidgetTitle>All Rooms List</WidgetTitle>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell align="left" sx={{fontWeight: 600}}>RUID</TableCell>
                                        <TableCell align="right" sx={{fontWeight: 600}}>Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {allRoomList.map((item, idx) => (
                                        <TableRow hover key={item.ruid} component={Link} href={`/admin/room/${item.ruid}`}>
                                            <TableCell align="left">{item.ruid}</TableCell>
                                            <TableCell align="right">{item.online ? "online" : "offline"}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </React.Fragment>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
}
