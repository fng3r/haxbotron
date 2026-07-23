'use client';

import { useForm } from 'react-hook-form';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { ExternalLink, LoaderCircle, Plus, Rocket, Save, Trash2, TriangleAlert } from 'lucide-react';
import { z } from 'zod';

import SnackBarNotification from '@/components/Notifications/SnackBarNotification';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

import DefaultConfig from '@/lib/defaultroomconfig.json';
import { mutations, queries } from '@/lib/queries/room';
import type { ManagedRoomInfo, RoomMapping } from '@/lib/types/control';
import type { PersistedRoomConfig } from '@/lib/types/room';

const schema = z.object({
  ruid: z.string().min(1, 'RUID is required'),
  token: z.string().min(1, 'Headless token is required'),
  roomName: z.string().min(1, 'Room title is required'),
  password: z.string().optional(),
  maxPlayers: z.coerce.number().min(1).max(30),
  public: z.boolean(),
  timeLimit: z.coerce.number().min(0).max(14),
  scoreLimit: z.coerce.number().min(0).max(14),
  defaultMapName: z.string().min(1),
  teamLock: z.boolean(),
  autoAdmin: z.boolean(),
  whitelistEnabled: z.boolean(),
  settings: z.string().refine((value) => {
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  }, 'Settings must be valid JSON'),
  geoEnabled: z.boolean(),
  geoCode: z.string(),
  geoLat: z.coerce.number(),
  geoLon: z.coerce.number(),
  discordFeed: z.boolean(),
  replayUpload: z.boolean(),
  replaysWebhookId: z.string(),
  replaysWebhookToken: z.string(),
  passwordWebhookId: z.string(),
  passwordWebhookToken: z.string(),
});
type Values = z.infer<typeof schema>;

const template = (): PersistedRoomConfig => ({
  ...DefaultConfig,
  discordWebhook: {
    feed: false,
    replayUpload: false,
    replaysWebhookId: '',
    replaysWebhookToken: '',
    passwordWebhookId: '',
    passwordWebhookToken: '',
  },
});

function valuesFrom(config: PersistedRoomConfig): Values {
  return {
    ruid: config.ruid,
    token: config._config.token,
    roomName: config._config.roomName,
    password: config._config.password ?? '',
    maxPlayers: config._config.maxPlayers,
    public: config._config.public,
    timeLimit: config.rules.timeLimit,
    scoreLimit: config.rules.scoreLimit,
    defaultMapName: config.rules.defaultMapName,
    teamLock: config.rules.teamLock,
    autoAdmin: config.rules.autoAdmin,
    whitelistEnabled: config.rules.whitelistEnabled,
    settings: JSON.stringify(config.settings, null, 2),
    geoEnabled: Boolean(config._config.geo),
    geoCode: config._config.geo?.code ?? 'KR',
    geoLat: config._config.geo?.lat ?? 37.5665,
    geoLon: config._config.geo?.lon ?? 126.978,
    discordFeed: config.discordWebhook?.feed ?? false,
    replayUpload: config.discordWebhook?.replayUpload ?? false,
    replaysWebhookId: config.discordWebhook?.replaysWebhookId ?? '',
    replaysWebhookToken: config.discordWebhook?.replaysWebhookToken ?? '',
    passwordWebhookId: config.discordWebhook?.passwordWebhookId ?? '',
    passwordWebhookToken: config.discordWebhook?.passwordWebhookToken ?? '',
  };
}

function configFrom(v: Values): PersistedRoomConfig {
  return {
    ruid: v.ruid,
    _config: {
      roomName: v.roomName,
      playerName: DefaultConfig._config.playerName,
      password: v.password,
      maxPlayers: v.maxPlayers,
      public: v.public,
      token: v.token,
      noPlayer: DefaultConfig._config.noPlayer,
      ...(v.geoEnabled ? { geo: { code: v.geoCode, lat: v.geoLat, lon: v.geoLon } } : {}),
    },
    rules: {
      timeLimit: v.timeLimit,
      scoreLimit: v.scoreLimit,
      defaultMapName: v.defaultMapName,
      teamLock: v.teamLock,
      autoAdmin: v.autoAdmin,
      whitelistEnabled: v.whitelistEnabled,
    },
    settings: JSON.parse(v.settings),
    discordWebhook: {
      feed: v.discordFeed,
      replayUpload: v.replayUpload,
      replaysWebhookId: v.replaysWebhookId,
      replaysWebhookToken: v.replaysWebhookToken,
      passwordWebhookId: v.passwordWebhookId,
      passwordWebhookToken: v.passwordWebhookToken,
    },
  };
}

