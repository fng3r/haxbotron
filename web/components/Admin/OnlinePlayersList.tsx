'use client';

import React, { useState } from 'react';

import { ChevronDown, ChevronUp } from 'lucide-react';

import SnackBarNotification from '@/components/Notifications/SnackBarNotification';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CopyButton } from '@/components/ui/copy-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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
    <Card>
      <CardHeader>
        <CardTitle>Online Players</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/5">Name</TableHead>
              <TableHead>AUTH</TableHead>
              <TableHead>CONN</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Chat</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {onlinePlayers && onlinePlayers.map((item, idx) => <OnlinePlayerRow key={idx} row={item} ruid={ruid} />)}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
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
      <TableRow>
        <TableCell>
          {row.name}#{row.id}
        </TableCell>
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
        <TableCell>{convertTeamID(row.team)}</TableCell>
        <TableCell>
          <Button size="sm" type="button" variant="ghost" onClick={handleOnlinePlayerMute}>
            {row.permissions.mute ? 'Unmute' : 'Mute'}
          </Button>
        </TableCell>
        <TableCell>
          <Button variant="ghost" size="icon" onClick={() => setOpen(!open)} aria-label="expand row">
            {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </Button>
        </TableCell>
      </TableRow>
      {open && (
        <TableRow>
          <TableCell colSpan={6} className="p-0 bg-muted/30">
            <div className="p-4 flex flex-col gap-4">
              <form onSubmit={handleWhisper} className="flex gap-2 items-end">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="whisper">Whisper</Label>
                  <Input
                    required
                    value={whisperMessage}
                    onChange={onChangeWhisperMessage}
                    id="whisper"
                    name="whisper"
                  />
                </div>
                <Button type="submit" variant="default">
                  Send
                </Button>
              </form>
              <div className="flex gap-4">
                <form onSubmit={handleKick} className="flex gap-2 items-end">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="kickReason">Kick Reason</Label>
                    <Input value={kickReason} onChange={onChangeKickReason} id="kickReason" name="kickReason" />
                  </div>
                  <Button type="submit" variant="destructive">
                    Kick
                  </Button>
                </form>
                <form onSubmit={handleBan} className="flex gap-2 items-end">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="banReason">Ban Reason</Label>
                    <Input value={newBan.reason} onChange={onChangeNewBan} id="banReason" name="reason" />
                  </div>
                  <div className="flex flex-col gap-2 w-32">
                    <Label htmlFor="banSeconds">Ban Time (secs)</Label>
                    <Input
                      required
                      value={newBan.seconds}
                      onChange={onChangeNewBan}
                      type="number"
                      id="banSeconds"
                      name="seconds"
                      min={0}
                    />
                  </div>
                  <Button type="submit" variant="destructive">
                    Ban
                  </Button>
                </form>
              </div>
              <div className="font-semibold mb-2">Information</div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Mute</TableHead>
                    <TableHead>Mute Expiration</TableHead>
                    <TableHead>Join Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>{row.admin ? 'Admin' : '-'}</TableCell>
                    <TableCell>{row.permissions.mute ? 'Yes' : 'No'}</TableCell>
                    <TableCell>
                      {row.permissions.muteExpire === 0 ? '-' : convertDate(row.permissions.muteExpire)}
                    </TableCell>
                    <TableCell>{convertDate(row.entrytime.joinDate)}</TableCell>
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
