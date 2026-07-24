'use client';

import React, { useState } from 'react';

import { useRouter } from 'next/navigation';

import { ExternalLink, LoaderCircle, LucideAlertCircle, Power, RotateCw, TriangleAlert } from 'lucide-react';

import SnackBarNotification from '@/components/Notifications/SnackBarNotification';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CopyButton } from '@/components/ui/copy-button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

import { mutations, queries } from '@/lib/queries/room';
import type { PersistedRoomConfig } from '@/lib/types/room';

export default function RoomGeneral({ ruid, roomConfig }: { ruid: string; roomConfig: PersistedRoomConfig }) {
  const router = useRouter();
  const { data: roomInfo, error: roomInfoError } = queries.getRoomInfo(ruid);
  const roomInfoJSON = JSON.stringify(roomInfo, null, 4);

  const [password, setPassword] = useState(roomInfo?._roomConfig?.password ?? '');
  const [reuseCurrentToken, setReuseCurrentToken] = useState(false);
  const [relaunchToken, setRelaunchToken] = useState('');
  const [relaunchDialogOpen, setRelaunchDialogOpen] = useState(false);

  if (roomInfoError) {
    SnackBarNotification.error(roomInfoError.message);
  }

  const { data: freezeStatus, error: freezeStatusError } = queries.getRoomFreezeStatus(ruid);

  // Mutations
  const setPasswordMutation = mutations.setPassword();
  const clearPasswordMutation = mutations.clearPassword();
  const toggleFreezeMutation = mutations.toggleFreeze();
  const shutdownRoomMutation = mutations.shutdownRoom();
  const relaunchRoomMutation = mutations.relaunchRoom();

  const handleShutdown = () => {
    shutdownRoomMutation.mutate(ruid, {
      onSuccess: () => {
        SnackBarNotification.success('Room closed successfully.');
        router.push('/admin/roomlist');
      },
      onError: (error) => SnackBarNotification.error(error.message),
    });
  };

  const currentToken = roomInfo?._roomConfig?.token ?? '';
  const onlinePlayers = roomInfo?.onlinePlayers ?? 0;
  const effectiveRelaunchToken = reuseCurrentToken ? currentToken : relaunchToken;
  const handleRelaunch = () => {
    if (!effectiveRelaunchToken) return;
    relaunchRoomMutation.mutate(
      { ...roomConfig, ruid, _config: { ...roomConfig._config, token: effectiveRelaunchToken } },
      {
        onSuccess: () => {
          SnackBarNotification.success('Room relaunched successfully.');
          setPassword(roomConfig._config.password ?? '');
          setRelaunchDialogOpen(false);
          setRelaunchToken('');
          setReuseCurrentToken(false);
        },
        onError: (error) => SnackBarNotification.error(error.message),
      },
    );
  };

  const onChangePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleSetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setPasswordMutation.mutateAsync(
      { ruid, password },
      {
        onSuccess: () => {
          SnackBarNotification.success(`Successfully set password (pass: ${password}).`);
        },
        onError: (error: Error) => {
          SnackBarNotification.error(error.message);
        },
      },
    );
  };

  const handleClearPassword = async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();

    clearPasswordMutation.mutateAsync(
      { ruid },
      {
        onSuccess: () => {
          SnackBarNotification.success('Successfully cleared password.');
          setPassword('');
        },
        onError: (error: Error) => {
          SnackBarNotification.error(error.message);
        },
      },
    );
  };

  const handleFreezeChat = async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();

    toggleFreezeMutation.mutateAsync(
      { ruid, freezeStatus: freezeStatus! },
      {
        onSuccess: () => {
          SnackBarNotification.success(
            freezeStatus ? 'Successfully unfreezed whole chat.' : 'Successfully freezed whole chat.',
          );
        },
        onError: (error: Error) => {
          SnackBarNotification.error(error.message);
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {roomInfo?.isOnline === false && (
        <Alert variant="destructive">
          <LucideAlertCircle className="size-5" />
          <AlertTitle>Room is offline</AlertTitle>
        </Alert>
      )}
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
          <CardTitle>General</CardTitle>
          <div className="flex gap-2">
            <Dialog open={relaunchDialogOpen} onOpenChange={setRelaunchDialogOpen}>
              <DialogTrigger asChild>
                <Button type="button" variant="outline" disabled={roomInfo?.isOnline === false}>
                  <RotateCw />
                  Relaunch
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Relaunch room?</DialogTitle>
                  <DialogDescription>
                    The room will close and reopen with the same configuration.
                    <br></br>
                    Supply a fresh token unless the current token is still valid (token expires in ~30 minutes)
                  </DialogDescription>
                </DialogHeader>
                {onlinePlayers > 0 && (
                  <Alert className="border-amber-500/40 bg-amber-500/5">
                    <TriangleAlert className="text-amber-500" />
                    <AlertTitle>Room is not empty</AlertTitle>
                    <AlertDescription>
                      {onlinePlayers} {onlinePlayers === 1 ? 'player is' : 'players are'} currently in the room and will
                      be disconnected during the relaunch
                    </AlertDescription>
                  </Alert>
                )}
                <div className="grid gap-4 py-2">
                  <div className="flex items-center justify-between gap-4 rounded-lg border px-3 py-2">
                    <Label htmlFor="reuse-current-token">Reuse current token</Label>
                    <Switch
                      id="reuse-current-token"
                      checked={reuseCurrentToken}
                      onCheckedChange={setReuseCurrentToken}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="relaunch-token">Headless token</Label>
                    <div className="flex gap-2">
                      <Input
                        id="relaunch-token"
                        value={reuseCurrentToken ? currentToken : relaunchToken}
                        onChange={(event) => setRelaunchToken(event.target.value)}
                        disabled={reuseCurrentToken}
                        readOnly={reuseCurrentToken}
                        placeholder="Paste a fresh headless token"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => window.open('https://www.haxball.com/headlesstoken', '_blank')}
                      >
                        <ExternalLink />
                        <span className="sr-only">Get a headless token</span>
                      </Button>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline" disabled={relaunchRoomMutation.isPending}>
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    type="button"
                    disabled={!effectiveRelaunchToken || relaunchRoomMutation.isPending}
                    onClick={handleRelaunch}
                  >
                    {relaunchRoomMutation.isPending ? <LoaderCircle className="animate-spin" /> : <RotateCw />}
                    Relaunch room
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog>
              <DialogTrigger asChild>
                <Button type="button" variant="destructive" disabled={roomInfo?.isOnline === false}>
                  <Power />
                  Close room
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Close room?</DialogTitle>
                  <DialogDescription>
                    Room <span className="font-medium text-foreground">{ruid}</span> will be shut down immediately and
                    all connected players will be disconnected.
                  </DialogDescription>
                </DialogHeader>
                {onlinePlayers > 0 && (
                  <Alert className="border-amber-500/40 bg-amber-500/5">
                    <TriangleAlert className="text-amber-500" />
                    <AlertTitle>Room is not empty</AlertTitle>
                    <AlertDescription>
                      {onlinePlayers} {onlinePlayers === 1 ? 'player is' : 'players are'} currently in the room and will
                      be disconnected when the room closes
                    </AlertDescription>
                  </Alert>
                )}
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline" disabled={shutdownRoomMutation.isPending}>
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={shutdownRoomMutation.isPending}
                    onClick={handleShutdown}
                  >
                    {shutdownRoomMutation.isPending ? <LoaderCircle className="animate-spin" /> : <Power />}
                    Close room
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 max-w-80">
            <div className="flex flex-col gap-2 flex-1">
              <Label htmlFor="host-id">Assigned host</Label>
              <Input value={roomInfo?.hostName || roomInfo?.hostId || ''} id="host-id" name="host-id" readOnly />
            </div>
            <Button
              type="button"
              variant="default"
              onClick={handleFreezeChat}
              disabled={freezeStatusError !== null}
              className="w-fit"
            >
              {freezeStatus ? 'Unfreeze Chat' : 'Freeze Chat'}
            </Button>
            <form className="flex gap-2 w-full md:w-auto" onSubmit={handleSetPassword} method="post">
              <div className="flex flex-col gap-2 flex-1">
                <Label htmlFor="password">Password</Label>
                <Input
                  required
                  value={password}
                  onChange={onChangePassword}
                  id="password"
                  name="password"
                  autoComplete="off"
                />
              </div>
              <div className="flex gap-2 items-end">
                <Button type="submit" variant="default">
                  Set
                </Button>
                <Button type="button" variant="secondary" onClick={handleClearPassword}>
                  Clear
                </Button>
              </div>
            </form>
            <div className="flex flex-col gap-2 flex-1">
              <Label htmlFor="admin-password">Admin password</Label>
              <div className="flex gap-2 items-center">
                <Input value={roomInfo?.adminPassword || ''} id="admin-password" name="admin-password" readOnly />
                <CopyButton text={roomInfo?.adminPassword || ''} />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="roomInfoJSONText">JSON Data</Label>
            <Textarea
              value={roomInfoJSON}
              id="roomInfoJSONText"
              name="roomInfoJSONText"
              readOnly
              className="font-mono"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
