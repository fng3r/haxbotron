'use client';

import React, { useState } from 'react';

import { HelpCircle, Trash2 } from 'lucide-react';

import SnackBarNotification from '@/components/Notifications/SnackBarNotification';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

import { mutations, queries } from '@/lib/queries/room';

export default function RoomSocial({ ruid }: { ruid: string }) {
  const [newNoticeMessage, setNewNoticeMessage] = useState('');

  const { data: noticeMessage } = queries.getRoomNoticeMessage(ruid);
  const { data: discordWebhookConfig } = queries.getRoomDiscordWebhookConfig(ruid);

  const [newReplaysWebhookID, setNewReplaysWebhookID] = useState(discordWebhookConfig?.replaysWebhookId || '');
  const [newReplaysWebhookToken, setNewReplaysWebhookToken] = useState(discordWebhookConfig?.replaysWebhookToken || '');
  const [newPasswordWebhookID, setNewPasswordWebhookID] = useState(discordWebhookConfig?.passwordWebhookId || '');
  const [newPasswordWebhookToken, setNewPasswordWebhookToken] = useState(
    discordWebhookConfig?.passwordWebhookToken || '',
  );
  const [newDiscordWebhookFeed, setNewDiscordWebhookFeed] = useState(discordWebhookConfig?.feed || false);
  const [newDiscordWebhookReplayUpload, setNewDiscordWebhookReplayUpload] = useState(
    discordWebhookConfig?.replayUpload || false,
  );

  const setNoticeMessageMutation = mutations.setNoticeMessage();
  const deleteNoticeMessageMutation = mutations.deleteNoticeMessage();
  const setDiscordWebhookConfigMutation = mutations.setDiscordWebhookConfig();

  const handleNoticeSet = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setNoticeMessageMutation.mutate(
      { ruid, message: newNoticeMessage },
      {
        onSuccess: () => {
          SnackBarNotification.success('Successfully set notice message.');
          setNewNoticeMessage('');
          localStorage.setItem(`_NoticeMessage`, newNoticeMessage);
        },
        onError: (error) => {
          SnackBarNotification.error(error.message);
        },
      },
    );
  };

  const handleDiscordWebhookSet = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const config = {
      feed: newDiscordWebhookFeed,
      replaysWebhookId: newReplaysWebhookID,
      replaysWebhookToken: newReplaysWebhookToken,
      passwordWebhookId: newPasswordWebhookID,
      passwordWebhookToken: newPasswordWebhookToken,
      replayUpload: newDiscordWebhookReplayUpload,
    };
    setDiscordWebhookConfigMutation.mutate(
      { ruid, config },
      {
        onSuccess: () => {
          SnackBarNotification.success('Discord Webhook configuration updated.');
          localStorage.setItem(
            `_DiscordWebhookConfig`,
            JSON.stringify({
              feed: newDiscordWebhookFeed,
              passwordWebhookId: newPasswordWebhookID,
              passwordWebhookToken: newPasswordWebhookToken,
              replaysWebhookId: newReplaysWebhookID,
              replaysWebhookToken: newReplaysWebhookToken,
              replayUpload: newDiscordWebhookReplayUpload,
            }),
          );
        },
        onError: (error) => {
          SnackBarNotification.error(error.message);
        },
      },
    );
  };

  const onChangeNoticeMessage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewNoticeMessage(e.target.value);
  };

  const onChangeReplaysWebhookID = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewReplaysWebhookID(e.target.value);
  };
  const onChangeReplaysWebhookToken = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewReplaysWebhookToken(e.target.value);
  };
  const onChangePasswordWebhookID = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPasswordWebhookID(e.target.value);
  };
  const onChangePasswordWebhookToken = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPasswordWebhookToken(e.target.value);
  };
  const onChangeDiscordWebhookFeed = (checked: boolean) => {
    setNewDiscordWebhookFeed(checked);
  };
  const onChangeDiscordWebhookReplayUpload = (checked: boolean) => {
    setNewDiscordWebhookReplayUpload(checked);
  };

  const deleteNoticeMessage = async () => {
    deleteNoticeMessageMutation.mutate(
      { ruid },
      {
        onSuccess: () => {
          SnackBarNotification.success('Successfully deleted notice message.');
        },
        onError: (error) => {
          SnackBarNotification.error(error.message);
        },
      },
    );
  };

  const handleNoticeLoad = async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();

    if (localStorage.getItem(`_NoticeMessage`) !== null) {
      setNewNoticeMessage(localStorage.getItem(`_NoticeMessage`)!);
    }
  };

  const handleDiscordWebhookLoad = async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();

    if (localStorage.getItem(`_DiscordWebhookConfig`) !== null) {
      const config = JSON.parse(localStorage.getItem(`_DiscordWebhookConfig`)!);
      setNewReplaysWebhookID(config.replaysWebhookId);
      setNewReplaysWebhookToken(config.replaysWebhookToken);
      setNewPasswordWebhookID(config.passwordWebhookId);
      setNewPasswordWebhookToken(config.passwordWebhookToken);
      setNewDiscordWebhookFeed(config.feed);
      setNewDiscordWebhookReplayUpload(config.replayUpload);
    }
  };

  return (
    <div className="flex flex-col gap-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Notice</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <form className="flex gap-2 w-full" onSubmit={handleNoticeSet} method="post">
            <div className="flex flex-col gap-2 flex-1">
              <Label htmlFor="notice">Notice Message</Label>
              <Input
                required
                id="notice"
                name="notice"
                value={newNoticeMessage}
                onChange={onChangeNoticeMessage}
                autoComplete="off"
              />
            </div>
            <div className="flex gap-2 items-end">
              <Button type="submit" variant="default">
                Update
              </Button>
              <Button type="button" variant="outline" onClick={handleNoticeLoad}>
                Load
              </Button>
            </div>
          </form>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">Current notice:</span>
              <span>{noticeMessage || 'There is no notice message'}</span>
              {noticeMessage && (
                <Button variant="ghost" size="icon" onClick={deleteNoticeMessage} aria-label="delete">
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Discord Webhook</CardTitle>
          <CardDescription>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span>
                Create a webhook in the Discord application and submit your webhook&apos;s ID and Token. (e.g.
                https://discord.com/api/webhooks/id/token)
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  window.open('https://github.com/dapucita/haxbotron/wiki/Discord-Webhook-Configuration', '_blank')
                }
                aria-label="Help"
              >
                <HelpCircle className="size-5" />
              </Button>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4 w-full" onSubmit={handleDiscordWebhookSet} method="post">
            <div className="flex flex-col gap-4 mb-2">
              <div className="flex gap-2 items-center">
                <Label htmlFor="discordWebhookFeed">Enable</Label>
                <Switch
                  id="discordWebhookFeed"
                  name="discordWebhookFeed"
                  checked={newDiscordWebhookFeed}
                  onCheckedChange={onChangeDiscordWebhookFeed}
                />
              </div>
              <div className="ml-1 flex gap-2 items-center">
                <Label htmlFor="discordWebhookReplayUpload">Replay Upload</Label>
                <Switch
                  id="discordWebhookReplayUpload"
                  name="discordWebhookReplayUpload"
                  checked={newDiscordWebhookReplayUpload}
                  onCheckedChange={onChangeDiscordWebhookReplayUpload}
                  disabled={!newDiscordWebhookFeed}
                />
              </div>
            </div>
            <div className="flex flex-col md:flex-row flex-wrap gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="discordReplaysWebhookID">Replays Webhook ID</Label>
                <Input
                  id="discordReplaysWebhookID"
                  name="discordReplaysWebhookID"
                  value={newReplaysWebhookID}
                  onChange={onChangeReplaysWebhookID}
                  autoComplete="off"
                />
              </div>
              <div className="flex flex-col gap-2 flex-1">
                <Label htmlFor="discordReplaysWebhookToken">Replays Webhook Token</Label>
                <Input
                  id="discordReplaysWebhookToken"
                  name="discordReplaysWebhookToken"
                  value={newReplaysWebhookToken}
                  onChange={onChangeReplaysWebhookToken}
                  autoComplete="off"
                />
              </div>
            </div>
            <div className="flex flex-col md:flex-row flex-wrap gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="discordPasswordWebhookID">Password Webhook ID</Label>
                <Input
                  id="discordPasswordWebhookID"
                  name="discordPasswordWebhookID"
                  value={newPasswordWebhookID}
                  onChange={onChangePasswordWebhookID}
                  autoComplete="off"
                />
              </div>
              <div className="flex flex-col gap-2 flex-1">
                <Label htmlFor="discordPasswordWebhookToken">Password Webhook Token</Label>
                <Input
                  id="discordPasswordWebhookToken"
                  name="discordPasswordWebhookToken"
                  value={newPasswordWebhookToken}
                  onChange={onChangePasswordWebhookToken}
                  autoComplete="off"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <Button type="submit" variant="default">
                Apply
              </Button>
              <Button type="button" variant="outline" onClick={handleDiscordWebhookLoad}>
                Load
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
