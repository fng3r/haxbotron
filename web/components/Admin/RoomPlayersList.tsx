'use client';

import { useEffect, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';
import { useDebounce } from 'use-debounce';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CopyButton } from '@/components/ui/copy-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { useWSocket } from '@/context/ws';
import { isNumber } from '@/lib/numcheck';
import { queries, queryKeys } from '@/lib/queries/player';
import { RoomPlayer } from '@/lib/types/player';

const convertDate = (timestamp: number): string => {
  if (timestamp === -1) return 'Permanent';
  return new Date(timestamp).toLocaleString();
};

export default function RoomPlayerList({ ruid }: { ruid: string }) {
  const ws = useWSocket();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pagingCount, setPagingCount] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchQueryDebounced] = useDebounce(searchQuery, 300);

  useEffect(() => {
    const invalidateRoomPlayers = (content: { ruid: string }) => {
      if (content.ruid === ruid) {
        queryClient.invalidateQueries({ queryKey: queryKeys.players(ruid) });
      }
    };
    ws.on('roomct', invalidateRoomPlayers);
    ws.on('joinleft', invalidateRoomPlayers);
    ws.on('statuschange', invalidateRoomPlayers);
    return () => {
      ws.off('roomct', invalidateRoomPlayers);
      ws.off('joinleft', invalidateRoomPlayers);
      ws.off('statuschange', invalidateRoomPlayers);
    };
  }, [ws, queryClient, ruid]);

  const onClickPaging = (shift: number) => {
    setPage((prev) => Math.max(prev + shift, 1));
  };
  const onChangePagingCountInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isNumber(parseInt(e.target.value))) {
      const count: number = parseInt(e.target.value);
      if (count >= 1) {
        setPagingCount(count);
      }
    }
  };
  const onChangeSearchQuery = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  const { data: players, isPlaceholderData } = queries.getPlayerAccountList(ruid, {
    page,
    pagingCount,
    searchQuery: searchQueryDebounced,
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle>Player Accounts List</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 mb-4 w-full">
          <div className="flex flex-col gap-2">
            <Label htmlFor="searchQuery">Search query</Label>
            <Input
              type="search"
              value={searchQuery}
              onChange={onChangeSearchQuery}
              id="searchQuery"
              name="searchQuery"
              placeholder="Search by name, public ID, or player conn"
              autoComplete="off"
              className="max-w-[420px]"
            />
          </div>

          <div className="flex gap-2">
            <div className="flex flex-col gap-2 w-40">
              <Label htmlFor="pagingCountInput">Paging Items Count</Label>
              <Input
                type="number"
                id="pagingCountInput"
                name="pagingCountInput"
                value={pagingCount}
                onChange={onChangePagingCountInput}
                min={1}
              />
            </div>
            <div className="flex gap-2 items-end">
              <Button
                variant="outline"
                type="button"
                onClick={() => onClickPaging(-1)}
                aria-label="Previous page"
                size="icon"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                type="button"
                onClick={() => onClickPaging(1)}
                aria-label="Next page"
                size="icon"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-2">Page {page}</p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/5">Name</TableHead>
              <TableHead>Public ID</TableHead>
              <TableHead>CONN</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className={isPlaceholderData ? 'opacity-50' : ''}>
            {players && players.map((item, idx) => <PlayerAccountRow key={idx} idx={idx} row={item} />)}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function PlayerAccountRow(props: { idx: number; row: RoomPlayer }) {
  const { idx, row } = props;
  const [open, setOpen] = useState(false);
  return (
    <>
      <TableRow>
        <TableCell>{row.name}</TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <span>{row.auth}</span>
            <CopyButton text={row.auth} />
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <span>{row.conn}</span>
            <CopyButton text={row.conn} />
          </div>
        </TableCell>
        <TableCell>
          <Button variant="ghost" size="icon" onClick={() => setOpen(!open)} aria-label="expand row">
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </TableCell>
      </TableRow>
      {open && (
        <TableRow>
          <TableCell colSpan={4} className="p-0 bg-muted/30">
            <div className="p-4">
              <div className="font-semibold mb-2">Information</div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Muted</TableHead>
                    <TableHead>Mute Expiration</TableHead>
                    <TableHead>Rejoin Count</TableHead>
                    <TableHead>Join</TableHead>
                    <TableHead>Left</TableHead>
                    <TableHead>Malicious Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>{row.mute ? 'Yes' : 'No'}</TableCell>
                    <TableCell>{row.muteExpire === 0 ? '-' : convertDate(row.muteExpire)}</TableCell>
                    <TableCell>{row.rejoinCount}</TableCell>
                    <TableCell>{row.joinDate === 0 ? '-' : convertDate(row.joinDate)}</TableCell>
                    <TableCell>{row.leftDate === 0 ? '-' : convertDate(row.leftDate)}</TableCell>
                    <TableCell>{row.malActCount}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
