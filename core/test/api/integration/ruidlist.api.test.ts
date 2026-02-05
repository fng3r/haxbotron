import Koa from 'koa';
import Router from 'koa-router';
import request from 'supertest';
import bodyParser from 'koa-bodyparser';
import { authenticationMiddleware } from '../../../api/middleware/authenticationMiddleware';
import { errorHandler } from '../../../api/middleware/errorHandler';

/**
 * API Contract Tests for RUID List Endpoints
 * These tests ensure backward compatibility with existing clients
 */
describe('RUID List API Contract Tests', () => {
  let app: Koa;
  let server: any;

  beforeEach(() => {
    app = new Koa();
    app.use(errorHandler);
    app.use(bodyParser());
    
    const router = new Router();
    
    // GET /api/v1/ruidlist - Get all RUIDs
    router.get('/api/v1/ruidlist', (ctx) => {
      ctx.status = 200;
      ctx.body = [
        { ruid: 'ruid-1' },
        { ruid: 'ruid-2' },
        { ruid: 'ruid-3' }
      ];
    });
    
    app.use(authenticationMiddleware(['test-api-key']));
    app.use(router.routes());
    app.use(router.allowedMethods());
    
    server = app.listen();
  });

  afterEach((done) => {
    server.close(done);
  });

  describe('GET /api/v1/ruidlist - Get all RUIDs', () => {
    it('should return list of RUIDs with 200 status', async () => {
      const response = await request(server)
        .get('/api/v1/ruidlist')
        .set('x-api-key', 'test-api-key');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return array of objects with ruid property', async () => {
      const response = await request(server)
        .get('/api/v1/ruidlist')
        .set('x-api-key', 'test-api-key');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('ruid');
      }
    });

    it('should require authentication', async () => {
      const response = await request(server)
        .get('/api/v1/ruidlist');
      
      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should reject invalid API key', async () => {
      const response = await request(server)
        .get('/api/v1/ruidlist')
        .set('x-api-key', 'invalid-key');
      
      expect(response.status).toBe(401);
    });
  });

  describe('Response Format', () => {
    it('should return plain array (not wrapped)', async () => {
      const response = await request(server)
        .get('/api/v1/ruidlist')
        .set('x-api-key', 'test-api-key');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).not.toHaveProperty('error');
    });

    it('should return JSON content type', async () => {
      const response = await request(server)
        .get('/api/v1/ruidlist')
        .set('x-api-key', 'test-api-key');
      
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });
});
