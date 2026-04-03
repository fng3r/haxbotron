'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import SnackBarNotification from '@/components/Notifications/SnackBarNotification';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { createHostAction, deleteHostAction, updateHostAction } from '@/lib/actions/control';
import { HostNode, HostStatusInfo } from '@/lib/types/control';

const hostFormSchema = z.object({
  id: z.string().trim().min(1, { message: 'ID is required' }),
  name: z.string().trim().min(1, { message: 'Name is required' }),
  baseUrl: z.string().trim().url({ message: 'Base URL must be a valid URL' }),
  enabled: z.boolean(),
});

const hostUpdateSchema = hostFormSchema.omit({ id: true });

type HostFormValues = z.infer<typeof hostFormSchema>;
type HostUpdateValues = z.infer<typeof hostUpdateSchema>;

const emptyHostForm: HostFormValues = {
  id: '',
  name: '',
  baseUrl: '',
  enabled: true,
};

export default function ControlHosts({ hosts }: { hosts: HostStatusInfo[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <CreateHostCard />

      <Card>
        <CardHeader>
          <CardTitle>Hosts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Base URL</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Mapped</TableHead>
                <TableHead>Online</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hosts.map((host) => {
                const isEditing = host.id === editingId;

                return (
                  <TableRow key={host.id}>
                    <TableCell>{host.id}</TableCell>
                    <TableCell colSpan={isEditing ? 6 : 1}>
                      {isEditing ? (
                        <EditingHostRow
                          host={host}
                          onCancel={() => setEditingId(null)}
                          onSaved={() => setEditingId(null)}
                        />
                      ) : (
                        host.name
                      )}
                    </TableCell>
                    {!isEditing && <TableCell>{host.baseUrl}</TableCell>}
                    {!isEditing && <TableCell>{host.healthy ? 'healthy' : 'down'}</TableCell>}
                    {!isEditing && <TableCell>{host.mappedRoomCount}</TableCell>}
                    {!isEditing && <TableCell>{host.onlineMappedRoomCount}</TableCell>}
                    {!isEditing && (
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="secondary" onClick={() => setEditingId(host.id)}>
                            Edit
                          </Button>
                          <DeleteHostButton host={host} />
                        </div>
                        {host.blockingReason && (
                          <p className="mt-2 text-xs text-muted-foreground">{host.blockingReason}</p>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function CreateHostCard() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const form = useForm<HostFormValues>({
    resolver: zodResolver(hostFormSchema),
    defaultValues: emptyHostForm,
  });

  const onSubmit = (values: HostFormValues) => {
    startTransition(() => {
      void createHostAction(values)
        .then((result) => {
          if (!result.ok) {
            SnackBarNotification.error(result.message);
            return;
          }

          SnackBarNotification.success(result.message);
          form.reset(emptyHostForm);
          router.refresh();
        });
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Host</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-4">
            <FormField
              control={form.control}
              name="id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="baseUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base URL</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-end gap-3">
              <FormField
                control={form.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Enabled</FormLabel>
                    <FormControl>
                      <div>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isPending}>
                Add Host
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function EditingHostRow({
  host,
  onCancel,
  onSaved,
}: {
  host: HostStatusInfo;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const form = useForm<HostUpdateValues>({
    resolver: zodResolver(hostUpdateSchema),
    defaultValues: {
      name: host.name,
      baseUrl: host.baseUrl,
      enabled: host.enabled,
    },
  });

  const onSubmit = (values: HostUpdateValues) => {
    startTransition(() => {
      void updateHostAction({ hostId: host.id, payload: values })
        .then((result) => {
          if (!result.ok) {
            SnackBarNotification.error(result.message);
            return;
          }

          SnackBarNotification.success(result.message);
          onSaved();
          router.refresh();
        });
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto_auto]">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="baseUrl"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="enabled"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="flex items-center gap-2">
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                  <span className="text-sm text-muted-foreground">Enabled</span>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button size="sm" type="submit" disabled={isPending}>
          Save
        </Button>
        <Button size="sm" variant="secondary" type="button" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        {host.blockingReason && <p className="text-xs text-muted-foreground md:col-span-5">{host.blockingReason}</p>}
      </form>
    </Form>
  );
}

function DeleteHostButton({ host }: { host: HostStatusInfo }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onDelete = () => {
    startTransition(() => {
      void deleteHostAction(host.id)
        .then((result) => {
          if (!result.ok) {
            SnackBarNotification.error(result.message);
            return;
          }

          SnackBarNotification.success(result.message);
          router.refresh();
        });
    });
  };

  return (
    <Button
      type="button"
      size="sm"
      variant="destructive"
      onClick={onDelete}
      disabled={Boolean(host.blockingReason) || isPending}
      title={host.blockingReason}
    >
      Delete
    </Button>
  );
}
