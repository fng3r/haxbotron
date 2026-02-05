// Global test setup
process.env.NODE_ENV = 'test';
process.env.SERVER_PORT = '12099';
process.env.ALLOWED_API_KEYS = 'test-api-key';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.SERVER_CONN_DB_HOST = '127.0.0.1';
process.env.SERVER_CONN_DB_PORT = '12100';
process.env.SERVER_CONN_DB_VERSION = 'v1';

// Suppress console logs during tests (comment out for debugging)
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
