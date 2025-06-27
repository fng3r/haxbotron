export type BanOptions = {
  reason?: string;
  seconds: number;
};

export type BanListItem = {
  conn: string;
  auth: string;
  reason: string;
  register: number;
  expire: number;
};

export type NewBanEntry = {
  conn: string;
  auth: string;
  reason?: string;
  seconds: number;
};

export interface RoomPlayer {
  auth: string;
  conn: string;
  name: string;
  rating: number;
  totals: number;
  disconns: number;
  wins: number;
  goals: number;
  assists: number;
  ogs: number;
  losePoints: number;
  balltouch: number;
  passed: number;
  mute: boolean;
  muteExpire: number;
  rejoinCount: number;
  joinDate: number;
  leftDate: number;
  malActCount: number;
}
