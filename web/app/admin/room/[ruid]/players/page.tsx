'use client';

import React, { useContext, useEffect, useState } from 'react';

import { useParams } from 'next/navigation';

import {
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Collapse,
  Container,
  Divider,
  Grid2 as Grid,
  IconButton,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';

import SnackBarNotification from '@/components/Notifications/SnackBarNotification';
import Title from '@/components/common/WidgetTitle';

import { Player } from '@/../core/game/model/GameObject/Player';
import { WSocketContext } from '@/context/ws';
import { isNumber } from '@/lib/numcheck';
import { BanOptions, RoomPlayer, mutations, queries, queryKeys } from '@/lib/queries/player';

const convertDate = (timestamp: number): string => {
  if (timestamp === -1) return 'Permanent';
  return new Date(timestamp).toLocaleString();
};

function OnlinePlayerRow(props: { ruid: string; row: Player }) {
  const { ruid, row } = props;
  const [open, setOpen] = useState(false);

  const [kickReason, setKickReason] = useState('');
  const [newBan, setNewBan] = useState({ reason: '', seconds: 180 } as BanOptions);

  const [whisperMessage, setWhisperMessage] = useState('');

  const mutePlayerMutation = mutations.mutePlayer();
  const unmutePlayerMutation = mutations.unmutePlayer();
  const kickPlayerMutation = mutations.kickPlayer();
  const banPlayerMutation = mutations.banPlayer();
  const sendWhisperMutation = mutations.sendWhisper();

  const convertTeamID = (teamID: number): string => {
    if (teamID === 1) return 'Red';
    if (teamID === 2) return 'Blue';
    return 'Spec';
  };

  const onChangeKickReason = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKickReason(e.target.value);
  };

  const onChangeNewBan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'newbanseconds' && isNumber(parseInt(value))) {
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

  const onChangeWhisperMessage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWhisperMessage(e.target.value);
  };

  const handleWhisper = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    sendWhisperMutation.mutate(
      { ruid, player: row, message: whisperMessage },
      {
        onSuccess: () => {
          SnackBarNotification.success(`Successfully sent whisper message to ${row.name}.`);
          setWhisperMessage('');
        },
        onError: (error) => {
          SnackBarNotification.error(error.message);
        },
      },
    );
  };

  const handleKick = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    kickPlayerMutation.mutate(
      { ruid, player: row, reason: kickReason },
      {
        onSuccess: () => {
          SnackBarNotification.success(`Player ${row.name} has been kicked.`);
          setKickReason('');
        },
        onError: (error) => {
          SnackBarNotification.error(error.message);
        },
      },
    );
  };

  const handleBan = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    banPlayerMutation.mutate(
      { ruid, player: row, banEntry: newBan },
      {
        onSuccess: () => {
          SnackBarNotification.success(`Player ${row.name} has been banned.`);
        },
        onError: (error) => {
          SnackBarNotification.error(error.message);
          setNewBan({ reason: '', seconds: 180 });
        },
      },
    );
  };

  const handleOnlinePlayerMute = async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();

    if (row.permissions.mute) {
      unmutePlayerMutation.mutate(
        { ruid, player: row },
        {
          onSuccess: () => {
            SnackBarNotification.success(`Player ${row.name} has been unmuted.`);
          },
          onError: () => {
            SnackBarNotification.error(`Failed to unmute player ${row.name}.`);
          },
        },
      );
    } else {
      mutePlayerMutation.mutate(
        { ruid, player: row },
        {
          onSuccess: () => {
            SnackBarNotification.success(`Player ${row.name} has been muted.`);
          },
          onError: () => {
            SnackBarNotification.error(`Failed to mute player ${row.name}.`);
          },
        },
      );
    }
  };

  return (
    <React.Fragment>
      <TableRow className="*:border-none">
        <TableCell component="th" scope="row">
          {row.name}#{row.id}
        </TableCell>
        <TableCell>{row.auth}</TableCell>
        <TableCell>{row.conn}</TableCell>
        <TableCell>{convertTeamID(row.team)}</TableCell>
        <TableCell>
          <Button size="small" type="button" variant="text" color="inherit" onClick={handleOnlinePlayerMute}>
            {row.permissions.mute ? 'Unmute' : 'Mute'}
          </Button>
        </TableCell>
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
              <Grid container spacing={1} direction={'column'}>
                <form onSubmit={handleWhisper} method="post">
                  <Grid size={{ xs: 12, sm: 12 }}>
                    <TextField
                      variant="outlined"
                      margin="normal"
                      required
                      size="small"
                      value={whisperMessage}
                      onChange={onChangeWhisperMessage}
                      id="whisper"
                      label="Whisper"
                      name="whisper"
                    />
                    <Button size="small" type="submit" variant="contained" color="primary" className="mt-5! ml-1!">
                      Send
                    </Button>
                  </Grid>
                </form>
                <Grid container columnSpacing={4}>
                  <form onSubmit={handleKick} method="post">
                    <Grid size={{ xs: 12, sm: 12 }}>
                      <TextField
                        variant="outlined"
                        margin="normal"
                        size="small"
                        value={kickReason}
                        onChange={onChangeKickReason}
                        id="reason"
                        label="Reason"
                        name="reason"
                        className="mr-1!"
                      />
                      <Button size="small" type="submit" variant="contained" color="secondary" className="mt-5!">
                        Kick
                      </Button>
                    </Grid>
                  </form>

                  <form onSubmit={handleBan} method="post">
                    <Grid size={{ xs: 12, sm: 12 }}>
                      <TextField
                        variant="outlined"
                        margin="normal"
                        size="small"
                        value={newBan.reason}
                        onChange={onChangeNewBan}
                        id="reason"
                        label="Reason"
                        name="reason"
                        className="mr-2!"
                      />
                      <TextField
                        variant="outlined"
                        margin="normal"
                        required
                        size="small"
                        value={newBan.seconds}
                        onChange={onChangeNewBan}
                        type="number"
                        id="seconds"
                        label="Time(secs)"
                        name="seconds"
                        className="mr-1!"
                      />
                      <Button size="small" type="submit" variant="contained" color="error" className="mt-5!">
                        Ban
                      </Button>
                    </Grid>
                  </form>
                </Grid>
              </Grid>
              <Typography variant="h6" gutterBottom component="div">
                Information
              </Typography>
              <Table size="small" aria-label="statistics">
                <TableHead>
                  <TableRow>
                    <TableCell>Permissions</TableCell>
                    <TableCell>Mute</TableCell>
                    <TableCell>Mute Expiration</TableCell>
                    <TableCell>Join Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow key={row.id}>
                    <TableCell component="th" scope="row">
                      {row.admin ? 'Admin' : '-'}
                    </TableCell>
                    <TableCell>{row.permissions.mute ? 'Yes' : 'No'}</TableCell>
                    <TableCell>
                      {row.permissions.muteExpire === 0 ? '-' : convertDate(row.permissions.muteExpire)}
                    </TableCell>
                    <TableCell>{convertDate(row.entrytime.joinDate)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

function PlayerAccountRow(props: { idx: number; row: RoomPlayer }) {
  const { idx, row } = props;
  const [open, setOpen] = useState(false);

  return (
    <React.Fragment>
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
              <Typography variant="h6" gutterBottom component="div">
                Statistics
              </Typography>
              <Table size="small" aria-label="player information">
                <TableHead>
                  <TableRow>
                    <TableCell>Rating</TableCell>
                    <TableCell>Wins/Totals</TableCell>
                    <TableCell>Goals</TableCell>
                    <TableCell>Assists</TableCell>
                    <TableCell>OGs</TableCell>
                    <TableCell>Lose Points</TableCell>
                    <TableCell>Pass Succ</TableCell>
                    <TableCell>Disconnections</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow key={idx}>
                    <TableCell component="th" scope="row">
                      {row.rating}
                    </TableCell>
                    <TableCell>
                      {row.wins}/{row.totals} ({Math.round((row.wins / row.totals) * 100) || 0}%)
                    </TableCell>
                    <TableCell>{row.goals}</TableCell>
                    <TableCell>{row.assists}</TableCell>
                    <TableCell>{row.ogs}</TableCell>
                    <TableCell>{row.losePoints}</TableCell>
                    <TableCell>{Math.round((row.passed / row.balltouch) * 100) || 0}%</TableCell>
                    <TableCell>{row.disconns}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

export default function RoomPlayerList() {
  const ws = useContext(WSocketContext);
  const queryClient = useQueryClient();

  const { ruid } = useParams<{ ruid: string }>();

  const [page, setPage] = useState(1);
  const [pagingCount, setPagingCount] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

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

  const { data: players, isLoading: playersLoading } = queries.getPlayerAccountList(ruid, {
    page,
    pagingCount,
    searchQuery,
  });
  const { data: onlinePlayers, isLoading: onlinePlayerLoading } = queries.getOnlinePlayersID(ruid);

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

  return (
    <Container maxWidth="lg" className="py-8">
      <Grid container spacing={3}>
        <Grid size={12}>
          <Paper className="p-4">
            <React.Fragment>
              <Title>Online Players</Title>
              {onlinePlayerLoading ? (
                <div className="space-y-2">
                  <Skeleton animation="wave" variant="rounded" width="100%" height={50} />
                  <Skeleton animation="wave" variant="rounded" width="100%" height={50} />
                  <Skeleton animation="wave" variant="rounded" width="100%" height={50} />
                </div>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell width="20%" className="font-bold!">
                        Name
                      </TableCell>
                      <TableCell className="font-bold!">AUTH</TableCell>
                      <TableCell className="font-bold!">CONN</TableCell>
                      <TableCell className="font-bold!">Team</TableCell>
                      <TableCell className="font-bold!">Chat</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {onlinePlayers &&
                      onlinePlayers.map((item, idx) => <OnlinePlayerRow key={idx} row={item} ruid={ruid} />)}
                  </TableBody>
                </Table>
              )}
            </React.Fragment>
            <Divider />

            <React.Fragment>
              <Title>Player Accounts List</Title>
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
                {playersLoading ? (
                  <>
                    <Skeleton animation="wave" variant="rounded" width="100%" height={50} />
                    <Skeleton animation="wave" variant="rounded" width="100%" height={50} />
                    <Skeleton animation="wave" variant="rounded" width="100%" height={50} />
                  </>
                ) : (
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
                    <TableBody>
                      {players && players.map((item, idx) => <PlayerAccountRow key={idx} idx={idx} row={item} />)}
                    </TableBody>
                  </Table>
                )}
              </Grid>
            </React.Fragment>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
