'use client';

import { useMemo, useState } from 'react';

import SnackBarNotification from '@/components/Notifications/SnackBarNotification';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { mutations, queries } from '@/lib/queries/control';

type FormState = {
  id: string;
  name: string;
  baseUrl: string;
  enabled: boolean;
};

const emptyForm: FormState = {
  id: '',
  name: '',
  baseUrl: '',
  enabled: true,
};

export default function ControlHosts() {
  const { data: hosts } = queries.getHosts();
  const createHostMutation = mutations.createHost();
  const updateHostMutation = mutations.updateHost();
  const deleteHostMutation = mutations.deleteHost();

  const [createForm, setCreateForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);

  const editingHost = useMemo(() => hosts?.find((host) => host.id === editingId), [hosts, editingId]);

  const onCreate = () => {
    createHostMutation.mutate(createForm, {
      onSuccess: () => {
        SnackBarNotification.success(`Host '${createForm.name}' created.`);
        setCreateForm(emptyForm);
      },
      onError: (error) => SnackBarNotification.error(error.message),
    });
  };

  const onEditStart = (host: FormState) => {
    setEditingId(host.id);
    setEditForm(host);
  };

  const onUpdate = () => {
    if (!editingId) return;
    updateHostMutation.mutate(
      {
        hostId: editingId,
        payload: {
          name: editForm.name,
          baseUrl: editForm.baseUrl,
          enabled: editForm.enabled,
        },
      },
      {
        onSuccess: () => {
          SnackBarNotification.success(`Host '${editForm.name}' updated.`);
          setEditingId(null);
        },
        onError: (error) => SnackBarNotification.error(error.message),
      },
    );
  };

  const onDelete = (hostId: string) => {
    deleteHostMutation.mutate(hostId, {
      onSuccess: () => SnackBarNotification.success(`Host '${hostId}' deleted.`),
      onError: (error) => SnackBarNotification.error(error.message),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Add Host</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="host-id">ID</Label>
            <Input id="host-id" value={createForm.id} onChange={(e) => setCreateForm((prev) => ({ ...prev, id: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="host-name">Name</Label>
            <Input id="host-name" value={createForm.name} onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="host-url">Base URL</Label>
            <Input id="host-url" value={createForm.baseUrl} onChange={(e) => setCreateForm((prev) => ({ ...prev, baseUrl: e.target.value }))} />
          </div>
          <div className="flex items-end gap-3">
            <div className="space-y-2">
              <Label htmlFor="host-enabled">Enabled</Label>
              <div>
                <Switch id="host-enabled" checked={createForm.enabled} onCheckedChange={(checked) => setCreateForm((prev) => ({ ...prev, enabled: checked }))} />
              </div>
            </div>
            <Button onClick={onCreate} disabled={createHostMutation.isPending}>
              Add Host
            </Button>
          </div>
        </CardContent>
      </Card>

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
              {hosts?.map((host) => {
                const isEditing = host.id === editingId;
                return (
                  <TableRow key={host.id}>
                    <TableCell>{host.id}</TableCell>
                    <TableCell>{isEditing ? <Input value={editForm.name} onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))} /> : host.name}</TableCell>
                    <TableCell>{isEditing ? <Input value={editForm.baseUrl} onChange={(e) => setEditForm((prev) => ({ ...prev, baseUrl: e.target.value }))} /> : host.baseUrl}</TableCell>
                    <TableCell>{host.healthy ? 'healthy' : 'down'}</TableCell>
                    <TableCell>{host.mappedRoomCount}</TableCell>
                    <TableCell>{host.onlineMappedRoomCount}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {isEditing ? (
                          <>
                            <div className="flex items-center gap-2">
                              <Switch checked={editForm.enabled} onCheckedChange={(checked) => setEditForm((prev) => ({ ...prev, enabled: checked }))} />
                            </div>
                            <Button size="sm" onClick={onUpdate} disabled={updateHostMutation.isPending}>
                              Save
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => setEditingId(null)}>
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="secondary" onClick={() => onEditStart(host)}>
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => onDelete(host.id)}
                              disabled={Boolean(host.blockingReason) || deleteHostMutation.isPending}
                              title={host.blockingReason}
                            >
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                      {!isEditing && host.blockingReason && (
                        <p className="mt-2 text-xs text-muted-foreground">{host.blockingReason}</p>
                      )}
                      {isEditing && editingHost?.blockingReason && (
                        <p className="mt-2 text-xs text-muted-foreground">{editingHost.blockingReason}</p>
                      )}
                    </TableCell>
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
