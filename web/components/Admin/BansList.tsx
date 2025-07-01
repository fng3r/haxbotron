'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { z } from 'zod';

import SnackBarNotification from '@/components/Notifications/SnackBarNotification';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { mutations, queries } from '@/lib/queries/player';

const banFormSchema = z.object({
  conn: z.string().min(1, { message: 'CONN is required' }),
  auth: z.string().min(1, { message: 'AUTH is required' }),
  reason: z.string().min(1, { message: 'Reason is required' }),
  duration: z.coerce.number().min(1, { message: 'Ban Duration must be positive' }),
});

type BanFormValues = z.infer<typeof banFormSchema>;

export default function RoomBanList({ ruid }: { ruid: string }) {
  const [page, setPage] = useState(1);
  const { data: bans } = queries.getPlayersBans(ruid, { page, pagingCount: 10 });
  const addPlayerBanMutation = mutations.addBan();
  const removePlayerBanMutation = mutations.removeBan();

  const form = useForm<BanFormValues>({
    resolver: zodResolver(banFormSchema),
    defaultValues: {
      conn: '',
      auth: '',
      reason: '',
      duration: 5,
    },
  });

  const convertDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  const onClickPaging = (shift: number) => {
    setPage((prev) => Math.max(prev + shift, 1));
  };

  const onSubmit = (values: BanFormValues) => {
    handleAdd(values);
    form.reset();
  };

  const handleAdd = async (values: BanFormValues) => {
    addPlayerBanMutation.mutate(
      { ruid, banEntry: { ...values, seconds: values.duration * 60 } },
      {
        onSuccess: () => {
          SnackBarNotification.success(`Successfully banned by conn: ${values.conn}.`);
        },
        onError: (error) => {
          SnackBarNotification.error(error.message);
        },
      },
    );
  };

  const handleDelete = async (conn: string) => {
    removePlayerBanMutation.mutate(
      { ruid, conn },
      {
        onSuccess: () => {
          SnackBarNotification.success(`Successfully deleted ban entry (conn: ${conn}).`);
        },
        onError: (error) => {
          SnackBarNotification.error(error.message);
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bans List</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col lg:flex-row gap-2 mb-4 w-full">
            <FormField
              control={form.control}
              name="conn"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-1 flex-1 min-w-0">
                  <FormLabel className="text-xs font-medium">CONN</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter player conn" className="w-full lg:w-auto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="auth"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-1 flex-1 min-w-0">
                  <FormLabel className="text-xs font-medium">Public ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter player public ID" className="w-full lg:w-auto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="banReason"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-1 flex-1 min-w-0">
                  <FormLabel className="text-xs font-medium">Reason</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter ban reason" className="w-full lg:w-auto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-1 w-30">
                  <FormLabel className="text-xs font-medium">Ban Duration (mins)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="mt-5">
              Ban
            </Button>
          </form>
        </Form>

        <Separator className="mb-4" />

        <Table className="table-auto">
          <TableHeader>
            <TableRow>
              <TableHead>CONN</TableHead>
              <TableHead>Auth</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Registered Date</TableHead>
              <TableHead>Expiration Date</TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bans &&
              bans.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <span className="break-all break-words hyphens-auto">{item.conn}</span>
                  </TableCell>
                  <TableCell>
                    <span className="break-all break-words hyphens-auto">{item.auth}</span>
                  </TableCell>
                  <TableCell>
                    <span className="break-all break-words hyphens-auto">{item.reason}</span>
                  </TableCell>
                  <TableCell>{convertDate(item.register)}</TableCell>
                  <TableCell>{convertDate(item.expire)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.conn)} aria-label="delete">
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>

        <div className="mt-2 w-full flex justify-center items-center gap-2 py-2">
          <Button
            variant="outline"
            type="button"
            onClick={() => onClickPaging(-1)}
            aria-label="Previous page"
            size="icon"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="mx-2">Page {page}</span>
          <Button variant="outline" type="button" onClick={() => onClickPaging(1)} aria-label="Next page" size="icon">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
