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
