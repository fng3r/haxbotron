'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChromePicker, ColorResult } from 'react-color';

import { useParams } from 'next/navigation';

import {
  Button,
  ButtonGroup,
  Container,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid2 as Grid,
  InputAdornment,
  Paper,
  Radio,
  RadioGroup,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material';

import SnackBarNotification from '@/components/Notifications/SnackBarNotification';
import WidgetTitle from '@/components/common/WidgetTitle';

import client from '@/lib/client';
import { isNumber } from '@/lib/numcheck';

interface TeamColours {
  angle: number;
  textColour: number;
  teamColour1: number;
  teamColour2: number;
  teamColour3: number;
}

type ModeSelect = 'avatar' | 'team1' | 'team2' | 'team3';

const convertHexToInt = (rrggbb: string) => {
  return parseInt(rrggbb, 16);
};

export default function RoomAssets() {
  const { ruid } = useParams();

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [colourPick, setColourPick] = useState('#ffffff');

  const [redTeamColours, setRedTeamColours] = useState({
    angle: 0,
    textColour: 0xffffff,
    teamColour1: 0xe66e55,
    teamColour2: 0xe66e55,
    teamColour3: 0xe66e55,
  } as TeamColours);
  const [blueTeamColours, setBlueTeamColours] = useState({
    angle: 0,
    textColour: 0xffffff,
    teamColour1: 0x5a89e5,
    teamColour2: 0x5a89e5,
    teamColour3: 0x5a89e5,
  } as TeamColours);

  const [teamSelectValue, setTeamSelectValue] = useState('red');
  const [newModeSelectValue, setNewModeSelectValue] = useState('avatar' as ModeSelect);
  const [newAngle, setNewAngle] = useState('0');
  const [newTextColour, setNewTextColour] = useState('#ffffff');
  const [newTeamColour1, setNewTeamColour1] = useState('#ffffff');
  const [newTeamColour2, setNewTeamColour2] = useState('#ffffff');
  const [newTeamColour3, setNewTeamColour3] = useState('#ffffff');

  const onChangeNewAngle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewAngle(e.target.value);
  };

  const handleColourChange = (colour: ColorResult, event: React.ChangeEvent<HTMLInputElement>) => {
    setColourPick(colour.hex);
  };

  const handleTeamSelectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTeamSelectValue(e.target.value);
  };

  const handleTeamColoursLoad = async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();

    if (localStorage.getItem(`_${teamSelectValue}TeamColours`) !== null) {
      const colours = JSON.parse(localStorage.getItem(`_${teamSelectValue}TeamColours`)!);

      setNewAngle(colours.angle.toString());
      setNewTextColour(colours.textColour.toString(16));
      setNewTeamColour1(colours.teamColour1.toString(16));
      setNewTeamColour2(colours.teamColour2.toString(16));
      setNewTeamColour3(colours.teamColour3.toString(16));
    }
  };

  const handleColoursApply = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    localStorage.setItem(
      `_${teamSelectValue}TeamColours`,
      JSON.stringify({
        angle: newAngle,
        textColour: newTextColour,
        teamColour1: newTeamColour1,
        teamColour2: newTeamColour2,
        teamColour3: newTeamColour3,
      }),
    );

    try {
      const result = await client.post(`/api/v1/room/${ruid}/asset/team/colour`, {
        team: teamSelectValue === 'blue' ? 2 : 1,
        angle: isNumber(parseInt(newAngle)) ? parseInt(newAngle) : 0,
        textColour: convertHexToInt(newTextColour.substring(1)),
        teamColour1: convertHexToInt(newTeamColour1.substring(1)),
        teamColour2: convertHexToInt(newTeamColour2.substring(1)),
        teamColour3: convertHexToInt(newTeamColour3.substring(1)),
      });
      if (result.status === 201) {
        SnackBarNotification.success(`Successfully set colors of the ${teamSelectValue} team.`);

        getTeamColours();
        getTeamColours();
      }
    } catch (error: any) {
      if (error.response.status === 404) {
        SnackBarNotification.error('Failed to set team colours.');
      } else {
        SnackBarNotification.error('Unexpected error is caused. Please try again.');
      }
    }
  };

  const getTeamColours = async () => {
    try {
      const result = await client.get(`/api/v1/room/${ruid}/asset/team/colour`);
      if (result.status === 200) {
        const colours = {
          red: result.data.red as TeamColours,
          blue: result.data.blue as TeamColours,
        };
        setRedTeamColours(colours.red);
        setBlueTeamColours(colours.blue);
      }
    } catch (error: any) {
      if (error.response.status === 404) {
        SnackBarNotification.error('Failed to load team colours.');
      } else {
        SnackBarNotification.error('Unexpected error is caused. Please try again.');
      }
    }
  };

  useEffect(() => {
    if (teamSelectValue === 'blue') {
      setNewAngle(blueTeamColours.angle.toString());
      setNewTextColour('#' + blueTeamColours.textColour.toString(16));
      setNewTeamColour1('#' + blueTeamColours.teamColour1.toString(16));
      setNewTeamColour2('#' + blueTeamColours.teamColour2.toString(16));
      setNewTeamColour3('#' + blueTeamColours.teamColour3.toString(16));
    } else {
      setNewAngle(redTeamColours.angle.toString());
      setNewTextColour('#' + redTeamColours.textColour.toString(16));
      setNewTeamColour1('#' + redTeamColours.teamColour1.toString(16));
      setNewTeamColour2('#' + redTeamColours.teamColour2.toString(16));
      setNewTeamColour3('#' + redTeamColours.teamColour3.toString(16));
    }
  }, [teamSelectValue, redTeamColours, blueTeamColours]);

  useEffect(() => {
    switch (newModeSelectValue) {
      case 'avatar': {
        setNewTextColour(colourPick);
        break;
      }
      case 'team1': {
        setNewTeamColour1(colourPick);
        break;
      }
      case 'team2': {
        setNewTeamColour2(colourPick);
        break;
      }
      case 'team3': {
        setNewTeamColour3(colourPick);
        break;
      }
    }
  }, [colourPick]);

  useEffect(() => {
    switch (newModeSelectValue) {
      case 'avatar': {
        setColourPick(newTextColour);
        break;
      }
      case 'team1': {
        setColourPick(newTeamColour1);
        break;
      }
      case 'team2': {
        setColourPick(newTeamColour2);
        break;
      }
      case 'team3': {
        setColourPick(newTeamColour3);
        break;
      }
    }
  }, [newModeSelectValue]);

  useEffect(() => {
    getTeamColours();
  }, []);

  return (
    <Container maxWidth="lg" className="py-8">
      <Grid container spacing={3}>
        <Grid size={12}>
          <Paper className="p-4">
            <React.Fragment>
              <WidgetTitle>New Team Colours</WidgetTitle>

              <form className="mt-6 w-full" onSubmit={handleColoursApply} method="post">
                <Grid container spacing={2}>
                  <Grid size={{ xs: 4, sm: 2 }}>
                    <FormControl component="fieldset">
                      <FormLabel component="legend">Select Team</FormLabel>
                      <RadioGroup
                        row
                        aria-label="team"
                        name="team"
                        value={teamSelectValue}
                        onChange={handleTeamSelectChange}
                      >
                        <FormControlLabel value="red" control={<Radio color="default" />} label="Red" />
                        <FormControlLabel value="blue" control={<Radio color="default" />} label="Blue" />
                      </RadioGroup>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 2, sm: 1 }}>
                    <TextField
                      variant="outlined"
                      margin="normal"
                      required
                      size="small"
                      type="number"
                      fullWidth
                      id="angle"
                      label="Angle"
                      name="angle"
                      value={newAngle}
                      onChange={onChangeNewAngle}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">°</InputAdornment>,
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 8, sm: 4 }}>
                    <ButtonGroup variant="outlined" color="inherit" aria-label="team colours" className="mt-4!">
                      <Button onClick={() => setNewModeSelectValue('avatar')}>Avatar</Button>
                      <Button onClick={() => setNewModeSelectValue('team1')}>First</Button>
                      <Button onClick={() => setNewModeSelectValue('team2')}>Second</Button>
                      <Button onClick={() => setNewModeSelectValue('team3')}>Third</Button>
                    </ButtonGroup>
                  </Grid>
                  <Grid>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Angle</TableCell>
                          <TableCell>Avatar</TableCell>
                          <TableCell>First</TableCell>
                          <TableCell>Second</TableCell>
                          <TableCell>Third</TableCell>
                          <TableCell />
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell>{newAngle}°</TableCell>
                          <TableCell>{newTextColour}</TableCell>
                          <TableCell>{newTeamColour1}</TableCell>
                          <TableCell>{newTeamColour2}</TableCell>
                          <TableCell>{newTeamColour3}</TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              type="submit"
                              variant="contained"
                              color="primary"
                              className="mt-1! mr-1!"
                            >
                              Apply
                            </Button>
                            <Button
                              size="small"
                              type="button"
                              variant="outlined"
                              color="inherit"
                              className="mt-1!"
                              onClick={handleTeamColoursLoad}
                            >
                              Load
                            </Button>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </Grid>
                </Grid>
                <Grid container spacing={2} my={1}>
                  <Grid>
                    <ChromePicker disableAlpha={true} color={colourPick} onChange={handleColourChange} />
                  </Grid>
                  <Grid>
                    <canvas id="preview" ref={canvasRef} width="200" height="200"></canvas>
                  </Grid>
                </Grid>
              </form>
              <Divider />

              <WidgetTitle>Ingame Team Colours</WidgetTitle>
              <Grid container spacing={2}>
                <Grid>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Team</TableCell>
                        <TableCell>Angle</TableCell>
                        <TableCell>Avatar</TableCell>
                        <TableCell>First</TableCell>
                        <TableCell>Second</TableCell>
                        <TableCell>Third</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow key={1}>
                        <TableCell>Red</TableCell>
                        <TableCell>{redTeamColours.angle}°</TableCell>
                        <TableCell>&#35;{redTeamColours.textColour.toString(16)}</TableCell>
                        <TableCell>&#35;{redTeamColours.teamColour1.toString(16)}</TableCell>
                        <TableCell>&#35;{redTeamColours.teamColour2.toString(16)}</TableCell>
                        <TableCell>&#35;{redTeamColours.teamColour3.toString(16)}</TableCell>
                      </TableRow>
                      <TableRow key={2}>
                        <TableCell>Blue</TableCell>
                        <TableCell>{blueTeamColours.angle}°</TableCell>
                        <TableCell>&#35;{blueTeamColours.textColour.toString(16)}</TableCell>
                        <TableCell>&#35;{blueTeamColours.teamColour1.toString(16)}</TableCell>
                        <TableCell>&#35;{blueTeamColours.teamColour2.toString(16)}</TableCell>
                        <TableCell>&#35;{blueTeamColours.teamColour3.toString(16)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Grid>
              </Grid>
            </React.Fragment>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