const Toggle = ({
  form,
  name,
  label,
}: {
  form: ReturnType<typeof useForm<Values>>;
  name: keyof Values;
  label: string;
}) => (
  <FormField
    control={form.control}
    name={name as 'public'}
    render={({ field }) => (
      <FormItem className="flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2">
        <FormLabel>{label}</FormLabel>
        <FormControl>
          <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} />
        </FormControl>
      </FormItem>
    )}
  />
);

export default function RoomConfigWorkspace({
  mappings = [],
  manageOnly = false,
  initialConfigs = [],
}: {
  mappings?: Array<RoomMapping & ManagedRoomInfo>;
  manageOnly?: boolean;
  initialConfigs?: PersistedRoomConfig[];
}) {
  const router = useRouter();
  const configs = queries.getRoomConfigs(initialConfigs);
  const create = mutations.createRoom();
  const save = mutations.saveRoomConfig();
  const remove = mutations.deleteRoomConfig();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: valuesFrom(initialConfigs[0] ?? template()),
  });
  const ruid = form.watch('ruid');
  const selectedConfigRuid = configs.data?.find((config) => config.ruid === ruid)?.ruid ?? '';
  const assigned = mappings.find((item) => item.ruid === ruid);
  const selectConfig = (id: string) => {
    const found = configs.data?.find((item) => item.ruid === id);
    if (found) {
      form.reset(valuesFrom(found));
    }
  };
  const resetToTemplate = () => {
    form.reset(valuesFrom(template()));
  };
  const submit = (values: Values) => {
    const config = configFrom(values);
    if (manageOnly)
      save.mutate(config, {
        onSuccess: () => SnackBarNotification.success(`Configuration '${config.ruid}' saved.`),
        onError: (e) => SnackBarNotification.error(e.message),
      });
    else {
      if (!assigned) return SnackBarNotification.error(`RUID '${config.ruid}' is not assigned to a host.`);
      create.mutate(config, {
        onSuccess: () => {
          SnackBarNotification.success(`Room '${config.ruid}' launched and configuration saved.`);
          router.push('/admin/roomlist');
        },
        onError: (e) => SnackBarNotification.error(e.message),
      });
    }
  };
  const busy = create.isPending || save.isPending || remove.isPending;

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden border-primary/20">
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <CardTitle>{manageOnly ? 'Room configurations' : 'Launch a room'}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Select existing room config or create new one from the template
                <br></br>
                <span className="font-extrabold">Note:</span> configs are updated automatically on room launch
              </p>
            </div>
            <div className="flex w-full flex-col self-end gap-2 sm:flex-row lg:w-auto">
              <Select onValueChange={selectConfig} value={selectedConfigRuid}>
                <SelectTrigger className="w-full sm:w-56">
                  <SelectValue placeholder={configs.isLoading ? 'Loading rooms…' : 'Choose room'} />
                </SelectTrigger>
                <SelectContent>
                  {configs.data?.map((c) => (
                    <SelectItem key={c.ruid} value={c.ruid}>
                      {c.ruid} · {c._config.roomName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button className="w-full sm:w-auto" variant="outline" onClick={resetToTemplate}>
                <Plus />
                New from template
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>
      {manageOnly && (
        <Alert className="border-amber-500/40 bg-amber-500/5">
          <TriangleAlert className="text-amber-500" />
          <AlertTitle>Relaunch required</AlertTitle>
          <AlertDescription>
            Saved changes are applied to a room the next time it is launched. Relaunch any currently running room to use
            its updated configuration.
          </AlertDescription>
        </Alert>
      )}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(submit)} className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Identity & host</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              {(['ruid', 'roomName', 'password'] as const).map((name) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{{ ruid: 'RUID', roomName: 'Room title', password: 'Password' }[name]}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
              <FormField
                control={form.control}
                name="token"
                render={({ field }) => (
                  <FormItem className="self-start md:col-span-2">
                    <FormLabel>Headless token</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => window.open('https://www.haxball.com/headlesstoken', '_blank')}
                      >
                        <ExternalLink />
                      </Button>
                    </div>
                    <FormDescription>Do not reuse the same token for multiple rooms</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxPlayers"
                render={({ field }) => (
                  <FormItem className="self-start">
                    <FormLabel>Max players</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-2 md:col-span-3 sm:grid-cols-3">
                <Toggle form={form} name="public" label="Public" />
                <Toggle form={form} name="whitelistEnabled" label="Whitelist" />
                <Toggle form={form} name="autoAdmin" label="Auto admin" />
              </div>
              {!manageOnly && (
                <p className={`md:col-span-3 text-sm ${assigned ? 'text-muted-foreground' : 'text-destructive'}`}>
                  {assigned
                    ? `Assigned host: ${assigned.hostName || assigned.hostId}`
                    : 'No host mapping exists for this RUID.'}
                </p>
              )}
            </CardContent>
          </Card>
          <div className="grid gap-5 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Game rules</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                {(['timeLimit', 'scoreLimit'] as const).map((name) => (
                  <FormField
                    key={name}
                    control={form.control}
                    name={name}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{{ timeLimit: 'Time limit', scoreLimit: 'Score limit' }[name]}</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
                <FormField
                  control={form.control}
                  name="defaultMapName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default map</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a map" />
                          </SelectTrigger>
                        </FormControl>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="self-end">
                  <Toggle form={form} name="teamLock" label="Lock teams" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Geolocation override</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-3">
                  <Toggle form={form} name="geoEnabled" label="Override room location" />
                </div>
                {(['geoCode', 'geoLat', 'geoLon'] as const).map((name) => (
                  <FormField
                    key={name}
                    control={form.control}
                    name={name}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {{ geoCode: 'Country code', geoLat: 'Latitude', geoLon: 'Longitude' }[name]}
                        </FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!form.watch('geoEnabled')} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Discord webhooks</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Toggle form={form} name="discordFeed" label="Enable Discord integration" />
              <Toggle form={form} name="replayUpload" label="Upload replays" />
              {(['replaysWebhookId', 'replaysWebhookToken', 'passwordWebhookId', 'passwordWebhookToken'] as const).map(
                (name) => (
                  <FormField
                    key={name}
                    control={form.control}
                    name={name}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {
                            {
                              replaysWebhookId: 'Replays webhook ID',
                              replaysWebhookToken: 'Replays webhook token',
                              passwordWebhookId: 'Password webhook ID',
                              passwordWebhookToken: 'Password webhook token',
                            }[name]
                          }
                        </FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ),
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Advanced bot settings</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="settings"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea {...field} className="min-h-64 font-mono text-xs" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          <div className="sticky bottom-4 flex gap-2 rounded-xl border bg-background/90 p-3 shadow-xl backdrop-blur">
            <Button className="flex-1" type="submit" disabled={busy}>
              {busy ? <LoaderCircle className="animate-spin" /> : manageOnly ? <Save /> : <Rocket />}
              {manageOnly ? 'Save configuration' : 'Launch room'}
            </Button>
            {manageOnly && selectedConfigRuid && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button type="button" variant="destructive" disabled={busy}>
                    <Trash2 />
                    Delete
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete room configuration?</DialogTitle>
                    <DialogDescription>
                      Configuration for room <span className="font-medium text-foreground">{selectedConfigRuid}</span>{' '}
                      will be permanently deleted. This action cannot be undone
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline" disabled={remove.isPending}>
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={remove.isPending}
                      onClick={() =>
                        remove.mutate(selectedConfigRuid, {
                          onSuccess: () => {
                            SnackBarNotification.success('Configuration deleted.');
                            resetToTemplate();
                          },
                          onError: (error) => SnackBarNotification.error(error.message),
                        })
                      }
                    >
                      {remove.isPending ? <LoaderCircle className="animate-spin" /> : <Trash2 />}
                      Delete configuration
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
