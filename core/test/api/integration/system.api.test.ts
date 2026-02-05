import Koa from 'koa';
import Router from 'koa-router';
import request from 'supertest';
import bodyParser from 'koa-bodyparser';
import { authenticationMiddleware } from '../../../api/middleware/authenticationMiddleware';
import { errorHandler } from '../../../api/middleware/errorHandler';

/**
 * API Contract Tests for System Endpoints
 * These tests ensure backward compatibility with existing clients
 */
describe('System API Contract Tests', () => {
  let app: Koa;
  let server: any;

  beforeEach(() => {
    app = new Koa();
    app.use(errorHandler);
    app.use(bodyParser());
    
    const router = new Router();
    
    // GET /api/v1/system - Get system information
    router.get('/api/v1/system', (ctx) => {
      ctx.status = 200;
      ctx.body = {
        usedMemoryMB: Math.round(process.memoryUsage().rss / 1024 / 1024 * 100) / 100,
        upTimeSecs: Math.round(process.uptime()),
        serverVersion: process.env.npm_package_version || '0.0',
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

  describe('GET /api/v1/system - Get system information', () => {
    it('should return system info with 200 status', async () => {
      const response = await request(server)
        .get('/api/v1/system')
        .set('x-api-key', 'test-api-key');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('usedMemoryMB');
      expect(response.body).toHaveProperty('upTimeSecs');
      expect(response.body).toHaveProperty('serverVersion');
    });

    it('should return memory usage as number', async () => {
      const response = await request(server)
        .get('/api/v1/system')
        .set('x-api-key', 'test-api-key');
      
      expect(typeof response.body.usedMemoryMB).toBe('number');
      expect(response.body.usedMemoryMB).toBeGreaterThan(0);
    });

    it('should return uptime as number', async () => {
      const response = await request(server)
        .get('/api/v1/system')
        .set('x-api-key', 'test-api-key');
      
      expect(typeof response.body.upTimeSecs).toBe('number');
      expect(response.body.upTimeSecs).toBeGreaterThanOrEqual(0);
    });

    it('should return server version as string', async () => {
      const response = await request(server)
        .get('/api/v1/system')
        .set('x-api-key', 'test-api-key');
      
      expect(typeof response.body.serverVersion).toBe('string');
    });

    it('should require authentication', async () => {
      const response = await request(server)
        .get('/api/v1/system');
      
      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should reject invalid API key', async () => {
      const response = await request(server)
        .get('/api/v1/system')
        .set('x-api-key', 'invalid-key');
      
      expect(response.status).toBe(401);
    });
  });

  describe('Response Format', () => {
    it('should return plain object (not wrapped in data)', async () => {
      const response = await request(server)
        .get('/api/v1/system')
        .set('x-api-key', 'test-api-key');
      
      // System endpoint returns direct object, not wrapped
      expect(response.body).toHaveProperty('usedMemoryMB');
      expect(response.body).not.toHaveProperty('data');
    });

    it('should return JSON content type', async () => {
      const response = await request(server)
        .get('/api/v1/system')
        .set('x-api-key', 'test-api-key');
      
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('Performance', () => {
    it('should respond quickly (under 1 second)', async () => {
      const start = Date.now();
      
      await request(server)
        .get('/api/v1/system')
        .set('x-api-key', 'test-api-key');
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000);
    });
  });
});
