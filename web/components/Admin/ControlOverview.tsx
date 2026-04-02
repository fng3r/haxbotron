import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { ClusterSummary, HostStatusInfo, ManagedRoomInfo } from '@/lib/types/control';

export default function ControlOverview({
  summary,
  hosts,
  rooms,
}: {
  summary: ClusterSummary;
  hosts: HostStatusInfo[];
  rooms: ManagedRoomInfo[];
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Hosts</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{summary.hostCount}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Healthy</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{summary.healthyHostCount}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Configured Rooms</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{summary.configuredRoomCount}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Integrity Issues</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{summary.integrityIssueCount}</CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Host Health</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Host</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Mapped</TableHead>
                  <TableHead>Online</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hosts.map((host) => (
                  <TableRow key={host.id}>
                    <TableCell>{host.name}</TableCell>
                    <TableCell>{host.healthy ? 'healthy' : 'down'}</TableCell>
                    <TableCell>{host.mappedRoomCount}</TableCell>
                    <TableCell>{host.onlineMappedRoomCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Link className="text-blue-600 hover:underline" href="/admin/control/hosts">
              Manage hosts
            </Link>
            <Link className="text-blue-600 hover:underline" href="/admin/control/mappings">
              Manage RUID mappings
            </Link>
            <Link className="text-blue-600 hover:underline" href="/admin/newroom">
              Create mapped room
            </Link>
            <p className="text-sm text-muted-foreground">
              {rooms.filter((room) => room.integrity === 'wrong_host').length} rooms are reporting placement issues.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
