'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { z } from 'zod';

import SnackBarNotification from '@/components/Notifications/SnackBarNotification';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CopyButton } from '@/components/ui/copy-button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { Player } from '@/../core/game/model/GameObject/Player';
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

const whisperSchema = z.object({
  whisper: z.string().min(1, { message: 'Message is required' }),
});
const kickSchema = z.object({
  kickReason: z.string().optional(),
});
const banSchema = z.object({
  banReason: z.string().optional(),
  duration: z.coerce.number().min(1, { message: 'Ban duration must be positive' }),
});

function OnlinePlayerRow(props: { ruid: string; row: Player }) {
  const { ruid, row } = props;
  const [open, setOpen] = useState(false);
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

  const whisperForm = useForm<z.infer<typeof whisperSchema>>({
    resolver: zodResolver(whisperSchema),
    defaultValues: { whisper: '' },
  });
  const kickForm = useForm<z.infer<typeof kickSchema>>({
    resolver: zodResolver(kickSchema),
    defaultValues: { kickReason: '' },
  });
  const banForm = useForm<z.infer<typeof banSchema>>({
    resolver: zodResolver(banSchema),
    defaultValues: { banReason: '', duration: 5 },
  });

  const handleMute = async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
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

  const handleKick = async (reason?: string) => {
    kickPlayerMutation.mutate(
      { ruid, player: row, reason },
      {
        onSuccess: () => {
          SnackBarNotification.success(`Player ${row.name} has been kicked.`);
        },
        onError: (error) => {
          SnackBarNotification.error(error.message);
        },
      },
    );
  };

  const handleWhisper = async (message: string) => {
    sendWhisperMutation.mutate(
      { ruid, player: row, message },
      {
        onSuccess: () => {
          SnackBarNotification.success(`Successfully sent whisper message to ${row.name}.`);
        },
        onError: (error) => {
          SnackBarNotification.error(error.message);
        },
      },
    );
  };

  const handleBan = async (banOptions: BanOptions) => {
    banPlayerMutation.mutate(
      { ruid, player: row, banOptions },
      {
        onSuccess: () => {
          SnackBarNotification.success(`Player ${row.name} has been banned.`);
        },
        onError: (error) => {
          SnackBarNotification.error(error.message);
        },
      },
    );
  };

  const onWhisper = (values: z.infer<typeof whisperSchema>) => {
    handleWhisper(values.whisper);
    whisperForm.reset();
  };
  const onKick = (values: z.infer<typeof kickSchema>) => {
    handleKick(values.kickReason);
    kickForm.reset();
  };
  const onBan = (values: z.infer<typeof banSchema>) => {
    handleBan({ reason: values.banReason, seconds: values.duration * 60 });
    banForm.reset();
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
          <Button size="sm" type="button" variant="ghost" onClick={handleMute}>
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
              <Form {...whisperForm}>
                <form onSubmit={whisperForm.handleSubmit(onWhisper)} className="flex gap-2">
                  <FormField
                    control={whisperForm.control}
                    name="whisper"
                    render={({ field }) => (
                      <FormItem className="flex flex-col gap-2">
                        <FormLabel>Whisper</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" variant="default" className="mt-5.5">
                    Send
                  </Button>
                </form>
              </Form>
              <div className="flex gap-4 flex-col md:flex-row">
                <Form {...kickForm}>
                  <form onSubmit={kickForm.handleSubmit(onKick)} className="flex gap-2">
                    <FormField
                      control={kickForm.control}
                      name="kickReason"
                      render={({ field }) => (
                        <FormItem className="flex flex-col gap-2">
                          <FormLabel>Kick Reason</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" variant="destructive" className="mt-5.5">
                      Kick
                    </Button>
                  </form>
                </Form>
                <Form {...banForm}>
                  <form onSubmit={banForm.handleSubmit(onBan)} className="flex gap-2">
                    <FormField
                      control={banForm.control}
                      name="banReason"
                      render={({ field }) => (
                        <FormItem className="flex flex-col gap-2">
                          <FormLabel>Ban Reason</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={banForm.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem className="flex flex-col gap-2 w-40">
                          <FormLabel>Ban Duration (mins)</FormLabel>
                          <FormControl>
                            <Input type="number" min={1} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" variant="destructive" className="mt-5.5">
                      Ban
                    </Button>
                  </form>
                </Form>
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
