import {
  BrowserHostRoomConfig,
  BrowserHostRoomGameRules,
  BrowserHostRoomSettings,
} from '@/../core/lib/browser.hostconfig';

export type RoomInfoItem = {
  ruid: string;
  roomName: string;
  roomLink: string;
  onlinePlayers: number;
};

export type RuidListItem = {
  ruid: string;
};

export type AllRoomListItem = {
  ruid: string;
  online: boolean;
};

export type RoomInfo = {
  ruid: string;
  isOnline: boolean;
  roomName: string;
  onlinePlayers: number;
  adminPassword: string;
  link: string;
  _roomConfig: BrowserHostRoomConfig;
  botSettings: BrowserHostRoomSettings;
  rules: BrowserHostRoomGameRules;
};

export type DiscordWebhookConfig = {
  feed: boolean;
  passwordWebhookId: string;
  passwordWebhookToken: string;
  replaysWebhookId: string;
  replaysWebhookToken: string;
  replayUpload: boolean;
};

export type TeamColours = {
  angle: number;
  textColour: number;
  teamColour1: number;
  teamColour2: number;
  teamColour3: number;
};

export type TeamColoursResponse = {
  red: TeamColours;
  blue: TeamColours;
};

export type SetTeamColoursParams = {
  ruid: string;
  team: number; // 1 for red, 2 for blue
  angle: number;
  textColour: number;
  teamColour1: number;
  teamColour2: number;
  teamColour3: number;
};
