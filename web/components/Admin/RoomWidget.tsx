'use client';

import React, { useContext, useEffect } from 'react';

import Link from 'next/link';

import WidgetTitle from '../common/WidgetTitle';
import { Link as MuiLink, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';

import { WSocketContext } from '@/context/ws';
import { queries, queryKeys } from '@/lib/queries/room';

export default function RoomWidget() {
  const ws = useContext(WSocketContext);
  const queryClient = useQueryClient();

  const { data: rooms } = queries.getRoomsInfoList();

  useEffect(() => {
    const invalidateRooms = () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms });
    };

    ws.on('roomct', invalidateRooms);
    ws.on('joinleft', invalidateRooms);

    return () => {
      ws.off('roomct', invalidateRooms);
      ws.off('joinleft', invalidateRooms);
    };
  }, [ws, queryClient]);

  return (
    <>
      <WidgetTitle>Current Game Rooms</WidgetTitle>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell className="font-bold!">RUID</TableCell>
            <TableCell className="font-bold!">Title</TableCell>
            <TableCell align="right" className="font-bold!">
              Online Players
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rooms &&
            rooms.slice(0, 3).map((item) => (
              <TableRow hover key={item.ruid} component={Link} href={`/admin/room/${item.ruid}`}>
                <TableCell>{item.ruid}</TableCell>
                <TableCell>{item.roomName}</TableCell>
                <TableCell align="right">{item.onlinePlayers}</TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
      <div className="mt-6">
        <MuiLink component={Link} href="/admin/roomlist" underline="hover">
          <Typography variant="body2" color="primary">
            See all game rooms
          </Typography>
        </MuiLink>
      </div>
    </>
  );
}
