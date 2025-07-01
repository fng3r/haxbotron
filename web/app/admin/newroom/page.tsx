'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { ExternalLink, Hourglass } from 'lucide-react';
import { z } from 'zod';

import SnackBarNotification from '@/components/Notifications/SnackBarNotification';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

import { BrowserHostRoomSettings } from '@/../core/lib/browser.hostconfig';
import DefaultConfigSet from '@/lib/defaultroomconfig.json';
import { mutations } from '@/lib/queries/room';

const stringifySettings = (settings: BrowserHostRoomSettings) => {
  return JSON.stringify(settings, null, 4);
};

const roomFormSchema = z.object({
  ruid: z.string().min(1, { message: 'RUID is required' }),
  token: z.string().min(1, { message: 'Headless Token is required' }),
  roomName: z.string().min(1, { message: 'Room Title is required' }),
  password: z.string().optional(),
  maxPlayers: z.coerce.number().min(1).max(30),
  public: z.boolean(),
  timeLimit: z.coerce.number().min(0).max(14),
  scoreLimit: z.coerce.number().min(0).max(14),
  defaultMapName: z.string().min(1, { message: 'Default Map Name is required' }),
  teamLock: z.boolean(),
  autoAdmin: z.boolean(),
  whitelistEnabled: z.boolean(),
  settings: z.string().refine(
    (val) => {
      try {
        JSON.parse(val);
        return true;
      } catch {
        return false;
      }
    },
    { message: 'Settings must be valid JSON' },
  ),
});

type RoomFormValues = z.infer<typeof roomFormSchema>;

