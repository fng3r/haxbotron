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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';

import SnackBarNotification from '@/components/Notifications/SnackBarNotification';
import Title from '@/components/common/WidgetTitle';

import { Player } from '@/../core/game/model/GameObject/Player';
import { WSocketContext } from '@/context/ws';
import client from '@/lib/client';
import { isNumber } from '@/lib/numcheck';

interface newBanFields {
  reason: string;
  seconds: number;
}

interface PlayerStorage {
  auth: string;
  conn: string;
  name: string;
  rating: number;
  totals: number;
  disconns: number;
  wins: number;
  goals: number;
  assists: number;
  ogs: number;
  losePoints: number;
  balltouch: number;
  passed: number;
  mute: boolean;
  muteExpire: number;
  rejoinCount: number;
  joinDate: number;
  leftDate: number;
  malActCount: number;
}

const convertDate = (timestamp: number): string => {
  if (timestamp === -1) return 'Permanent';
  return new Date(timestamp).toLocaleString();
};

function OnlinePlayerRow(props: { ruid: string; row: Player }) {
  const { ruid, row } = props;
  const [open, setOpen] = useState(false);

  const [newBan, setNewBan] = useState({ reason: '', seconds: 0 } as newBanFields);

  const [whisperMessage, setWhisperMessage] = useState('');

  const convertTeamID = (teamID: number): string => {
    if (teamID === 1) return 'Red';
    if (teamID === 2) return 'Blue';
    return 'Spec';
  };

  const makePermissionsText = (admin: boolean): string => {
    const text: string[] = [];
    if (admin) {
      text.push('Admin');
    }
    return text.join(',');
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
    try {
      const result = await client.post(`/api/v1/room/${ruid}/chat/${row.id}`, { message: whisperMessage });
      if (result.status === 201) {
        SnackBarNotification.success(`Successfully sent whisper message to ${row.name}.`);
        setWhisperMessage('');
      }
    } catch (error: any) {
      let errorMessage = '';
      switch (error.response.status) {
        case 400: {
          errorMessage = 'No message.';
          break;
        }
        case 401: {
          errorMessage = 'Insufficient permissions.';
          break;
        }
        case 404: {
          errorMessage = 'Room does not exist or player does not exist.';
          break;
        }
        default: {
          errorMessage = 'Unexpected error occurred. Please try again.';
          break;
        }
      }
      SnackBarNotification.error(errorMessage);
    }
  };

  const handleKick = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const result = await client.delete(`/api/v1/room/${ruid}/player/${row.id}`, {
        data: {
          ban: false,
          seconds: newBan.seconds,
          message: newBan.reason,
        },
      });
      if (result.status === 204) {
        SnackBarNotification.success(`Successfully kicked player ${row.name}.`);
        setNewBan({ reason: '', seconds: 0 });
      }
    } catch (error: any) {
      SnackBarNotification.error(`Failed to kick player ${row.name}.`);
    }
  };

  const handleOnlinePlayerMute = async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();
    try {
      if (row.permissions.mute) {
        const result = await client.delete(`/api/v1/room/${ruid}/player/${row.id}/permission/mute`);
        if (result.status === 204) {
          console.log('Successfully unmuted player', row.name);
          SnackBarNotification.success(`Successfully unmuted player ${row.name}.`);
        }
      } else {
        const result = await client.post(`/api/v1/room/${ruid}/player/${row.id}/permission/mute`, { muteExpire: -1 }); // Permanent
        if (result.status === 201) {
          SnackBarNotification.success(`Successfully muted player ${row.name}.`);
        }
      }
    } catch (error: any) {
      SnackBarNotification.error(`Failed to mute/unmute player ${row.name}.`);
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
              <Grid container spacing={4}>
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
                <form onSubmit={handleKick} method="post">
                  <Grid size={{ xs: 12, sm: 12 }}>
                    <TextField
                      variant="outlined"
                      margin="normal"
                      required
                      size="small"
                      value={newBan.reason}
                      onChange={onChangeNewBan}
                      id="reason"
                      label="Reason"
                      name="reason"
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
                    />
                    <Button size="small" type="submit" variant="contained" color="secondary" className="mt-5! ml-1!">
                      Kick
                    </Button>
                  </Grid>
                </form>
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
                      {makePermissionsText(row.admin)}
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

function PlayerAccountRow(props: { idx: number; row: PlayerStorage }) {
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
  const { ruid } = useParams<{ ruid: string }>();

  const [pagingOrder, setPagingOrder] = useState(1);
  const [pagingCount, setPagingCount] = useState(10);
  const [pagingCountInput, setPagingCountInput] = useState('10');

  const [onlinePlayerList, setOnlinePlayerList] = useState([] as Player[]);
  const [playerAccountList, setPlayerAccountList] = useState([] as PlayerStorage[]);

  const [searchQuery, setSearchQuery] = useState('');

  const onClickPaging = (move: number) => {
    if (pagingOrder + move >= 1) {
      setPagingOrder(pagingOrder + move);
      getPlayerAccountList(pagingOrder + move);
    }
  };

  const onChangePagingCountInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPagingCountInput(e.target.value);

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

    getPlayerAccountList(pagingOrder, query);
  };

  const getPlayerAccountList = async (page: number, searchQuery: string = '') => {
    const index: number = (page - 1) * pagingCount;
    try {
      const result = await client.get(
        `/api/v1/playerlist/${ruid}?searchQuery=${searchQuery}&start=${index}&count=${pagingCount}`,
      );
      if (result.status === 200) {
        const playerAccounts: PlayerStorage[] = result.data;

        setPlayerAccountList(playerAccounts);
      }
    } catch (e) {
      SnackBarNotification.error('Failed to load players list.');
    }
  };

  const getOnlinePlayersID = async () => {
    try {
      const result = await client.get(`/api/v1/room/${ruid}/player`);
      if (result.status === 200) {
        const onlinePlayersID: number[] = result.data;
        const onlinePlayersInfoList: Player[] = await Promise.all(
          onlinePlayersID.map(async (playerID) => {
            const result: Player = await client
              .get(`/api/v1/room/${ruid}/player/${playerID}`)
              .then((response) => {
                return response.data;
              })
              .catch((e) => {
                return e;
              });
            return result;
          }),
        );

        setOnlinePlayerList(onlinePlayersInfoList);
      }
    } catch (e) {
      SnackBarNotification.error('Failed to load online players list.');
    }
  };

  useEffect(() => {
    getOnlinePlayersID();
    getPlayerAccountList(1);

    return () => {
      setOnlinePlayerList([]);
    };
  }, []);

  useEffect(() => {
    // websocket with socket.io
    ws.on('roomct', (content: { ruid: string }) => {
      if (content.ruid === ruid) {
        getOnlinePlayersID();
      }
    });
    ws.on('joinleft', (content: { ruid: string }) => {
      if (content.ruid === ruid) {
        getOnlinePlayersID();
      }
    });
    ws.on('statuschange', (content: { ruid: string }) => {
      if (content.ruid === ruid) {
        getOnlinePlayersID();
      }
    });
    return () => {
      // before the component is destroyed
      // unbind all event handlers used in this component
    };
  }, [ws]);

  return (
    <Container maxWidth="lg" className="py-8">
      <Grid container spacing={3}>
        <Grid size={12}>
          <Paper className="p-4">
            <React.Fragment>
              <Title>Online Players</Title>
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
                  {onlinePlayerList &&
                    onlinePlayerList.map((item, idx) => <OnlinePlayerRow key={idx} row={item} ruid={ruid} />)}
                </TableBody>
              </Table>
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
                      value={pagingCountInput}
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

                    <Typography>Page {pagingOrder}</Typography>
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
                  <TableBody>
                    {playerAccountList &&
                      playerAccountList.map((item, idx) => <PlayerAccountRow key={idx} idx={idx} row={item} />)}
                  </TableBody>
                </Table>
              </Grid>
            </React.Fragment>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
