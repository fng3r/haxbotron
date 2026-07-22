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
