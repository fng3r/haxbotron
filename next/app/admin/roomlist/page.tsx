'use client';

import React, { useContext, useEffect, useState } from 'react';
import { 
  Container, Grid2 as Grid, Paper, Table, TableBody,
  TableCell, TableHead, TableRow, Divider,
} from '@mui/material';
import WidgetTitle from '@/components/Admin/WidgetTitle';
import client from '@/lib/client';
import { WSocketContext } from '@/context/ws';
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


export default function RoomList() {

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
        <Container maxWidth="lg" className="py-8">
            <Grid container spacing={3}>
                <Grid size={12}>
                    <Paper className="p-4">
                        <React.Fragment>
                            <WidgetTitle>Current Game Rooms</WidgetTitle>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell align="left" className="font-bold!">RUID</TableCell>
                                        <TableCell className="font-bold!">Title</TableCell>
                                        <TableCell align="right" className="font-bold!">Link</TableCell>
                                        <TableCell align="right" className="font-bold!">Online Players</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {roomInfoList.map((item) => (
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
                                        <TableCell align="left" className="font-bold!">RUID</TableCell>
                                        <TableCell align="right" className="font-bold!">Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {allRoomList.map((item) => (
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