export default function RoomCreate() {
  const router = useRouter();

  const form = useForm<RoomFormValues>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      ruid: DefaultConfigSet.ruid,
      token: DefaultConfigSet._config.token,
      roomName: DefaultConfigSet._config.roomName,
      password: DefaultConfigSet._config.password,
      maxPlayers: DefaultConfigSet._config.maxPlayers,
      public: DefaultConfigSet._config.public,
      timeLimit: DefaultConfigSet.rules.timeLimit,
      scoreLimit: DefaultConfigSet.rules.scoreLimit,
      defaultMapName: DefaultConfigSet.rules.defaultMapName,
      teamLock: DefaultConfigSet.rules.teamLock,
      autoAdmin: DefaultConfigSet.rules.autoAdmin,
      whitelistEnabled: DefaultConfigSet.rules.whitelistEnabled,
      settings: stringifySettings(DefaultConfigSet.settings),
    },
  });

  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem('_savedRoomInfo');
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        form.reset({
          ruid: config.ruid,
          token: config._config.token,
          roomName: config._config.roomName,
          password: config._config.password,
          maxPlayers: config._config.maxPlayers,
          public: config._config.public,
          timeLimit: config.rules.timeLimit,
          scoreLimit: config.rules.scoreLimit,
          defaultMapName: config.rules.defaultMapName,
          teamLock: config.rules.teamLock,
          autoAdmin: config.rules.autoAdmin,
          whitelistEnabled: config.rules.whitelistEnabled,
          settings: stringifySettings(config.settings),
        });
      }
    } catch (error) {
      console.error(`Error loading room config from localStorage:`, error);
    }
  }, [form]);

  const createRoomMutation = mutations.createRoom();

  const onSubmit = (values: RoomFormValues) => {
    const roomConfigComplex = {
      ruid: values.ruid,
      _config: {
        roomName: values.roomName,
        password: values.password,
        maxPlayers: values.maxPlayers,
        public: values.public,
        token: values.token,
        noPlayer: DefaultConfigSet._config.noPlayer,
        playerName: DefaultConfigSet._config.playerName,
      },
      rules: {
        timeLimit: values.timeLimit,
        scoreLimit: values.scoreLimit,
        teamLock: values.teamLock,
        autoAdmin: values.autoAdmin,
        whitelistEnabled: values.whitelistEnabled,
        defaultMapName: values.defaultMapName,
      },
      settings: JSON.parse(values.settings),
    };

    createRoomMutation.mutate(roomConfigComplex, {
      onSuccess: () => {
        SnackBarNotification.success(`Room '${roomConfigComplex.ruid}' has been created.`);
        localStorage.setItem('_savedRoomInfo', JSON.stringify(roomConfigComplex));
        router.push('/admin/roomlist');
      },
      onError: (error) => {
        SnackBarNotification.error(error.message);
      },
    });
  };

  const handleJSONBeautify = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();

    try {
      const settings = form.getValues('settings');
      const beautifiedSettings = stringifySettings(JSON.parse(settings));
      form.setValue('settings', beautifiedSettings);
    } catch (error) {
      console.error('Failed to stringify settings:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Game Room</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="w-full flex flex-col gap-4 justify-center" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex gap-4">
              <Button type="submit" className="flex-1" disabled={createRoomMutation.isPending}>
                {createRoomMutation.isPending ? (
                  <>
                    <Hourglass className="size-4" />
                    The room is launching. Please, wait
                  </>
                ) : (
                  'Create'
                )}
              </Button>
            </div>
            <Separator />

            {/* Room Configuration */}
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-primary mb-2">Room Configuration</h2>
                <p className="text-sm font-medium text-muted-foreground mb-4">
                  Do not reuse the same RUID and token if they are already in use.
                </p>
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <FormField
                  control={form.control}
                  name="ruid"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2">
                      <FormLabel>RUID</FormLabel>
                      <FormControl>
                        <Input {...field} autoFocus />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex grow-1 gap-2 md:max-w-100">
                  <FormField
                    control={form.control}
                    name="token"
                    render={({ field }) => (
                      <FormItem className="flex flex-col flex-1 gap-2">
                        <FormLabel>Headless Token</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => window.open('https://www.haxball.com/headlesstoken', '_blank')}
                    >
                      <ExternalLink className="size-5" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <FormField
                  control={form.control}
                  name="roomName"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2">
                      <FormLabel>Room Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2">
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maxPlayers"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2">
                      <FormLabel>Max Players</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-14">
                <FormField
                  control={form.control}
                  name="public"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-3">
                      <FormLabel>Public</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} className="cursor-pointer" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="autoAdmin"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-3">
                      <FormLabel>Auto Admin</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} className="cursor-pointer" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="whitelistEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-3">
                      <FormLabel>Whitelist</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} className="cursor-pointer" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <Separator />

            {/* Game Rules */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-primary">Game Rules</h2>

              <div className="flex flex-col md:flex-row gap-4">
                <FormField
                  control={form.control}
                  name="timeLimit"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2">
                      <FormLabel>Time Limit</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" required />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="scoreLimit"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2">
                      <FormLabel>Score Limit</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" required />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="defaultMapName"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2">
                      <FormLabel>Default Map</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a map" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="big">Big</SelectItem>
                            <SelectItem value="bigeasy">Big Easy</SelectItem>
                            <SelectItem value="classic">Classic</SelectItem>
                            <SelectItem value="gbhotclassic">GB Hot Classic</SelectItem>
                            <SelectItem value="gbhotbig">GB Hot Big</SelectItem>
                            <SelectItem value="realsoccer">Real Soccer</SelectItem>
                            <SelectItem value="futsal1v1">Futsal 1v1</SelectItem>
                            <SelectItem value="futsal4v4">Futsal 4v4</SelectItem>
                            <SelectItem value="bff4v4">BFF 4v4</SelectItem>
                            <SelectItem value="icebear">Ice Bear</SelectItem>
                            <SelectItem value="6man">6 Man</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="teamLock"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-4">
                      <FormLabel>Team Lock</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} className="cursor-pointer" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Bot Settings */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-primary">Bot Settings</h2>

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="settings"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2">
                      <FormLabel>Configuration</FormLabel>
                      <FormControl>
                        <Textarea {...field} className="min-h-[200px]" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div>
                  <Button type="button" variant="outline" onClick={handleJSONBeautify}>
                    Beautify JSON
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
