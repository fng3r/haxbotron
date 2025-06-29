'use client';

import Link from 'next/link';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { queries } from '@/lib/queries/room';

export default function RoomWidget() {
  const { data: rooms } = queries.getRoomsInfoList();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Game Rooms</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          {!rooms || (rooms.length === 0 && <TableCaption>No rooms</TableCaption>)}
          <TableHeader>
            <TableRow>
              <TableHead className="font-bold">RUID</TableHead>
              <TableHead className="font-bold">Title</TableHead>
              <TableHead className="text-right font-bold">Online Players</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rooms &&
              rooms.slice(0, 3).map((item) => (
                <TableRow key={item.ruid}>
                  <TableCell>
                    <Link href={`/admin/room/${item.ruid}`} className="block w-full">
                      {item.ruid}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/room/${item.ruid}`} className="block w-full">
                      {item.roomName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/room/${item.ruid}`} className="block w-full">
                      {item.onlinePlayers}
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter>
        <Link href="/admin/roomlist" className="text-sm text-blue-600 hover:underline">
          See all game rooms
        </Link>
      </CardFooter>
    </Card>
  );
}
