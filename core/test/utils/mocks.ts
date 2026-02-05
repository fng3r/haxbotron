import { Browser, Page } from 'puppeteer';

/**
 * Mock Puppeteer Browser
 */
export function createMockBrowser(): jest.Mocked<Browser> {
  return {
    newPage: jest.fn().mockResolvedValue(createMockPage()),
    close: jest.fn().mockResolvedValue(undefined),
    isConnected: jest.fn().mockReturnValue(true),
    disconnect: jest.fn(),
    pages: jest.fn().mockResolvedValue([]),
    version: jest.fn().mockResolvedValue('99.0.0'),
    userAgent: jest.fn().mockResolvedValue('test-user-agent'),
    wsEndpoint: jest.fn().mockReturnValue('ws://test'),
  } as any;
}

/**
 * Mock Puppeteer Page
 */
export function createMockPage(): jest.Mocked<Page> {
  const mockPage = {
    goto: jest.fn().mockResolvedValue(null),
    evaluate: jest.fn().mockResolvedValue(null),
    exposeFunction: jest.fn().mockResolvedValue(undefined),
    addScriptTag: jest.fn().mockResolvedValue({} as any),
    close: jest.fn().mockResolvedValue(undefined),
    isClosed: jest.fn().mockReturnValue(false),
    url: jest.fn().mockReturnValue('https://www.haxball.com/headless'),
    setDefaultTimeout: jest.fn(),
    setDefaultNavigationTimeout: jest.fn(),
    on: jest.fn(),
    removeListener: jest.fn(),
    once: jest.fn(),
  } as any;

  return mockPage;
}

/**
 * Mock Haxball Room
 */
export function createMockHaxballRoom() {
  return {
    setDefaultStadium: jest.fn(),
    setScoreLimit: jest.fn(),
    setTimeLimit: jest.fn(),
    setTeamsLock: jest.fn(),
    startGame: jest.fn(),
    stopGame: jest.fn(),
    pauseGame: jest.fn(),
    getPlayerList: jest.fn().mockReturnValue([]),
    getPlayer: jest.fn(),
    kickPlayer: jest.fn(),
    clearBans: jest.fn(),
    setPassword: jest.fn(),
    sendAnnouncement: jest.fn(),
    onPlayerJoin: null,
    onPlayerLeave: null,
    onPlayerChat: null,
    onGameStart: null,
    onGameStop: null,
    onTeamGoal: null,
  };
}

/**
 * Mock axios for DB operations
 */
export function createMockAxios() {
  return {
    get: jest.fn().mockResolvedValue({ status: 200, data: {} }),
    post: jest.fn().mockResolvedValue({ status: 201, data: {} }),
    put: jest.fn().mockResolvedValue({ status: 200, data: {} }),
    delete: jest.fn().mockResolvedValue({ status: 204, data: {} }),
  };
}

/**
 * Mock node-persist storage
 */
export function createMockStorage() {
  const storage = new Map<string, any>();
  
  return {
    init: jest.fn().mockResolvedValue(undefined),
    setItem: jest.fn().mockImplementation((key: string, value: any) => {
      storage.set(key, value);
      return Promise.resolve();
    }),
    getItem: jest.fn().mockImplementation((key: string) => {
      return Promise.resolve(storage.get(key));
    }),
    removeItem: jest.fn().mockImplementation((key: string) => {
      storage.delete(key);
      return Promise.resolve();
    }),
    clear: jest.fn().mockImplementation(() => {
      storage.clear();
      return Promise.resolve();
    }),
    values: jest.fn().mockImplementation(() => {
      return Promise.resolve(Array.from(storage.values()));
    }),
  };
}
