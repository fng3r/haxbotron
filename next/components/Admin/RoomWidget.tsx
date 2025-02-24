'use client';

import React, { useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { Link as MuiLink, Table, TableBody, TableCell, TableHead, TableRow, Theme, Typography, useTheme } from '@mui/material';

import WidgetTitle from './WidgetTitle';
import client from '../../lib/client';
import { WSocketContext } from '../../context/ws';

interface roomInfoItem {
    ruid: string
    roomName: string
    onlinePlayers: number
}

const useStyles = ((theme: Theme) => ({
    seeMore: {
        marginTop: theme.spacing(3),
    },
}));

export default function RoomWidget() {
    const theme = useTheme();
    const classes = useStyles(theme);
    const [roomInfoList, setRoomInfoList] = useState([] as roomInfoItem[]);
    const ws = useContext(WSocketContext);

    const getRoomList = async () => {
        try {
            const result = await client.get('/api/v1/room');
            if(result.status === 200) {
                const roomList: string[] = result.data;
                const roomInfoList: roomInfoItem[] = await Promise.all(roomList.map(async (ruid) => {
                    const result = await client.get('/api/v1/room/'+ruid);
                    return {
                        ruid: ruid,
                        roomName: result.data.roomName,
                        onlinePlayers: result.data.onlinePlayers
                    }
                }));

                setRoomInfoList(roomInfoList);
            }
        } catch { }
    }

    useEffect(() => {
        getRoomList();

        return (() => {
            setRoomInfoList([]);
        });
    }, []);

    useEffect(() => { // websocket with socket.io
        ws.on('roomct', () => {
            setRoomInfoList([]);
            getRoomList();
        });
        ws.on('joinleft', () => {
            setRoomInfoList([]);
            getRoomList();
        });
        return () => {
            // before the component is destroyed
            // unbind all event handlers used in this component
        }
    }, [ws]);

    return (
        <React.Fragment>
            <WidgetTitle>Current Game Rooms</WidgetTitle>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell>RUID</TableCell>
                        <TableCell>Title</TableCell>
                        <TableCell align="right">Online Players</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {roomInfoList.slice(0,3).map((item) => (
                        <TableRow key={item.ruid} component={Link} href={`/admin/room/${item.ruid}`} >
                            <TableCell>{item.ruid}</TableCell>
                            <TableCell>{item.roomName}</TableCell>
                            <TableCell align="right">{item.onlinePlayers}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <div style={classes.seeMore}>
                <MuiLink component={Link} href="/admin/roomlist" underline="hover">
                    <Typography variant="body2" color="primary">
                        See all game rooms
                    </Typography>
                </MuiLink>
            </div>
        </React.Fragment>
    );
}
