'use client';

import Link from 'next/link';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

import { queries } from '@/lib/queries/server';

export default function ServerInfoWidget() {
  const { data: serverInfo } = queries.getInfo();
  const { data: serverHosts } = queries.getHosts();

  return (
    <Card className="py-4 w-72">
      <CardHeader>
        <CardTitle className="text-xl">Cluster Info</CardTitle>
      </CardHeader>
      <CardContent>
        {serverInfo && (
          <>
            <p className="text-3xl font-semibold">
              {serverInfo.onlineRoomCount}/{serverInfo.configuredRoomCount}
            </p>
            <p className="text-sm text-muted-foreground">
              rooms online across {serverInfo.healthyHostCount}/{serverInfo.hostCount} healthy hosts
            </p>
            <p className="mt-3 text-sm text-muted-foreground">tracked hosts: {serverHosts?.length || 0}</p>
          </>
        )}
      </CardContent>
      <CardFooter>
        <Link href="/admin/serverinfo" className="text-sm text-blue-600 hover:underline">
          Get more information
        </Link>
      </CardFooter>
    </Card>
  );
}
