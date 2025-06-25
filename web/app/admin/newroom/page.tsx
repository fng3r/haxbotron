'use client';

import React, { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { LiveHelp, OpenInNew } from '@mui/icons-material';
import {
  Alert,
  Button,
  Container,
  Divider,
  FormControlLabel,
  Grid2 as Grid,
  IconButton,
  Paper,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import SnackBarNotification from '@/components/Notifications/SnackBarNotification';
import WidgetTitle from '@/components/common/WidgetTitle';

import { BrowserHostRoomSettings, ReactHostRoomInfo } from '@/../core/lib/browser.hostconfig';
import DefaultConfigSet from '@/lib/defaultroomconfig.json';
import { isNumber } from '@/lib/numcheck';
import { mutations } from '@/lib/queries/room';

export default function RoomCreate() {
  const router = useRouter();

  const [roomUIDFormField, setRoomUIDFormField] = useState(DefaultConfigSet.ruid);
  const [configFormField, setConfigFormField] = useState(DefaultConfigSet._config); // Room Configuration Form
  const [rulesFormField, setRulesFormField] = useState(DefaultConfigSet.rules); // Game Rules Configuration Form
  const [settingsFormField, setSettingsFormField] = useState(DefaultConfigSet.settings); // Bot Settings Configuration Form
  const [settingsFormStringifiedField, setSettingsFormStringifiedField] = useState('');

  const roomPublic = configFormField.public;
  const teamLock = rulesFormField.requisite.teamLock;
  const rulesSwitches = {
    autoAdmin: rulesFormField.autoAdmin,
    whitelistEnabled: rulesFormField.whitelistEnabled,
  };

  const [roomConfigComplex, setRoomConfigComplex] = useState({} as ReactHostRoomInfo); // Total complex of Room Config (will be sent with API request body)

  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem('_savedRoomInfo');
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        setRoomUIDFormField(config.ruid);
        setConfigFormField(config._config);
        setRulesFormField(config.rules);
        setSettingsFormField(config.settings);
        setSettingsFormStringifiedField(JSON.stringify(config.settings, null, 4));
      }
    } catch (error) {
      console.error(`Error loading room config from localStorage:`, error);
    }
  }, []);

  useEffect(() => {
    // SAVE ONTO CONFIG COMPLEX WHEN EACH STATES ARE CHANGED
    setRoomConfigComplex({
      ruid: roomUIDFormField,
      _config: configFormField,
      settings: settingsFormField,
      rules: {
        ...rulesFormField,
        requisite: rulesFormField.requisite,
        autoAdmin: rulesSwitches.autoAdmin,
        whitelistEnabled: rulesSwitches.whitelistEnabled,
      },
    });
  }, [
    roomUIDFormField,
    configFormField,
    rulesFormField,
    settingsFormField,
    roomPublic,
    teamLock,
    rulesSwitches.autoAdmin,
    rulesSwitches.whitelistEnabled,
  ]);

  const createRoomMutation = mutations.createRoom();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    createRoomMutation.mutate(roomConfigComplex, {
      onSuccess: () => {
        SnackBarNotification.success(`Room '${roomConfigComplex.ruid}' has been created.`);
        localStorage.setItem('_savedRoomInfo', JSON.stringify(roomConfigComplex));
        router.push('/admin/roomlist');
      },
      onError: (error) => {
        SnackBarNotification.error(error.message);
      },
    });
  };

  const handleReset = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    localStorage.removeItem('_savedRoomInfo');
    router.push('/admin/roomlist');
  };

  const handleJSONBeautify = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();

    try {
      setSettingsFormStringifiedField(JSON.stringify(settingsFormField, null, 4));
    } catch (error) {
      console.error('Failed to stringify settings:', error);
    }
  };

  const onChangeRUID = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoomUIDFormField(e.target.value);
  };

  const onChangePublic = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfigFormField((prev) => ({ ...prev, public: e.target.checked }));
  };

  const onChangeTeamLock = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRulesFormField((prev) => ({
      ...prev,
      requisite: {
        ...prev.requisite,
        teamLock: e.target.checked,
      },
    }));
  };

  const onChangeRoomConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'maxPlayers' && isNumber(parseInt(value))) {
      setConfigFormField({
        ...configFormField,
        maxPlayers: parseInt(value),
      });
    } else {
      setConfigFormField({
        ...configFormField,
        [name]: value,
      });
    }
  };

  const onChangeRules = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRulesFormField((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const onChangeAutoAdmin = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRulesFormField((prev) => ({
      ...prev,
      autoAdmin: e.target.checked,
    }));
  };

  const onChangeWhitelistEnabled = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRulesFormField((prev) => ({
      ...prev,
      whitelistEnabled: e.target.checked,
    }));
  };

  const onChangeRulesRequisite = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (['minimumPlayers', 'eachTeamPlayers', 'timeLimit', 'scoreLimit'].includes(name) && isNumber(parseInt(value))) {
      setRulesFormField({
        ...rulesFormField,
        requisite: {
          ...rulesFormField.requisite,
          [name]: parseInt(value),
        },
      });
    } else {
      setRulesFormField({
        ...rulesFormField,
        requisite: {
          ...rulesFormField.requisite,
          [name]: value,
        },
      });
    }
  };

  const onChangeStringifiedField = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    switch (name) {
      case 'botSettings': {
        setSettingsFormStringifiedField(value);
        break;
      }
    }
  };

  const onBlurStringifiedField = () => {
    try {
      const parsedSettings: BrowserHostRoomSettings = JSON.parse(settingsFormStringifiedField);
      setSettingsFormField(parsedSettings);
    } catch (error) {
      console.error('Failed to parse settings JSON:', error);
    }
  };

  return (
    <Container maxWidth="lg" className="py-8">
      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <Paper className="p-4">
            {createRoomMutation.isPending && (
              <Alert severity="warning" className="mb-2">
                The room is launching. Please, wait
              </Alert>
            )}

            <WidgetTitle>Create New Game Room</WidgetTitle>
            <form className="mt-4 w-full" onSubmit={handleSubmit} method="post">
              <Grid container spacing={2}>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Button fullWidth type="submit" variant="contained" color="primary" className="mb-3!">
                    Create
                  </Button>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Button
                    fullWidth
                    type="reset"
                    variant="contained"
                    color="secondary"
                    className="mb-3!"
                    onClick={handleReset}
                  >
                    Reset
                  </Button>
                </Grid>
              </Grid>
              <Divider />

              <Typography component="h2" variant="subtitle1" color="primary" gutterBottom>
                Room Configuration
              </Typography>
              <Typography component="h2" variant="subtitle2" color="inherit" fontWeight={600} gutterBottom>
                Do not reuse the same RUID and token if they are already in use.
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField
                    fullWidth
                    id="ruid"
                    name="ruid"
                    label="RUID"
                    variant="outlined"
                    margin="normal"
                    size="small"
                    required
                    autoFocus
                    value={roomUIDFormField}
                    onChange={onChangeRUID}
                  />
                </Grid>
                <Grid size={{ xs: 8, sm: 4 }}>
                  <TextField
                    fullWidth
                    id="token"
                    name="token"
                    label="Headless Token"
                    variant="outlined"
                    margin="normal"
                    size="small"
                    required
                    value={configFormField.token}
                    onChange={onChangeRoomConfig}
                  />
                </Grid>
                <Grid size={{ xs: 2, sm: 1 }}>
                  <IconButton
                    onClick={() => window.open('https://www.haxball.com/headlesstoken', '_blank')}
                    edge="start"
                    size="medium"
                    aria-label="get token"
                    className="mt-3!"
                  >
                    <OpenInNew />
                  </IconButton>
                </Grid>
                <Grid size={{ xs: 4, sm: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        id="public"
                        name="public"
                        size="small"
                        checked={roomPublic}
                        onChange={onChangePublic}
                        color="primary"
                      />
                    }
                    label="Public"
                    labelPlacement="top"
                  />
                </Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid size={{ xs: 8, sm: 4 }}>
                  <TextField
                    fullWidth
                    id="roomName"
                    name="roomName"
                    label="Room Title"
                    variant="outlined"
                    margin="normal"
                    size="small"
                    required
                    value={configFormField.roomName}
                    onChange={onChangeRoomConfig}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField
                    fullWidth
                    id="password"
                    name="password"
                    label="Password"
                    variant="outlined"
                    margin="normal"
                    size="small"
                    value={configFormField.password}
                    onChange={onChangeRoomConfig}
                  />
                </Grid>
                <Grid size={{ xs: 4, sm: 2 }}>
                  <TextField
                    fullWidth
                    id="maxPlayers"
                    name="maxPlayers"
                    label="Max Players"
                    variant="outlined"
                    margin="normal"
                    type="number"
                    size="small"
                    required
                    value={configFormField.maxPlayers}
                    onChange={onChangeRoomConfig}
                  />
                </Grid>
              </Grid>
              <Divider />

              {/* Game Rules */}
              <Typography component="h2" variant="subtitle1" color="primary" gutterBottom>
                Game Rules
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 4, sm: 2 }}>
                  <TextField
                    fullWidth
                    value={rulesFormField.ruleName}
                    onChange={onChangeRules}
                    id="ruleName"
                    name="ruleName"
                    label="Rule Name"
                    variant="outlined"
                    margin="normal"
                    size="small"
                    required
                  />
                </Grid>
                <Grid size={{ xs: 8, sm: 4 }}>
                  <TextField
                    fullWidth
                    value={rulesFormField.ruleDescription}
                    onChange={onChangeRules}
                    id="ruleDescription"
                    name="ruleDescription"
                    label="Rule Description"
                    variant="outlined"
                    margin="normal"
                    size="small"
                    required
                  />
                </Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid size={{ xs: 4, sm: 2 }}>
                  <TextField
                    fullWidth
                    value={rulesFormField?.requisite && rulesFormField.requisite.minimumPlayers}
                    onChange={onChangeRulesRequisite}
                    id="minimumPlayers"
                    name="minimumPlayers"
                    label="Minimum Players Need"
                    variant="outlined"
                    margin="normal"
                    type="number"
                    size="small"
                    required
                  />
                </Grid>
                <Grid size={{ xs: 4, sm: 2 }}>
                  <TextField
                    fullWidth
                    value={rulesFormField?.requisite && rulesFormField.requisite.eachTeamPlayers}
                    onChange={onChangeRulesRequisite}
                    id="eachTeamPlayers"
                    name="eachTeamPlayers"
                    label="Number of Team Players"
                    variant="outlined"
                    margin="normal"
                    type="number"
                    size="small"
                    required
                  />
                </Grid>
                <Grid size={{ xs: 4, sm: 2 }}>
                  <TextField
                    fullWidth
                    value={rulesFormField?.requisite && rulesFormField.requisite.timeLimit}
                    onChange={onChangeRulesRequisite}
                    id="timeLimit"
                    name="timeLimit"
                    label="Time Limit"
                    variant="outlined"
                    margin="normal"
                    type="number"
                    size="small"
                    required
                  />
                </Grid>
                <Grid size={{ xs: 4, sm: 2 }}>
                  <TextField
                    fullWidth
                    value={rulesFormField?.requisite && rulesFormField.requisite.scoreLimit}
                    onChange={onChangeRulesRequisite}
                    id="scoreLimit"
                    name="scoreLimit"
                    label="Score Limit"
                    variant="outlined"
                    margin="normal"
                    type="number"
                    size="small"
                    required
                  />
                </Grid>
                <Grid size={{ xs: 4, sm: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        onChange={onChangeTeamLock}
                        checked={teamLock}
                        id="teamLock"
                        name="teamLock"
                        size="small"
                        color="primary"
                      />
                    }
                    label="Team Lock"
                    labelPlacement="top"
                  />
                </Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid size={{ xs: 4, sm: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        onChange={onChangeAutoAdmin}
                        checked={rulesSwitches.autoAdmin}
                        id="autoAdmin"
                        name="autoAdmin"
                        size="small"
                        color="primary"
                      />
                    }
                    label="Auto Admin"
                    labelPlacement="start"
                  />
                </Grid>
                <Grid size={{ xs: 4, sm: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        onChange={onChangeWhitelistEnabled}
                        checked={rulesSwitches.whitelistEnabled}
                        id="whitelistEnabled"
                        name="whitelistEnabled"
                        size="small"
                        color="primary"
                      />
                    }
                    label="Whitelist"
                    labelPlacement="start"
                  />
                </Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid size={{ xs: 4, sm: 2 }}>
                  <TextField
                    fullWidth
                    value={rulesFormField.defaultMapName}
                    onChange={onChangeRules}
                    id="defaultMapName"
                    name="defaultMapName"
                    label="Default Map Name"
                    variant="outlined"
                    margin="normal"
                    size="small"
                    required
                  />
                </Grid>
                <Grid size={{ xs: 4, sm: 2 }}>
                  <TextField
                    fullWidth
                    value={rulesFormField.readyMapName}
                    onChange={onChangeRules}
                    id="readyMapName"
                    name="readyMapName"
                    label="Ready Map Name"
                    variant="outlined"
                    margin="normal"
                    size="small"
                    required
                  />
                </Grid>
                <Grid size={{ xs: 4, sm: 2 }}>
                  <Tooltip
                    placement="top-start"
                    title="Available maps: big, bigeasy, classic, gbhotclassic, gbhotbig, realsoccer, futsal1v1, futsal4v4, bff4v4, icebear, 6man"
                    className="mt-3!"
                  >
                    <IconButton>
                      <LiveHelp />
                    </IconButton>
                  </Tooltip>
                </Grid>
              </Grid>
              <Divider />

              <Typography component="h2" variant="subtitle1" color="primary" gutterBottom>
                Bot Settings
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 12 }}>
                  <TextField
                    fullWidth
                    value={settingsFormStringifiedField}
                    onChange={onChangeStringifiedField}
                    onBlur={onBlurStringifiedField}
                    id="botSettings"
                    name="botSettings"
                    label="Configuration"
                    variant="outlined"
                    margin="normal"
                    required
                    multiline
                  />
                </Grid>
                <Grid size={{ xs: 4, sm: 2 }}>
                  <Button type="button" variant="contained" color="info" onClick={handleJSONBeautify}>
                    Beautify JSON
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
