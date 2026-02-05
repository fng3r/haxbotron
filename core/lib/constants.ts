/**
 * Application-wide constants
 */

// Time constants (in milliseconds)
export const TIME_CONSTANTS = {
  ONE_SECOND: 1000,
  FIVE_SECONDS: 5000,
  TEN_SECONDS: 10000,
  THIRTY_SECONDS: 30000,
  ONE_MINUTE: 60000,
  FIVE_MINUTES: 300000,
  TEN_MINUTES: 600000,
  ONE_HOUR: 3600000,
  ONE_DAY: 86400000,
} as const;

// Player team IDs
export const TEAM_ID = {
  SPECTATORS: 0,
  RED: 1,
  BLUE: 2,
} as const;

// Room limits
export const ROOM_LIMITS = {
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 30,
  DEFAULT_MAX_PLAYERS: 10,
  MIN_SCORE_LIMIT: 1,
  MAX_SCORE_LIMIT: 99,
  MIN_TIME_LIMIT: 1,
  MAX_TIME_LIMIT: 99,
} as const;

// Chat flood protection
export const CHAT_FLOOD = {
  MAX_MESSAGES: 5,
  TIME_WINDOW: TIME_CONSTANTS.FIVE_SECONDS,
  BAN_DURATION: TIME_CONSTANTS.TEN_MINUTES,
} as const;

// Admin password
export const ADMIN_PASSWORD_LENGTH = 10;

// Database operation timeouts
export const DB_TIMEOUT = {
  DEFAULT: TIME_CONSTANTS.FIVE_SECONDS,
  LONG: TIME_CONSTANTS.TEN_SECONDS,
} as const;

// Browser/Puppeteer constants
export const BROWSER_CONSTANTS = {
  HAXBALL_URL: 'https://www.haxball.com/headless',
  PAGE_LOAD_TIMEOUT: TIME_CONSTANTS.THIRTY_SECONDS,
  NAVIGATION_TIMEOUT: TIME_CONSTANTS.TEN_SECONDS,
} as const;

// API response codes
export const RESPONSE_CODES = {
  SUCCESS: 'SUCCESS',
  CREATED: 'CREATED',
  NO_CONTENT: 'NO_CONTENT',
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

// Player role levels
export const ROLE_LEVELS = {
  NONE: 0,
  PLAYER: 1,
  MODERATOR: 2,
  ADMIN: 3,
  SUPERADMIN: 4,
} as const;

// Text filter separator
export const TEXT_FILTER_SEPARATOR = '|,|';

// Storage keys
export const STORAGE_KEYS = {
  ROOM_PREFIX: 'room_',
  PLAYER_PREFIX: 'player_',
  BAN_PREFIX: 'ban_',
} as const;
