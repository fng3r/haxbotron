'use client';

import React, { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { LiveHelp, OpenInNew } from '@mui/icons-material';
import {
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

import {
  BrowserHostRoomConfig,
  BrowserHostRoomGameRule,
  BrowserHostRoomSettings,
  ReactHostRoomInfo,
} from '@/../core/lib/browser.hostconfig';
import client from '@/lib/client';
import * as DefaultConfigSet from '@/lib/defaultroomconfig.json';
import { isNumber } from '@/lib/numcheck';

const getSavedRoomConfig = (): ReactHostRoomInfo => {
  let savedRoomInfo: ReactHostRoomInfo = DefaultConfigSet;
  if (localStorage.getItem('_savedRoomInfo') !== null)
    savedRoomInfo = JSON.parse(localStorage.getItem('_savedRoomInfo')!);
  return savedRoomInfo;
};

export default function RoomCreate() {
  const router = useRouter();

  const [roomConfigComplex, setRoomConfigComplex] = useState({} as ReactHostRoomInfo); // Total complex of Room Config (will be sent with API request body)

  const [configFormField, setConfigFormField] = useState({} as BrowserHostRoomConfig); // Room Configuration Form
  const [roomUIDFormField, setRoomUIDFormField] = useState(''); // RUID Field
  const [roomPublicFormField, setRoomPublicFormField] = useState(true); // Room as Public Field (switch toggle component)

  const [rulesFormField, setRulesFormField] = useState({} as BrowserHostRoomGameRule); // Game Rule Configuration Form
  const [rulesTeamLockField, setRulesTeamLockField] = useState(true); // Team Lock Field in Game Rule configuration form
  const [rulesSwitchesFormField, setRulesSwitchesFormField] = useState({
    // two switches(auitoAdmin, whitelistEnabled)
    autoAdmin: false, // auto appointment admin
    whitelistEnabled: true, // auto emcee mode
  });

  const [settingsFormField, setSettingsFormField] = useState({} as BrowserHostRoomSettings); // Bot Settings Configuration Form
  const [settingsFormStringifiedField, setSettingsFormStringifiedField] = useState(''); // JSON Stringified Bot Settings Configuration Form

  useEffect(() => {
    // LOAD DEFAULT OR LASTEST SETTINGS WHEN THIS COMPONENT IS LOADED
    const loadedDefaultSettings: ReactHostRoomInfo = getSavedRoomConfig();

    setRoomUIDFormField(loadedDefaultSettings.ruid);

    setConfigFormField(loadedDefaultSettings._config);
    setRoomPublicFormField(loadedDefaultSettings._config.public); // switch toggle component

    setRulesFormField(loadedDefaultSettings.rules);
    setRulesTeamLockField(loadedDefaultSettings.rules.requisite.teamLock); // switch toggle component
    setRulesSwitchesFormField({
      autoAdmin: loadedDefaultSettings.rules.autoAdmin,
      whitelistEnabled: loadedDefaultSettings.rules.whitelistEnabled,
    }); // switch toggle component

    setSettingsFormField(loadedDefaultSettings.settings);
    setSettingsFormStringifiedField(JSON.stringify(loadedDefaultSettings.settings, null, 4));

    return () => {
      // WHEN UNMOUNTED
      setRoomUIDFormField(loadedDefaultSettings.ruid);

      setConfigFormField(loadedDefaultSettings._config);
      setRoomPublicFormField(loadedDefaultSettings._config.public); // switch toggle component

      setRulesFormField(loadedDefaultSettings.rules);
      setRulesTeamLockField(loadedDefaultSettings.rules.requisite.teamLock); // switch toggle component
      setRulesSwitchesFormField({
        autoAdmin: loadedDefaultSettings.rules.autoAdmin,
        whitelistEnabled: loadedDefaultSettings.rules.whitelistEnabled,
      }); // switch toggle component

      setSettingsFormField(loadedDefaultSettings.settings);
      setSettingsFormStringifiedField(JSON.stringify(loadedDefaultSettings.settings));
    };
  }, []);

  useEffect(() => {
    // SAVE ONTO CONFIG COMPLEX WHEN EACH STATES ARE CHANGED
    setRoomConfigComplex({
      ruid: roomUIDFormField,
      _config: { ...configFormField, public: roomPublicFormField }, // include switch toggle component
      settings: settingsFormField,
      rules: {
        ...rulesFormField,
        requisite: { ...rulesFormField.requisite, teamLock: rulesTeamLockField },
        autoAdmin: rulesSwitchesFormField.autoAdmin,
        whitelistEnabled: rulesSwitchesFormField.whitelistEnabled,
      },
    });
  }, [
    roomUIDFormField,
    roomPublicFormField,
    configFormField, // include switch toggle component
    rulesFormField,
    rulesTeamLockField,
    rulesSwitchesFormField,
    settingsFormField,
  ]);

  useEffect(() => {
    try {
      const parsedSettings: BrowserHostRoomSettings = JSON.parse(settingsFormStringifiedField);
      setSettingsFormField(parsedSettings);
    } catch (e: any) {
      //console.log("PARSING ERROR!!");
    }
  }, [settingsFormStringifiedField]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const roomCreationNotification = SnackBarNotification.info('The game room is being created. Please wait.');
    try {
      const result = await client.post(`/api/v1/room`, roomConfigComplex);
      if (result.status === 201) {
        SnackBarNotification.success('The game room has been created.');
        // save as lastest settings value (it will be loaded as default next time)
        localStorage.setItem('_savedRoomInfo', JSON.stringify(roomConfigComplex));
        router.push('/admin/roomlist');
      }
    } catch (error: any) {
      let errorMessage = '';
      switch (error.response?.status) {
        case 400: {
          errorMessage = 'Configuration schema is unfulfilled.';
          break;
        }
        case 401: {
          errorMessage = 'Rejected.';
          break;
        }
        case 409: {
          errorMessage = 'The same RUID value is already in use.';
          break;
        }
        default: {
          errorMessage = 'Unexpected error is caused. Please try again.';
          break;
        }
      }
      SnackBarNotification.error(errorMessage);
    }
    SnackBarNotification.dismiss(roomCreationNotification);
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
    } catch (error: any) {
      //console.log("JSON Beautify Error : \n" + error);
    }
  };

  const onChangeRUID = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoomUIDFormField(e.target.value);
  };

  const onChangePublic = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoomPublicFormField(e.target.checked); // switch toggle component
  };

  const onChangeTeamLock = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRulesTeamLockField(e.target.checked); // switch toggle component
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
    setRulesFormField({
      ...rulesFormField,
      [name]: value,
    });
  };

  const onChangeRulesSwitch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target; // switch toggle component
    setRulesSwitchesFormField({
      ...rulesSwitchesFormField,
      [name]: checked,
    });
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

  return (
    <Container maxWidth="lg" className="py-8">
      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <Paper className="p-4">
            <WidgetTitle>Create New Game Room</WidgetTitle>

            <form className="mt-6 w-full" onSubmit={handleSubmit} method="post">
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
                <Grid size={{ xs: 4, sm: 2 }}>
                  <Button type="button" variant="text" color="inherit" className="mb-3!" onClick={handleJSONBeautify}>
                    Beautify JSON
                  </Button>
                </Grid>
              </Grid>
              <Divider />

              <Typography component="h2" variant="subtitle1" color="primary" gutterBottom>
                Room Configuration
              </Typography>
              <Typography component="h2" variant="subtitle2" color="inherit" gutterBottom>
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
                        checked={roomPublicFormField}
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
                        checked={rulesTeamLockField}
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
                        onChange={onChangeRulesSwitch}
                        checked={rulesSwitchesFormField.autoAdmin}
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
                        onChange={onChangeRulesSwitch}
                        checked={rulesSwitchesFormField.whitelistEnabled}
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
                    id="botSettings"
                    name="botSettings"
                    label="JSON Data"
                    variant="outlined"
                    margin="normal"
                    required
                    multiline
                  />
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
