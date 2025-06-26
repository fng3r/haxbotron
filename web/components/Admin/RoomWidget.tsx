'use client';

import Link from 'next/link';

import WidgetTitle from '../common/WidgetTitle';
import { Link as MuiLink, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';

import { queries } from '@/lib/queries/room';

export default function RoomWidget() {
  const { data: rooms } = queries.getRoomsInfoList();

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
              <TableRow hover key={item.ruid} className="cursor-pointer">
                <TableCell>
                  <Link href={`/admin/room/${item.ruid}`}>{item.ruid}</Link>
                </TableCell>
                <TableCell>
                  <Link href={`/admin/room/${item.ruid}`}>{item.roomName}</Link>
                </TableCell>
                <TableCell align="right">
                  <Link href={`/admin/room/${item.ruid}`}>{item.onlinePlayers}</Link>
                </TableCell>
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
