'use client';

import React, { useState } from 'react';

import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';

import SnackBarNotification from '@/components/Notifications/SnackBarNotification';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { isNumber } from '@/lib/numcheck';
import { mutations, queries } from '@/lib/queries/player';
import { NewBanEntry } from '@/lib/types/player';

export default function RoomBanList({ ruid }: { ruid: string }) {
  const [newBan, setNewBan] = useState({ conn: '', auth: '', reason: '', seconds: 0 } as NewBanEntry);
  const [page, setPage] = useState(1);
  const { data: bans } = queries.getPlayersBans(ruid, { page, pagingCount: 10 });
  const addPlayerBanMutation = mutations.addBan();
  const removePlayerBanMutation = mutations.removeBan();

  const convertDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  const onClickPaging = (shift: number) => {
    setPage((prev) => Math.max(prev + shift, 1));
  };

  const onChangeNewBan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'seconds' && isNumber(parseInt(value))) {
      setNewBan({
        ...newBan,
        seconds: parseInt(value),
      });
    } else {
      setNewBan({
        ...newBan,
        [name]: value,
      });
    }
  };

  const handleAdd = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    addPlayerBanMutation.mutate(
      { ruid, banEntry: newBan },
      {
        onSuccess: () => {
          SnackBarNotification.success(`Successfully banned by conn: ${newBan.conn}.`);
          setNewBan({ conn: '', auth: '', reason: '', seconds: 0 });
        },
        onError: (error) => {
          SnackBarNotification.error(error.message);
        },
      },
    );
  };

  const handleDelete = async (conn: string) => {
    removePlayerBanMutation.mutate(
      { ruid, conn },
      {
        onSuccess: () => {
          SnackBarNotification.success(`Successfully deleted ban entry (conn: ${conn}).`);
        },
        onError: (error) => {
          SnackBarNotification.error(error.message);
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bans List</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col lg:flex-row gap-2 mb-4 w-full" onSubmit={handleAdd} method="post">
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <label htmlFor="conn" className="text-xs font-medium">
              CONN
            </label>
            <Input required value={newBan.conn} onChange={onChangeNewBan} id="conn" name="conn" size={10} />
          </div>
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <label htmlFor="auth" className="text-xs font-medium">
              AUTH
            </label>
            <Input required value={newBan.auth} onChange={onChangeNewBan} id="auth" name="auth" size={10} />
          </div>
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <label htmlFor="reason" className="text-xs font-medium">
              Reason
            </label>
            <Input required value={newBan.reason} onChange={onChangeNewBan} id="reason" name="reason" size={20} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="seconds" className="text-xs font-medium">
              Ban Time (secs)
            </label>
            <Input
              required
              value={newBan.seconds}
              onChange={onChangeNewBan}
              type="number"
              id="seconds"
              name="seconds"
              size={10}
              min={0}
              className="w-30"
            />
          </div>
          <div className="flex items-end">
            <Button type="submit">Ban</Button>
          </div>
        </form>

        <Separator className="mb-4" />

        <Table className="table-auto">
          <TableHeader>
            <TableRow>
              <TableHead>CONN</TableHead>
              <TableHead>Auth</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Registered Date</TableHead>
              <TableHead>Expiration Date</TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bans &&
              bans.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <span className="break-all break-words hyphens-auto">{item.conn}</span>
                  </TableCell>
                  <TableCell>
                    <span className="break-all break-words hyphens-auto">{item.auth}</span>
                  </TableCell>
                  <TableCell>
                    <span className="break-all break-words hyphens-auto">{item.reason}</span>
                  </TableCell>
                  <TableCell>{convertDate(item.register)}</TableCell>
                  <TableCell>{convertDate(item.expire)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.conn)} aria-label="delete">
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>

        <div className="mt-2 w-full flex justify-center items-center gap-2 py-2">
          <Button
            variant="outline"
            type="button"
            onClick={() => onClickPaging(-1)}
            aria-label="Previous page"
            size="icon"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="mx-2">Page {page}</span>
          <Button variant="outline" type="button" onClick={() => onClickPaging(1)} aria-label="Next page" size="icon">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
