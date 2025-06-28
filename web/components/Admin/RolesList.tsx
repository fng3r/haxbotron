'use client';

import React, { useState } from 'react';

import { ChevronLeft, ChevronRight, PlusCircle, RefreshCw, Trash2, X } from 'lucide-react';
import { useDebounce } from 'use-debounce';

import SnackBarNotification from '@/components/Notifications/SnackBarNotification';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CopyButton } from '@/components/ui/copy-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { isNumber } from '@/lib/numcheck';
import { mutations, queries } from '@/lib/queries/roles';
import { NewRole, PlayerRoleEvent, PlayerRoleEventType } from '@/lib/types/roles';

const convertDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString();
};

const convertEventToString = (event: PlayerRoleEvent): string => {
  switch (event.type) {
    case PlayerRoleEventType.addRole:
      return `Player ${event.name} with id ${event.auth} was added with role '${event.role}'`;
    case PlayerRoleEventType.updateRole:
      return `Player's ${event.name} (id: ${event.auth}) role was updated to '${event.role}'`;
    case PlayerRoleEventType.removeRole:
      return `Player ${event.name} with id ${event.auth} was removed`;
    default:
      throw new Error(`Unknown event type: ${event.type}`);
  }
};

const convertEventTypeToIcon = (eventType: PlayerRoleEventType): React.ReactNode => {
  switch (eventType) {
    case PlayerRoleEventType.addRole:
      return <PlusCircle className="size-5 text-green-600" aria-label="Player added" />;
    case PlayerRoleEventType.updateRole:
      return <RefreshCw className="size-5 text-blue-600" aria-label="Role updated" />;
    case PlayerRoleEventType.removeRole:
      return <X className="size-5 text-red-600" aria-label="Player removed" />;
    default:
      throw new Error(`Unknown event type: ${eventType}`);
  }
};

