'use client';

import React, { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { LiveHelp, OpenInNew } from '@mui/icons-material';
import { Hourglass } from 'lucide-react';

import SnackBarNotification from '@/components/Notifications/SnackBarNotification';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import { BrowserHostRoomSettings, ReactHostRoomInfo } from '@/../core/lib/browser.hostconfig';
import DefaultConfigSet from '@/lib/defaultroomconfig.json';
import { isNumber } from '@/lib/numcheck';
import { mutations } from '@/lib/queries/room';

const stringifySettings = (settings: BrowserHostRoomSettings) => {
  return JSON.stringify(settings, null, 4);
};

export default function RoomCreate() {
  const router = useRouter();

  const [roomUIDFormField, setRoomUIDFormField] = useState(DefaultConfigSet.ruid);
  const [configFormField, setConfigFormField] = useState(DefaultConfigSet._config); // Room Configuration Form
  const [rulesFormField, setRulesFormField] = useState(DefaultConfigSet.rules); // Game Rules Configuration Form
  const [settingsFormField, setSettingsFormField] = useState(DefaultConfigSet.settings); // Bot Settings Configuration Form
  const [settingsFormStringifiedField, setSettingsFormStringifiedField] = useState(
    stringifySettings(DefaultConfigSet.settings),
  );

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
        setSettingsFormStringifiedField(stringifySettings(config.settings));
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

  const handleJSONBeautify = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();

    try {
      setSettingsFormStringifiedField(stringifySettings(settingsFormField));
    } catch (error) {
      console.error('Failed to stringify settings:', error);
    }
  };

  const onChangeRUID = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoomUIDFormField(e.target.value);
  };

  const onChangePublic = (checked: boolean) => {
    setConfigFormField((prev) => ({ ...prev, public: checked }));
  };

  const onChangeTeamLock = (checked: boolean) => {
    setRulesFormField((prev) => ({
      ...prev,
      requisite: {
        ...prev.requisite,
        teamLock: checked,
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

  const onChangeAutoAdmin = (checked: boolean) => {
    setRulesFormField((prev) => ({
      ...prev,
      autoAdmin: checked,
    }));
  };

  const onChangeWhitelistEnabled = (checked: boolean) => {
    setRulesFormField((prev) => ({
      ...prev,
      whitelistEnabled: checked,
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

  const onChangeStringifiedField = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
    <Card>
      <CardHeader>
        <CardTitle>Create New Game Room</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="w-full flex flex-col gap-4 justify-center" onSubmit={handleSubmit} method="post">
          <div className="flex gap-4">
            <Button type="submit" className="flex-1" disabled={createRoomMutation.isPending}>
              {createRoomMutation.isPending ? (
                <>
                  <Hourglass className="size-4" />
                  The room is launching. Please, wait
                </>
              ) : (
                'Create'
              )}
            </Button>
          </div>
          <Separator />

          {/* Room Configuration */}
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-primary mb-2">Room Configuration</h2>
              <p className="text-sm font-medium text-muted-foreground mb-4">
                Do not reuse the same RUID and token if they are already in use.
              </p>
            </div>

            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-3 flex flex-col gap-2">
                <Label htmlFor="ruid">RUID</Label>
                <Input id="ruid" name="ruid" required autoFocus value={roomUIDFormField} onChange={onChangeRUID} />
              </div>
              <div className="col-span-4 flex flex-col gap-2">
                <Label htmlFor="token">Headless Token</Label>
                <Input id="token" name="token" required value={configFormField.token} onChange={onChangeRoomConfig} />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => window.open('https://www.haxball.com/headlesstoken', '_blank')}
                >
                  <OpenInNew />
                </Button>
              </div>
              <div className="col-span-2 mb-2.5 flex items-end gap-2">
                <Switch checked={roomPublic} onCheckedChange={onChangePublic} className="cursor-pointer" />
                <Label htmlFor="public">Public</Label>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-4 flex flex-col gap-2">
                <Label htmlFor="roomName">Room Title</Label>
                <Input
                  id="roomName"
                  name="roomName"
                  required
                  value={configFormField.roomName}
                  onChange={onChangeRoomConfig}
                />
              </div>
              <div className="col-span-3 flex flex-col gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" value={configFormField.password} onChange={onChangeRoomConfig} />
              </div>
              <div className="col-span-2 flex flex-col gap-2">
                <Label htmlFor="maxPlayers">Max Players</Label>
                <Input
                  id="maxPlayers"
                  name="maxPlayers"
                  type="number"
                  required
                  value={configFormField.maxPlayers}
                  onChange={onChangeRoomConfig}
                />
              </div>
            </div>
          </div>
          <Separator />

          {/* Game Rules */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-primary">Game Rules</h2>

            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-2 flex flex-col gap-2">
                <Label htmlFor="ruleName">Rule Name</Label>
                <Input
                  id="ruleName"
                  name="ruleName"
                  required
                  value={rulesFormField.ruleName}
                  onChange={onChangeRules}
                />
              </div>
              <div className="col-span-4 flex flex-col gap-2">
                <Label htmlFor="ruleDescription">Rule Description</Label>
                <Input
                  id="ruleDescription"
                  name="ruleDescription"
                  required
                  value={rulesFormField.ruleDescription}
                  onChange={onChangeRules}
                />
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-2 flex flex-col gap-2">
                <Label htmlFor="minimumPlayers">Minimum Players Need</Label>
                <Input
                  id="minimumPlayers"
                  name="minimumPlayers"
                  type="number"
                  required
                  value={rulesFormField?.requisite && rulesFormField.requisite.minimumPlayers}
                  onChange={onChangeRulesRequisite}
                />
              </div>
              <div className="col-span-2 flex flex-col gap-2">
                <Label htmlFor="eachTeamPlayers">Number of Team Players</Label>
                <Input
                  id="eachTeamPlayers"
                  name="eachTeamPlayers"
                  type="number"
                  required
                  value={rulesFormField?.requisite && rulesFormField.requisite.eachTeamPlayers}
                  onChange={onChangeRulesRequisite}
                />
              </div>
              <div className="col-span-2 flex flex-col gap-2">
                <Label htmlFor="timeLimit">Time Limit</Label>
                <Input
                  id="timeLimit"
                  name="timeLimit"
                  type="number"
                  required
                  value={rulesFormField?.requisite && rulesFormField.requisite.timeLimit}
                  onChange={onChangeRulesRequisite}
                />
              </div>
              <div className="col-span-2 flex flex-col gap-2">
                <Label htmlFor="scoreLimit">Score Limit</Label>
                <Input
                  id="scoreLimit"
                  name="scoreLimit"
                  type="number"
                  required
                  value={rulesFormField?.requisite && rulesFormField.requisite.scoreLimit}
                  onChange={onChangeRulesRequisite}
                />
              </div>
              <div className="col-span-2 mb-2.5 flex items-end gap-2">
                <Switch checked={teamLock} onCheckedChange={onChangeTeamLock} className="cursor-pointer" />
                <Label htmlFor="teamLock">Team Lock</Label>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-2 mb-2.5 flex items-center gap-2">
                <Switch
                  checked={rulesSwitches.autoAdmin}
                  onCheckedChange={onChangeAutoAdmin}
                  className="cursor-pointer"
                />
                <Label htmlFor="autoAdmin">Auto Admin</Label>
              </div>
              <div className="col-span-2 mb-2.5 flex items-center gap-2">
                <Switch
                  checked={rulesSwitches.whitelistEnabled}
                  onCheckedChange={onChangeWhitelistEnabled}
                  className="cursor-pointer"
                />
                <Label htmlFor="whitelistEnabled">Whitelist</Label>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-2 flex flex-col gap-2">
                <Label htmlFor="defaultMapName">Default Map Name</Label>
                <Input
                  id="defaultMapName"
                  name="defaultMapName"
                  required
                  value={rulesFormField.defaultMapName}
                  onChange={onChangeRules}
                />
              </div>
              <div className="col-span-2 flex flex-col gap-2">
                <Label htmlFor="readyMapName">Ready Map Name</Label>
                <Input
                  id="readyMapName"
                  name="readyMapName"
                  required
                  value={rulesFormField.readyMapName}
                  onChange={onChangeRules}
                />
              </div>
              <div className="col-span-2 flex items-end">
                <Tooltip>
                  <TooltipTrigger>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={(e) => {
                        e.preventDefault();
                      }}
                    >
                      <LiveHelp />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="text-sm">
                    Available maps: big, bigeasy, classic, gbhotclassic, gbhotbig, realsoccer, futsal1v1, futsal4v4,
                    bff4v4, icebear, 6man
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
          <Separator />

          {/* Bot Settings */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-primary">Bot Settings</h2>

            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="botSettings">Configuration</Label>
                <Textarea
                  id="botSettings"
                  name="botSettings"
                  required
                  value={settingsFormStringifiedField}
                  onChange={onChangeStringifiedField}
                  onBlur={onBlurStringifiedField}
                  className="min-h-[200px]"
                />
              </div>
              <div>
                <Button type="button" variant="outline" onClick={handleJSONBeautify}>
                  Beautify JSON
                </Button>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
