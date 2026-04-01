'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { queries } from '@/lib/queries/server';

export default function ServerInfo() {
  const { data: serverInfo } = queries.getInfo();
  const { data: hosts } = queries.getHosts();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-6">
      <Card className="w-80">
        <CardHeader>
          <CardTitle className="text-2xl text-blue-500">Healthy Hosts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-semibold">
            {serverInfo?.healthyHostCount || 0}/{serverInfo?.hostCount || 0}
          </p>
        </CardContent>
      </Card>
      <Card className="w-80">
        <CardHeader>
          <CardTitle className="text-2xl text-blue-500">Configured Rooms</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-semibold">{serverInfo?.configuredRoomCount || 0}</p>
        </CardContent>
      </Card>
      <Card className="w-80">
        <CardHeader>
          <CardTitle className="text-2xl text-blue-500">Online Rooms</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-semibold">{serverInfo?.onlineRoomCount || 0}</p>
        </CardContent>
      </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Hosts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Base URL</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Mapped</TableHead>
                <TableHead>Online</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hosts?.map((host) => (
                <TableRow key={host.id}>
                  <TableCell>{host.name}</TableCell>
                  <TableCell>{host.baseUrl}</TableCell>
                  <TableCell>{host.healthy ? 'healthy' : 'down'}</TableCell>
                  <TableCell>{host.mappedRoomCount}</TableCell>
                  <TableCell>{host.onlineMappedRoomCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
