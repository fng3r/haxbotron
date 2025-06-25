'use client';

import React, { useState } from 'react';

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

import SnackBarNotification from '@/components/Notifications/SnackBarNotification';
import WidgetTitle from '@/components/common/WidgetTitle';

import { Player } from '@/../core/game/model/GameObject/Player';
import { isNumber } from '@/lib/numcheck';
import { mutations, queries } from '@/lib/queries/player';
import { BanOptions } from '@/lib/types/player';

const convertDate = (timestamp: number): string => {
  if (timestamp === -1) return 'Permanent';
  return new Date(timestamp).toLocaleString();
};

export default function OnlinePlayerList({ ruid }: { ruid: string }) {
  const { data: onlinePlayers } = queries.getOnlinePlayersID(ruid);

  return (
    <>
      <WidgetTitle>Online Players</WidgetTitle>
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
          {onlinePlayers && onlinePlayers.map((item, idx) => <OnlinePlayerRow key={idx} row={item} ruid={ruid} />)}
        </TableBody>
      </Table>
    </>
  );
}

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
      { ruid, player: row, banOptions: newBan },
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
    <>
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
    </>
  );
}
