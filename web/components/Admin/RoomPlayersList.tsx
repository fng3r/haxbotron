'use client';

import { useEffect, useState } from 'react';

import {
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Collapse,
  Grid2 as Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { useDebounce } from 'use-debounce';

import WidgetTitle from '@/components/common/WidgetTitle';

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
    const query = e.target.value;
    setSearchQuery(query);
  };

  const { data: players, isPlaceholderData } = queries.getPlayerAccountList(ruid, {
    page,
    pagingCount,
    searchQuery: searchQueryDebounced,
  });

  return (
    <>
      <WidgetTitle>Player Accounts List</WidgetTitle>
      <Grid container spacing={1}>
        <Grid size={12}>
          <Grid size={4}>
            <TextField
              variant="outlined"
              margin="normal"
              size="small"
              value={searchQuery}
              onChange={onChangeSearchQuery}
              id="searchQuery"
              label="Search query"
              name="searchQuery"
              fullWidth
            />
          </Grid>
        </Grid>
        <Grid container spacing={1} size={12} flexDirection="column">
          <Grid size={5}>
            <TextField
              variant="outlined"
              margin="normal"
              size="small"
              sx={{ width: 150 }}
              id="pagingCountInput"
              label="Paging Items Count"
              name="pagingCountInput"
              type="number"
              value={pagingCount}
              onChange={onChangePagingCountInput}
            />
            {/* previous page */}
            <Button
              onClick={() => onClickPaging(-1)}
              size="small"
              type="button"
              variant="outlined"
              color="inherit"
              className="mt-5! ml-1!"
            >
              &lt;&lt;
            </Button>
            {/* next page */}
            <Button
              onClick={() => onClickPaging(1)}
              size="small"
              type="button"
              variant="outlined"
              color="inherit"
              className="mt-5!"
            >
              &gt;&gt;
            </Button>

            <Typography>Page {page}</Typography>
          </Grid>
        </Grid>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width="20%" className="font-bold!">
                Name
              </TableCell>
              <TableCell className="font-bold!">AUTH</TableCell>
              <TableCell className="font-bold!">CONN</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody className={isPlaceholderData ? 'opacity-50' : ''}>
            {players && players.map((item, idx) => <PlayerAccountRow key={idx} idx={idx} row={item} />)}
          </TableBody>
        </Table>
      </Grid>
    </>
  );
}

function PlayerAccountRow(props: { idx: number; row: RoomPlayer }) {
  const { idx, row } = props;
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow className="*:border-none">
        <TableCell component="th" scope="row">
          {row.name}
        </TableCell>
        <TableCell>{row.auth}</TableCell>
        <TableCell>{row.conn}</TableCell>
        <TableCell>
          <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box margin={1}>
              <Typography variant="h6" gutterBottom component="div">
                Information
              </Typography>
              <Table size="small" aria-label="player information">
                <TableHead>
                  <TableRow>
                    <TableCell>Muted</TableCell>
                    <TableCell>Mute Expiration</TableCell>
                    <TableCell>Rejoin Count</TableCell>
                    <TableCell>Join</TableCell>
                    <TableCell>Left</TableCell>
                    <TableCell>Malicious Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow key={idx}>
                    <TableCell component="th" scope="row">
                      {row.mute ? 'Yes' : 'no'}
                    </TableCell>
                    <TableCell>{row.muteExpire === 0 ? '-' : convertDate(row.muteExpire)}</TableCell>
                    <TableCell>{row.rejoinCount}</TableCell>
                    <TableCell>{row.joinDate === 0 ? '-' : convertDate(row.joinDate)}</TableCell>
                    <TableCell>{row.leftDate === 0 ? '-' : convertDate(row.leftDate)}</TableCell>
                    <TableCell>{row.malActCount}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}
