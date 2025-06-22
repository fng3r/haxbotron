'use client';

import React, { useContext, useEffect } from 'react';

import Link from 'next/link';

import {
  Container,
  Divider,
  Grid2 as Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';

import WidgetTitle from '@/components/common/WidgetTitle';

import { WSocketContext } from '@/context/ws';
import { queries, queryKeys } from '@/lib/queries/room';

export default function RoomList() {
  const queryClient = useQueryClient();
  const ws = useContext(WSocketContext);

  const { data: roomsInfoList } = queries.getRoomsInfoList();
  const { data: allRoomsList } = queries.getAllRoomsList();

  useEffect(() => {
    ws.on('roomct', () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms });
    });
    ws.on('joinleft', () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms });
    });
    return () => {
      ws.off('roomct');
      ws.off('joinleft');
    };
  }, [ws, queryClient]);

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
                    <TableCell align="left" className="font-bold!">
                      RUID
                    </TableCell>
                    <TableCell className="font-bold!">Title</TableCell>
                    <TableCell align="right" className="font-bold!">
                      Link
                    </TableCell>
                    <TableCell align="right" className="font-bold!">
                      Online Players
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {roomsInfoList &&
                    roomsInfoList.map((item) => (
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
                    <TableCell align="left" className="font-bold!">
                      RUID
                    </TableCell>
                    <TableCell align="right" className="font-bold!">
                      Status
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allRoomsList &&
                    allRoomsList.map((item) => (
                      <TableRow hover key={item.ruid} component={Link} href={`/admin/room/${item.ruid}`}>
                        <TableCell align="left">{item.ruid}</TableCell>
                        <TableCell align="right">{item.online ? 'online' : 'offline'}</TableCell>
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
