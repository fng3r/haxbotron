'use client';

import { useState } from 'react';

import SnackBarNotification from '@/components/Notifications/SnackBarNotification';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { mutations, queries } from '@/lib/queries/control';

export default function ControlMappings() {
  const { data: hosts } = queries.getHosts();
  const { data: mappings } = queries.getMappings();
  const createMappingMutation = mutations.createMapping();
  const updateMappingMutation = mutations.updateMapping();
  const deleteMappingMutation = mutations.deleteMapping();

  const [ruid, setRuid] = useState('');
  const [hostId, setHostId] = useState('');
  const [editingRuid, setEditingRuid] = useState<string | null>(null);
  const [editingHostId, setEditingHostId] = useState('');

  const onCreate = () => {
    createMappingMutation.mutate(
      { ruid, hostId },
      {
        onSuccess: () => {
          SnackBarNotification.success(`Mapping '${ruid}' created.`);
          setRuid('');
          setHostId('');
        },
        onError: (error) => SnackBarNotification.error(error.message),
      },
    );
  };

  const onUpdate = () => {
    if (!editingRuid) return;
    updateMappingMutation.mutate(
      { ruid: editingRuid, hostId: editingHostId },
      {
        onSuccess: () => {
          SnackBarNotification.success(`Mapping '${editingRuid}' updated.`);
          setEditingRuid(null);
          setEditingHostId('');
        },
        onError: (error) => SnackBarNotification.error(error.message),
      },
    );
  };

  const onDelete = (targetRuid: string) => {
    deleteMappingMutation.mutate(targetRuid, {
      onSuccess: () => SnackBarNotification.success(`Mapping '${targetRuid}' deleted.`),
      onError: (error) => SnackBarNotification.error(error.message),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Add RUID Mapping</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
          <div className="space-y-2">
            <Label htmlFor="mapping-ruid">RUID</Label>
            <Input id="mapping-ruid" value={ruid} onChange={(e) => setRuid(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Host</Label>
            <Select value={hostId} onValueChange={setHostId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a host" />
              </SelectTrigger>
              <SelectContent>
                {hosts?.map((host) => (
                  <SelectItem key={host.id} value={host.id}>
                    {host.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={onCreate} disabled={!ruid || !hostId || createMappingMutation.isPending}>
              Add Mapping
            </Button>
          </div>
        </CardContent>
      </Card>

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
              {mappings?.map((mapping) => {
                const isEditing = editingRuid === mapping.ruid;
                return (
                  <TableRow key={mapping.ruid}>
                    <TableCell>{mapping.ruid}</TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Select value={editingHostId} onValueChange={setEditingHostId}>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Select a host" />
                          </SelectTrigger>
                          <SelectContent>
                            {hosts?.map((host) => (
                              <SelectItem key={host.id} value={host.id}>
                                {host.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        mapping.hostName || mapping.hostId
                      )}
                    </TableCell>
                    <TableCell>{mapping.online ? 'online' : 'offline'}</TableCell>
                    <TableCell>{mapping.integrity}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {isEditing ? (
                          <>
                            <Button size="sm" onClick={onUpdate} disabled={updateMappingMutation.isPending}>
                              Save
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => setEditingRuid(null)}>
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setEditingRuid(mapping.ruid);
                                setEditingHostId(mapping.hostId);
                              }}
                              disabled={mapping.online}
                              title={mapping.online ? 'Stop the room before moving its mapping.' : undefined}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => onDelete(mapping.ruid)}
                              disabled={mapping.online || deleteMappingMutation.isPending}
                              title={mapping.blockingReason}
                            >
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                      {mapping.blockingReason && <p className="mt-2 text-xs text-muted-foreground">{mapping.blockingReason}</p>}
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