export default function RoomPlayerList() {
  const [newRole, setNewRole] = useState({ auth: '', name: '', role: 'player' } as NewRole);
  const [page, setPage] = useState(1);
  const [pagingCount, setPagingCount] = useState(10);

  const [eventsPage, setEventsPage] = useState(1);
  const [eventsPagingCount, setEventsPagingCount] = useState(10);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchQueryDebounced] = useDebounce(searchQuery, 300);
  const [pagingCountDebounced] = useDebounce(pagingCount, 300);
  const [eventsPagingCountDebounced] = useDebounce(eventsPagingCount, 300);

  const { data: roles, isPlaceholderData: isRolesPlaceholderData } = queries.getPlayersRoles({
    page,
    pagingCount: pagingCountDebounced,
    searchQuery: searchQueryDebounced,
  });
  const { data: roleEvents, isPlaceholderData: isEventsPlaceholderData } = queries.getPlayersRoleEvents({
    page: eventsPage,
    pagingCount: eventsPagingCountDebounced,
    searchQuery: searchQueryDebounced,
  });

  const addRoleMutation = mutations.addRole();
  const updateRoleMutation = mutations.updateRole();
  const deleteRoleMutation = mutations.deleteRole();

  const onClickPaging = (shift: number) => {
    setPage((prev) => Math.max(prev + shift, 1));
  };

  const onChangePagingCountInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isNumber(parseInt(e.target.value))) {
      const count: number = parseInt(e.target.value);
      if (count >= 1) {
        setPagingCount(count);
      }
    }
  };

  const onChangeSearchQuery = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
  };

  const onChangeNewRole = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setNewRole({
      ...newRole,
      [name]: value,
    });
  };

  const onClickEventsPaging = (shift: number) => {
    setEventsPage((prev) => Math.max(prev + shift, 1));
  };

  const onChangeEventsPagingCountInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isNumber(parseInt(e.target.value))) {
      const count: number = parseInt(e.target.value);
      if (count >= 1) {
        setEventsPagingCount(count);
      }
    }
  };

  const addRole = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    addRoleMutation.mutate(newRole, {
      onSuccess: () => {
        SnackBarNotification.success(`Player ${newRole.name} (id: ${newRole.auth}) was added.`);
        setNewRole({ auth: '', name: '', role: 'player' });
      },
      onError: (error) => {
        SnackBarNotification.error(error.message);
      },
    });
  };

  const updateRole = async (role: string, playerIndex: number) => {
    const selectedRole = roles![playerIndex];

    updateRoleMutation.mutate(
      { ...selectedRole, role },
      {
        onSuccess: () => {
          SnackBarNotification.success(`Player's ${selectedRole.name} was updated to '${role}'.`);
        },
        onError: (error) => {
          SnackBarNotification.error(error.message);
        },
      },
    );
  };

  const deleteRole = async (auth: string, name: string) => {
    deleteRoleMutation.mutate(
      { auth, name },
      {
        onSuccess: () => {
          SnackBarNotification.success(`Player ${name} (id: ${auth}) was removed.`);
        },
        onError: (error) => {
          SnackBarNotification.error(error.message);
        },
      },
    );
  };

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Player Accounts List</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="w-full space-y-4" onSubmit={addRole} method="post">
            <div className="flex gap-4 items-end">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required value={newRole.name} onChange={onChangeNewRole} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="auth">Public id</Label>
                <Input
                  id="auth"
                  name="auth"
                  required
                  value={newRole.auth}
                  onChange={onChangeNewRole}
                  className="w-[450px]"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  name="role"
                  value={newRole.role}
                  onValueChange={(value) => setNewRole({ ...newRole, role: value })}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="player">player</SelectItem>
                    <SelectItem value="adm">adm</SelectItem>
                    <SelectItem value="s-adm">s-adm</SelectItem>
                    <SelectItem value="co-host">co-host</SelectItem>
                    <SelectItem value="bad">bad</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" size="sm">
                Add
              </Button>
            </div>
          </form>

          <Separator className="my-4" />

          <div className="flex flex-col gap-4 mt-6">
            <div className="flex flex-col gap-2">
              <Label htmlFor="searchQuery">Search query</Label>
              <Input
                id="searchQuery"
                name="searchQuery"
                value={searchQuery}
                onChange={onChangeSearchQuery}
                className="w-[400px]"
              />
            </div>

            <div className="flex gap-2 items-end">
              <div className="flex flex-col gap-2">
                <Label htmlFor="pagingCountInput">Paging Items Count</Label>
                <Input
                  id="pagingCountInput"
                  name="pagingCountInput"
                  type="number"
                  value={pagingCount}
                  onChange={onChangePagingCountInput}
                  min={1}
                  max={50}
                  className="w-[150px]"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={() => onClickPaging(-1)} size="icon" type="button" variant="outline">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button onClick={() => onClickPaging(1)} size="icon" type="button" variant="outline">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-2">Page {page}</p>

            <Table>
              {!roles || (roles.length === 0 && <TableCaption>No players found</TableCaption>)}
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[20%] font-bold">Name</TableHead>
                  <TableHead className="w-[35%] font-bold">Public id</TableHead>
                  <TableHead className="w-[10%] font-bold">Role</TableHead>
                  <TableHead className="w-[5%]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className={isRolesPlaceholderData ? 'opacity-50' : ''}>
                {roles &&
                  roles.map((item, idx) => (
                    <TableRow key={item.auth}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{item.auth}</span>
                          <CopyButton text={item.auth} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select value={item.role} onValueChange={(value) => updateRole(value, idx)}>
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="player">player</SelectItem>
                            <SelectItem value="adm">adm</SelectItem>
                            <SelectItem value="s-adm">s-adm</SelectItem>
                            <SelectItem value="co-host">co-host</SelectItem>
                            <SelectItem value="bad">bad</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          title="Remove player"
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteRole(item.auth, item.name)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="size-5" aria-label="Remove player" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Event log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 items-end mb-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="eventsPagingCountInput">Paging Items Count</Label>
              <Input
                id="eventsPagingCountInput"
                name="eventsPagingCountInput"
                type="number"
                value={eventsPagingCount}
                onChange={onChangeEventsPagingCountInput}
                min={1}
                max={50}
                className="w-[150px]"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={() => onClickEventsPaging(-1)} size="icon" type="button" variant="outline">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button onClick={() => onClickEventsPaging(1)} size="icon" type="button" variant="outline">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-2">Page {eventsPage}</p>

          <Table>
            {!roleEvents || (roleEvents.length === 0 && <TableCaption>No events found</TableCaption>)}
            <TableHeader>
              <TableRow>
                <TableHead className="w-[5%] font-bold">Type</TableHead>
                <TableHead className="w-[75%] font-bold">Event</TableHead>
                <TableHead className="w-[20%] font-bold">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className={isEventsPlaceholderData ? 'opacity-50' : ''}>
              {roleEvents &&
                roleEvents.map((event) => (
                  <TableRow key={event.timestamp}>
                    <TableCell className="font-medium">{convertEventTypeToIcon(event.type)}</TableCell>
                    <TableCell>{convertEventToString(event)}</TableCell>
                    <TableCell>{convertDate(event.timestamp)}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
