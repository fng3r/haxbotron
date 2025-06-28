'use client';

import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CopyButton } from '@/components/ui/copy-button';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { queries } from '@/lib/queries/room';

export default function RoomList() {
  const { data: roomsInfoList } = queries.getRoomsInfoList();
  const { data: allRoomsList } = queries.getAllRoomsList();

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Current Game Rooms</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            {!roomsInfoList || (roomsInfoList.length === 0 && <TableCaption>No rooms</TableCaption>)}
            <TableHeader>
              <TableRow>
                <TableHead className="text-left font-bold">RUID</TableHead>
                <TableHead className="font-bold">Title</TableHead>
                <TableHead className="text-right font-bold">Link</TableHead>
                <TableHead className="text-right font-bold">Online Players</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roomsInfoList &&
                roomsInfoList.map((item) => (
                  <TableRow key={item.ruid}>
                    <TableCell className="text-left">
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
                      <div className="flex justify-end items-center gap-2">
                        <span>{item.roomLink}</span>
                        <CopyButton text={item.roomLink} />
                      </div>
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
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Rooms List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            {!allRoomsList || (allRoomsList.length === 0 && <TableCaption>No rooms</TableCaption>)}
            <TableHeader>
              <TableRow>
                <TableHead className="text-left font-bold">RUID</TableHead>
                <TableHead className="text-right font-bold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allRoomsList &&
                allRoomsList.map((item) => (
                  <TableRow key={item.ruid}>
                    <TableCell className="text-left">
                      <Link href={`/admin/room/${item.ruid}`} className="block w-full">
                        {item.ruid}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/room/${item.ruid}`} className="block w-full">
                        {item.online ? 'online' : 'offline'}
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
