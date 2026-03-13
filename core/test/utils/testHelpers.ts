import Koa from 'koa';
import request from 'supertest';
import { Server } from 'http';

/**
 * Create a test server from a Koa app
 */
export function createTestServer(app: Koa): Server {
  return app.listen();
}

/**
 * Create a supertest request agent with authentication
 */
export function createAuthenticatedRequest(server: Server, apiKey: string = 'test-api-key') {
  return request(server).set('x-api-key', apiKey);
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}

/**
 * Create a mock player object
 */
export function createMockPlayer(overrides: Partial<any> = {}) {
  return {
    id: 1,
    name: 'TestPlayer',
    auth: 'test-auth-string',
    conn: 'test-conn-string',
    team: 0,
    admin: false,
    position: { x: 0, y: 0 },
    ...overrides,
  };
}

/**
 * Create a mock room configuration
 */
export function createMockRoomConfig(overrides: Partial<any> = {}) {
  return {
    roomName: 'Test Room',
    maxPlayers: 10,
    public: false,
    geo: { code: 'us', lat: 0, lon: 0 },
    ...overrides,
  };
}
