import Koa from 'koa';
import request from 'supertest';
import bodyParser from 'koa-bodyparser';
import { authenticationMiddleware } from '../../../api/middleware/authenticationMiddleware';
import { errorHandler } from '../../../api/middleware/errorHandler';
import { systemRouter } from '../../../api/router/v1/system';

/**
 * API Integration Tests for System Endpoints
 * These tests verify the actual router logic
 */
describe('System API Integration Tests', () => {
  let app: Koa;
  let server: any;

  beforeEach(() => {
    app = new Koa();
    app.use(errorHandler);
    app.use(bodyParser());
    
    // Use REAL system router
    app.use(authenticationMiddleware(['test-api-key']));
    app.use(systemRouter.routes());
    app.use(systemRouter.allowedMethods());
    
    server = app.listen();
  });

  afterEach((done) => {
    server.close(done);
  });

  describe('GET /api/v1/system - Get system information', () => {
    it('should return system info with 200 status', async () => {
      const response = await request(server)
        .get('/')
        .set('x-api-key', 'test-api-key');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('usedMemoryMB');
      expect(response.body).toHaveProperty('upTimeSecs');
      expect(response.body).toHaveProperty('serverVersion');
    });

    it('should return memory usage as number', async () => {
      const response = await request(server)
        .get('/')
        .set('x-api-key', 'test-api-key');
      
      expect(typeof response.body.usedMemoryMB).toBe('number');
      expect(response.body.usedMemoryMB).toBeGreaterThan(0);
    });

    it('should return uptime as number', async () => {
      const response = await request(server)
        .get('/')
        .set('x-api-key', 'test-api-key');
      
      expect(typeof response.body.upTimeSecs).toBe('number');
      expect(response.body.upTimeSecs).toBeGreaterThanOrEqual(0);
    });

    it('should return server version as string', async () => {
      const response = await request(server)
        .get('/')
        .set('x-api-key', 'test-api-key');
      
      expect(typeof response.body.serverVersion).toBe('string');
    });

    it('should require authentication', async () => {
      const response = await request(server)
        .get('/');
      
      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should reject invalid API key', async () => {
      const response = await request(server)
        .get('/')
        .set('x-api-key', 'invalid-key');
      
      expect(response.status).toBe(401);
    });
  });

  describe('Response Format', () => {
    it('should return plain object (not wrapped in data)', async () => {
      const response = await request(server)
        .get('/')
        .set('x-api-key', 'test-api-key');
      
      // System endpoint returns direct object, not wrapped
      expect(response.body).toHaveProperty('usedMemoryMB');
      expect(response.body).not.toHaveProperty('data');
    });

    it('should return JSON content type', async () => {
      const response = await request(server)
        .get('/')
        .set('x-api-key', 'test-api-key');
      
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('Performance', () => {
    it('should respond quickly (under 1 second)', async () => {
      const start = Date.now();
      
      await request(server)
        .get('/')
        .set('x-api-key', 'test-api-key');
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000);
    });
  });
});
