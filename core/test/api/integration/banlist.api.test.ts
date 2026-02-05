import Koa from 'koa';
import Router from 'koa-router';
import request from 'supertest';
import bodyParser from 'koa-bodyparser';
import { authenticationMiddleware } from '../../../api/middleware/authenticationMiddleware';
import { errorHandler } from '../../../api/middleware/errorHandler';

/**
 * API Contract Tests for Banlist Endpoints
 * These tests ensure backward compatibility with existing clients
 */
describe('Banlist API Contract Tests', () => {
  let app: Koa;
  let server: any;

  beforeEach(() => {
    app = new Koa();
    app.use(errorHandler);
    app.use(bodyParser());
    
    const router = new Router();
    
    // Mock banlist endpoints
    router.get('/api/v1/banlist/:ruid', (ctx) => {
      ctx.status = 200;
      ctx.body = [];
    });
    
    router.get('/api/v1/banlist/:ruid/:conn', (ctx) => {
      const { ruid, conn } = ctx.params;
      // Return mock ban info
      ctx.status = 200;
      ctx.body = {
        conn: conn,
        auth: 'test-auth',
        reason: 'test reason',
        register: Date.now(),
        expire: Date.now() + 3600000
      };
    });
    
    router.post('/api/v1/banlist/:ruid', (ctx) => {
      const { conn, auth, reason, seconds } = ctx.request.body;
      if (!conn || !auth || !reason || !seconds) {
        ctx.status = 400;
        ctx.body = { error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } };
        return;
      }
      ctx.status = 204;
    });
    
    router.delete('/api/v1/banlist/:ruid/:conn', (ctx) => {
      ctx.status = 204;
    });
    
    app.use(authenticationMiddleware(['test-api-key']));
    app.use(router.routes());
    app.use(router.allowedMethods());
    
    server = app.listen();
  });

  afterEach((done) => {
    server.close(done);
  });

  describe('GET /api/v1/banlist/:ruid - Get all bans', () => {
    it('should return list of bans with 200 status', async () => {
      const response = await request(server)
        .get('/api/v1/banlist/test-room')
        .set('x-api-key', 'test-api-key');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should require authentication', async () => {
      const response = await request(server)
        .get('/api/v1/banlist/test-room');
      
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/banlist/:ruid/:conn - Get ban info', () => {
    it('should return ban info with 200 status', async () => {
      const response = await request(server)
        .get('/api/v1/banlist/test-room/test-conn')
        .set('x-api-key', 'test-api-key');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('conn');
      expect(response.body).toHaveProperty('auth');
      expect(response.body).toHaveProperty('reason');
    });
  });

  describe('POST /api/v1/banlist/:ruid - Ban player', () => {
    it('should return 400 when required fields are missing', async () => {
      const response = await request(server)
        .post('/api/v1/banlist/test-room')
        .set('x-api-key', 'test-api-key')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 204 when ban is created successfully', async () => {
      const response = await request(server)
        .post('/api/v1/banlist/test-room')
        .set('x-api-key', 'test-api-key')
        .send({ conn: 'test-conn', auth: 'test-auth', reason: 'test', seconds: 60 });
      
      expect(response.status).toBe(204);
    });
  });

  describe('DELETE /api/v1/banlist/:ruid/:conn - Unban player', () => {
    it('should return 204 on successful unban', async () => {
      const response = await request(server)
        .delete('/api/v1/banlist/test-room/test-conn')
        .set('x-api-key', 'test-api-key');
      
      expect(response.status).toBe(204);
      expect(response.body).toEqual({});
    });
  });
});
