'use client';

import React, { useState } from 'react';

import { LucideAlertCircle } from 'lucide-react';

import SnackBarNotification from '@/components/Notifications/SnackBarNotification';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CopyButton } from '@/components/ui/copy-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { mutations, queries } from '@/lib/queries/room';

export default function RoomInfo({ ruid }: { ruid: string }) {
  const { data: roomInfo, error: roomInfoError } = queries.getRoomInfo(ruid);
  const roomInfoJSON = JSON.stringify(roomInfo, null, 4);

  const [password, setPassword] = useState(roomInfo?._roomConfig?.password ?? '');

  if (roomInfoError) {
    SnackBarNotification.error(roomInfoError.message);
  }

  const { data: freezeStatus, error: freezeStatusError } = queries.getRoomFreezeStatus(ruid);

  // Mutations
  const setPasswordMutation = mutations.setPassword();
  const clearPasswordMutation = mutations.clearPassword();
  const toggleFreezeMutation = mutations.toggleFreeze();

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
        <CardHeader>
          <CardTitle>Room Information</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 max-w-80">
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
