'use client';

import React, { useEffect, useState } from 'react';

import { useParams } from 'next/navigation';

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

import Alert, { AlertColor } from '@/components/common/Alert';
import WidgetTitle from '@/components/common/WidgetTitle';

import client from '@/lib/client';
import { isNumber } from '@/lib/numcheck';

interface banListItem {
  conn: string;
  reason: string;
  register: number;
  expire: number;
}

interface newBanFields {
  conn: string;
  reason: string;
  seconds: number;
}

export default function RoomBanList() {
  const { ruid } = useParams();

  const [banList, setBanList] = useState([] as banListItem[]);
  const [newBan, setNewBan] = useState({ conn: '', reason: '', seconds: 0 } as newBanFields);

  const [flashMessage, setFlashMessage] = useState('');
  const [alertStatus, setAlertStatus] = useState('success' as AlertColor);

  const [pagingOrder, setPagingOrder] = useState(1);
  const [pagingCount, setPagingCount] = useState(10);
  const [pagingCountInput, setPagingCountInput] = useState('10');

  const convertDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  const getBanList = async (page: number) => {
    const index: number = (page - 1) * pagingCount;
    try {
      const result = await client.get(`/api/v1/banlist/${ruid}?start=${index}&count=${pagingCount}`);
      if (result.status === 200) {
        const banList: banListItem[] = result.data;
        setBanList(banList);
      }
    } catch (error: any) {
      setAlertStatus('error');
      if (error.response.status === 404) {
        setFlashMessage('Failed to load list.');
        setBanList([]);
      } else {
        setFlashMessage('Unexpected error is caused. Please try again.');
      }
    }
  };

  const onClickBanDelete = async (conn: string) => {
    try {
      const result = await client.delete(`/api/v1/banlist/${ruid}/${conn}`);
      if (result.status === 204) {
        setFlashMessage('Successfully deleted.');
        setAlertStatus('success');
        setTimeout(() => {
          setFlashMessage('');
        }, 3000);
      }
    } catch (error: any) {
      setFlashMessage('Failed to delete the ban.');
      setTimeout(() => {
        setFlashMessage('');
        setAlertStatus('error');
      }, 3000);
    }
    getBanList(pagingOrder);
  };

  const onClickPaging = (move: number) => {
    if (pagingOrder + move >= 1) {
      setPagingOrder(pagingOrder + move);
      getBanList(pagingOrder + move);
    }
  };

  const onChangePagingCountInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPagingCountInput(e.target.value);

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
    try {
      const result = await client.post(`/api/v1/banlist/${ruid}`, {
        conn: newBan.conn,
        reason: newBan.reason,
        seconds: newBan.seconds,
      });
      if (result.status === 204) {
        setFlashMessage('Successfully banned.');
        setAlertStatus('success');
        setNewBan({ conn: '', reason: '', seconds: 0 });
        setTimeout(() => {
          setFlashMessage('');
        }, 3000);
      }
    } catch (error: any) {
      setFlashMessage('Failed to ban.');
      setAlertStatus('error');
      setTimeout(() => {
        setFlashMessage('');
      }, 3000);
    }
    getBanList(pagingOrder);
  };

  useEffect(() => {
    getBanList(1);
  }, []);

  return (
    <Container maxWidth="lg" className="py-8">
      <Grid container spacing={3}>
        <Grid size={12}>
          <Paper className="p-4">
            <React.Fragment>
              {flashMessage && <Alert severity={alertStatus}>{flashMessage}</Alert>}
              <WidgetTitle>Ban List</WidgetTitle>
              <Grid container spacing={2}>
                <form className="mt-2 w-full" onSubmit={handleAdd} method="post">
                  <Grid size={12}>
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
                    <Button size="small" type="submit" variant="contained" color="primary" className="mt-5! ml-2!">
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
                    value={pagingCountInput}
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

                  <Typography>Page {pagingOrder}</Typography>
                </Grid>
              </Grid>
              <Divider />

              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>CONN</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Registered Date</TableCell>
                    <TableCell>Expiration Date</TableCell>
                    <TableCell align="right"></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {banList.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{item.conn}</TableCell>
                      <TableCell>{item.reason}</TableCell>
                      <TableCell>{convertDate(item.register)}</TableCell>
                      <TableCell>{convertDate(item.expire)}</TableCell>
                      <TableCell align="right">
                        <IconButton name={item.conn} onClick={() => onClickBanDelete(item.conn)} aria-label="delete">
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
