'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { queries } from '@/lib/queries/server';

export default function ServerInfo() {
  const { data: serverInfo } = queries.getInfo();

  return (
    <div className="flex flex-wrap gap-6">
      <Card className="w-80">
        <CardHeader>
          <CardTitle className="text-2xl text-blue-500">Memory Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-semibold">{serverInfo?.usedMemoryMB || 0}MB</p>
        </CardContent>
      </Card>
      <Card className="w-80">
        <CardHeader>
          <CardTitle className="text-2xl text-blue-500">Server Uptime</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-semibold">{Math.round((serverInfo?.upTimeSecs || 0) / 60)} minutes</p>
        </CardContent>
      </Card>
      <Card className="w-80">
        <CardHeader>
          <CardTitle className="text-2xl text-blue-500">Server Version</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-semibold">v{serverInfo?.serverVersion}</p>
        </CardContent>
      </Card>
    </div>
  );
}
