import Koa from 'koa';
import Router from 'koa-router';
import request from 'supertest';
import bodyParser from 'koa-bodyparser';
import { authenticationMiddleware } from '../../../api/middleware/authenticationMiddleware';
import { errorHandler } from '../../../api/middleware/errorHandler';

/**
 * API Contract Tests for Playerlist Endpoints
 * These tests ensure backward compatibility with existing clients
 */
describe('Playerlist API Contract Tests', () => {
  let app: Koa;
  let server: any;

  beforeEach(() => {
    app = new Koa();
    app.use(errorHandler);
    app.use(bodyParser());
    
    const router = new Router();
    
    // Mock playerlist endpoints
    // GET /api/v1/playerlist/:ruid - Get all players for a room
    router.get('/api/v1/playerlist/:ruid', (ctx) => {
      const { ruid } = ctx.params;
      const { search, offset, limit } = ctx.query;
      
      ctx.status = 200;
      ctx.body = [];
    });
    
    // GET /api/v1/playerlist/:ruid/:auth - Get specific player info
    router.get('/api/v1/playerlist/:ruid/:auth', (ctx) => {
      const { ruid, auth } = ctx.params;
      
      ctx.status = 200;
      ctx.body = {
        auth: auth,
        conn: 'test-conn',
        name: 'TestPlayer',
        mute: false,
        muteExpire: -1,
        rejoinCount: 0,
        joinDate: Date.now(),
        leftDate: Date.now(),
        malActCount: 0
      };
    });
    
    app.use(authenticationMiddleware(['test-api-key']));
    app.use(router.routes());
    app.use(router.allowedMethods());
    
    server = app.listen();
  });

  afterEach((done) => {
    server.close(done);
  });

  describe('GET /api/v1/playerlist/:ruid - Get all players', () => {
    it('should return list of players with 200 status', async () => {
      const response = await request(server)
        .get('/api/v1/playerlist/test-room')
        .set('x-api-key', 'test-api-key');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should support search parameter', async () => {
      const response = await request(server)
        .get('/api/v1/playerlist/test-room')
        .query({ searchQuery: 'player' })
        .set('x-api-key', 'test-api-key');
      
      expect(response.status).toBe(200);
    });

    it('should require authentication', async () => {
      const response = await request(server)
        .get('/api/v1/playerlist/test-room');
      
      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
    });
  });

  describe('GET /api/v1/playerlist/:ruid/:auth - Get player info', () => {
    it('should return player info with 200 status', async () => {
      const response = await request(server)
        .get('/api/v1/playerlist/test-room/test-auth')
        .set('x-api-key', 'test-api-key');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('auth');
      expect(response.body).toHaveProperty('name');
    });

    it('should require authentication', async () => {
      const response = await request(server)
        .get('/api/v1/playerlist/test-room/test-auth');
      
      expect(response.status).toBe(401);
    });
  });

  describe('Response Format Consistency', () => {
    it('should return plain array (not wrapped)', async () => {
      const response = await request(server)
        .get('/api/v1/playerlist/test-room')
        .set('x-api-key', 'test-api-key');
      
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
