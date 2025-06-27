'use client';

import Link from 'next/link';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

import { queries } from '@/lib/queries/server';

export default function ServerInfoWidget() {
  const { data: serverInfo } = queries.getInfo();

  return (
    <Card className="py-4 w-60">
      <CardHeader>
        <CardTitle className="text-xl">Server Info</CardTitle>
      </CardHeader>
      <CardContent>
        {serverInfo && (
          <>
            <p className="text-3xl font-semibold">{serverInfo.usedMemoryMB}MB</p>
            <p className="text-sm text-muted-foreground">uptime {Math.round(serverInfo.upTimeSecs / 60)} minutes.</p>
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
