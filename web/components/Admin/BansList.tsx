'use client';

import React, { useState } from 'react';

import BackspaceOutlined from '@mui/icons-material/BackspaceOutlined';
import {
  Button,
  Container,
  Divider,
  Grid2 as Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';

import SnackBarNotification from '@/components/Notifications/SnackBarNotification';
import WidgetTitle from '@/components/common/WidgetTitle';

import { isNumber } from '@/lib/numcheck';
import { mutations, queries } from '@/lib/queries/player';
import { NewBanEntry } from '@/lib/types/player';

export default function RoomBanList({ ruid }: { ruid: string }) {
  const [newBan, setNewBan] = useState({ conn: '', reason: '', seconds: 0 } as NewBanEntry);

  const [page, setPage] = useState(1);
  const [pagingCount, setPagingCount] = useState(10);

  const { data: bans } = queries.getPlayersBans(ruid, { page, pagingCount });

  const addPlayerBanMutation = mutations.addBan();
  const removePlayerBanMutation = mutations.removeBan();

  const convertDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

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

  const onChangeNewBan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'newbanseconds' && isNumber(parseInt(value))) {
      setNewBan({
        ...newBan,
        seconds: parseInt(value),
      });
    } else {
      setNewBan({
        ...newBan,
        [name]: value,
      });
    }
  };

  const handleAdd = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    addPlayerBanMutation.mutate(
      { ruid, banEntry: newBan },
      {
        onSuccess: () => {
          SnackBarNotification.success(`Successfully banned by conn: ${newBan.conn}.`);
          setNewBan({ conn: '', auth: '', reason: '', seconds: 0 });
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
    <Container maxWidth="lg" className="py-8">
      <Grid container spacing={3}>
        <Grid size={12}>
          <Paper className="p-4!">
            <React.Fragment>
              <WidgetTitle>Bans List</WidgetTitle>
              <Grid container spacing={2}>
                <form className="w-full" onSubmit={handleAdd} method="post">
                  <Grid container size={12} columnSpacing={0.5}>
                    <TextField
                      variant="outlined"
                      margin="normal"
                      required
                      size="small"
                      value={newBan.conn}
                      onChange={onChangeNewBan}
                      id="conn"
                      label="CONN"
                      name="conn"
                    />
                    <TextField
                      variant="outlined"
                      margin="normal"
                      required
                      size="small"
                      value={newBan.auth}
                      onChange={onChangeNewBan}
                      id="auth"
                      label="AUTH"
                      name="auth"
                    />
                    <TextField
                      variant="outlined"
                      margin="normal"
                      required
                      size="small"
                      value={newBan.reason}
                      onChange={onChangeNewBan}
                      id="reason"
                      label="Reason"
                      name="reason"
                    />
                    <TextField
                      variant="outlined"
                      margin="normal"
                      required
                      size="small"
                      value={newBan.seconds}
                      onChange={onChangeNewBan}
                      type="number"
                      id="seconds"
                      label="Ban Time(secs)"
                      name="seconds"
                    />
                    <Button
                      size="small"
                      type="submit"
                      variant="contained"
                      color="primary"
                      className="mt-5! mb-4! ml-2!"
                    >
                      Ban
                    </Button>
                  </Grid>
                </form>
              </Grid>
              <Divider />

              <Grid container spacing={1}>
                <Grid size={{ xs: 8, sm: 4 }}>
                  <TextField
                    variant="outlined"
                    margin="normal"
                    size="small"
                    id="pagingCountInput"
                    label="Paging Items Count"
                    name="pagingCountInput"
                    type="number"
                    value={pagingCount}
                    onChange={onChangePagingCountInput}
                  />
                  <Button
                    onClick={() => onClickPaging(-1)}
                    size="small"
                    type="button"
                    variant="outlined"
                    color="inherit"
                    className="mt-5! ml-1!"
                  >
                    &lt;&lt;
                  </Button>
                  <Button
                    onClick={() => onClickPaging(1)}
                    size="small"
                    type="button"
                    variant="outlined"
                    color="inherit"
                    className="mt-5!"
                  >
                    &gt;&gt;
                  </Button>

                  <Typography>Page {page}</Typography>
                </Grid>
              </Grid>
              <Divider />

              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>CONN</TableCell>
                    <TableCell>Auth</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Registered Date</TableCell>
                    <TableCell>Expiration Date</TableCell>
                    <TableCell align="right"></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bans &&
                    bans.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{item.conn}</TableCell>
                        <TableCell>{item.auth}</TableCell>
                        <TableCell>{item.reason}</TableCell>
                        <TableCell>{convertDate(item.register)}</TableCell>
                        <TableCell>{convertDate(item.expire)}</TableCell>
                        <TableCell align="right">
                          <IconButton name={item.conn} onClick={() => handleDelete(item.conn)} aria-label="delete">
                            <BackspaceOutlined fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </React.Fragment>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
