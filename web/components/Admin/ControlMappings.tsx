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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { createMappingAction, deleteMappingAction, updateMappingAction } from '@/lib/actions/control';
import { HostStatusInfo, ManagedRoomInfo, RoomMapping } from '@/lib/types/control';

const mappingFormSchema = z.object({
  ruid: z.string().trim().min(1, { message: 'RUID is required' }),
  hostId: z.string().trim().min(1, { message: 'Host is required' }),
});

type MappingFormValues = z.infer<typeof mappingFormSchema>;

const emptyMappingForm: MappingFormValues = {
  ruid: '',
  hostId: '',
};

export default function ControlMappings({
  hosts,
  mappings,
}: {
  hosts: HostStatusInfo[];
  mappings: Array<RoomMapping & ManagedRoomInfo>;
}) {
  const [editingRuid, setEditingRuid] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <CreateMappingCard hosts={hosts} />

      <Card>
        <CardHeader>
          <CardTitle>RUID Mappings</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>RUID</TableHead>
                <TableHead>Host</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Integrity</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappings.map((mapping) => {
                const isEditing = editingRuid === mapping.ruid;

                return (
                  <TableRow key={mapping.ruid}>
                    <TableCell>{mapping.ruid}</TableCell>
                    {isEditing ? (
                      <TableCell colSpan={4}>
                        <EditingMappingRow
                          hosts={hosts}
                          mapping={mapping}
                          onCancel={() => setEditingRuid(null)}
                          onSaved={() => setEditingRuid(null)}
                        />
                      </TableCell>
                    ) : (
                      <>
                        <TableCell>{mapping.hostName || mapping.hostId}</TableCell>
                        <TableCell>{mapping.online ? 'online' : 'offline'}</TableCell>
                        <TableCell>{mapping.integrity}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setEditingRuid(mapping.ruid)}
                              disabled={mapping.online}
                              title={mapping.online ? 'Stop the room before moving its mapping.' : undefined}
                            >
                              Edit
                            </Button>
                            <DeleteMappingButton mapping={mapping} />
                          </div>
                          {mapping.blockingReason && (
                            <p className="mt-2 text-xs text-muted-foreground">{mapping.blockingReason}</p>
                          )}
                        </TableCell>
                      </>
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

function CreateMappingCard({ hosts }: { hosts: HostStatusInfo[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const form = useForm<MappingFormValues>({
    resolver: zodResolver(mappingFormSchema),
    defaultValues: emptyMappingForm,
  });

  const onSubmit = (values: MappingFormValues) => {
    startTransition(() => {
      void createMappingAction(values)
        .then(() => {
          SnackBarNotification.success(`Mapping '${values.ruid}' created.`);
          form.reset(emptyMappingForm);
          router.refresh();
        })
        .catch((error) => {
          SnackBarNotification.error(error instanceof Error ? error.message : 'Failed to create mapping.');
        });
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add RUID Mapping</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
            <FormField
              control={form.control}
              name="ruid"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RUID</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hostId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Host</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a host" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {hosts.map((host) => (
                        <SelectItem key={host.id} value={host.id}>
                          {host.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-end">
              <Button type="submit" disabled={isPending}>
                Add Mapping
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function EditingMappingRow({
  hosts,
  mapping,
  onCancel,
  onSaved,
}: {
  hosts: HostStatusInfo[];
  mapping: RoomMapping & ManagedRoomInfo;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const form = useForm<Pick<MappingFormValues, 'hostId'>>({
    resolver: zodResolver(mappingFormSchema.pick({ hostId: true })),
    defaultValues: {
      hostId: mapping.hostId,
    },
  });

  const onSubmit = (values: Pick<MappingFormValues, 'hostId'>) => {
    startTransition(() => {
      void updateMappingAction({ ruid: mapping.ruid, hostId: values.hostId })
        .then(() => {
          SnackBarNotification.success(`Mapping '${mapping.ruid}' updated.`);
          onSaved();
          router.refresh();
        })
        .catch((error) => {
          SnackBarNotification.error(error instanceof Error ? error.message : 'Failed to update mapping.');
        });
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto_auto]">
        <FormField
          control={form.control}
          name="hostId"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select a host" />
                  </SelectTrigger>
                  <SelectContent>
                    {hosts.map((host) => (
                      <SelectItem key={host.id} value={host.id}>
                        {host.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
        {mapping.blockingReason && (
          <p className="text-xs text-muted-foreground md:col-span-3">{mapping.blockingReason}</p>
        )}
      </form>
    </Form>
  );
}

function DeleteMappingButton({ mapping }: { mapping: RoomMapping & ManagedRoomInfo }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onDelete = () => {
    startTransition(() => {
      void deleteMappingAction(mapping.ruid)
        .then(() => {
          SnackBarNotification.success(`Mapping '${mapping.ruid}' deleted.`);
          router.refresh();
        })
        .catch((error) => {
          SnackBarNotification.error(error instanceof Error ? error.message : 'Failed to delete mapping.');
        });
    });
  };

  return (
    <Button
      type="button"
      size="sm"
      variant="destructive"
      onClick={onDelete}
      disabled={mapping.online || isPending}
      title={mapping.blockingReason}
    >
      Delete
    </Button>
  );
}
