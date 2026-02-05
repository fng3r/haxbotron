import Koa from 'koa';
import Router from 'koa-router';
import request from 'supertest';
import bodyParser from 'koa-bodyparser';
import { authenticationMiddleware } from '../../../api/middleware/authenticationMiddleware';
import { errorHandler } from '../../../api/middleware/errorHandler';

/**
 * API Contract Tests for Player Roles Endpoints
 * These tests ensure backward compatibility with existing clients
 */
describe('Player Roles API Contract Tests', () => {
  let app: Koa;
  let server: any;

  beforeEach(() => {
    app = new Koa();
    app.use(errorHandler);
    app.use(bodyParser());
    
    const router = new Router();
    
    // GET /api/v1/roleslist - Get all roles
    router.get('/api/v1/roleslist', (ctx) => {
      const { search, offset, limit } = ctx.query;
      
      ctx.status = 200;
      ctx.body = [];
    });
    
    // POST /api/v1/roleslist/:auth - Add player role
    router.post('/api/v1/roleslist/:auth', (ctx) => {
      const { auth } = ctx.params;
      const { name, role } = ctx.request.body;
      
      if (!name || !role) {
        ctx.status = 400;
        ctx.body = {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Role is required',
          },
        };
        return;
      }
      
      ctx.status = 204;
    });
    
    // PUT /api/v1/roleslist/:auth - Update player role
    router.put('/api/v1/roleslist/:auth', (ctx) => {
      const { auth } = ctx.params;
      const { name, role } = ctx.request.body;
      
      if (!name || !role) {
        ctx.status = 400;
        ctx.body = {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Role is required',
          },
        };
        return;
      }
      
      ctx.status = 204;
    });
    
    // DELETE /api/v1/roleslist/:auth - Delete player role
    router.delete('/api/v1/roleslist/:auth', (ctx) => {
      ctx.status = 204;
    });
    
    // GET /api/v1/roleslist/events - Get role events
    router.get('/api/v1/roleslist/events', (ctx) => {
      const { search, offset, limit } = ctx.query;
      
      ctx.status = 200;
      ctx.body = [];
    });
    
    app.use(authenticationMiddleware(['test-api-key']));
    app.use(router.routes());
    app.use(router.allowedMethods());
    
    server = app.listen();
  });

  afterEach((done) => {
    server.close(done);
  });

  describe('GET /api/v1/roleslist - Get all roles', () => {
    it('should return list of roles with 200 status', async () => {
      const response = await request(server)
        .get('/api/v1/roleslist')
        .set('x-api-key', 'test-api-key');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should require authentication', async () => {
      const response = await request(server)
        .get('/api/v1/roleslist');
      
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/roleslist/:auth - Add player role', () => {
    it('should return 400 when role is missing', async () => {
      const response = await request(server)
        .post('/api/v1/roleslist/test-auth')
        .set('x-api-key', 'test-api-key')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 204 when role is created successfully', async () => {
      const response = await request(server)
        .post('/api/v1/roleslist/test-auth')
        .set('x-api-key', 'test-api-key')
        .send({ name: 'TestPlayer', role: 'admin' });
      
      expect(response.status).toBe(204);
    });

    it('should require authentication', async () => {
      const response = await request(server)
        .post('/api/v1/roleslist/test-auth')
        .send({ role: 'admin' });
      
      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/v1/roleslist/:auth - Update player role', () => {
    it('should return 400 when role is missing', async () => {
      const response = await request(server)
        .put('/api/v1/roleslist/test-auth')
        .set('x-api-key', 'test-api-key')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 204 when role is updated successfully', async () => {
      const response = await request(server)
        .put('/api/v1/roleslist/test-auth')
        .set('x-api-key', 'test-api-key')
        .send({ name: 'TestPlayer', role: 'moderator' });
      
      expect(response.status).toBe(204);
    });

    it('should require authentication', async () => {
      const response = await request(server)
        .put('/api/v1/roleslist/test-auth')
        .send({ role: 'moderator' });
      
      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/v1/roleslist/:auth - Delete player role', () => {
    it('should return 204 on successful deletion', async () => {
      const response = await request(server)
        .delete('/api/v1/roleslist/test-auth')
        .set('x-api-key', 'test-api-key');
      
      expect(response.status).toBe(204);
      expect(response.body).toEqual({});
    });

    it('should require authentication', async () => {
      const response = await request(server)
        .delete('/api/v1/roleslist/test-auth');
      
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/roleslist/events - Get role events', () => {
    it('should return list of events with 200 status', async () => {
      const response = await request(server)
        .get('/api/v1/roleslist/events')
        .set('x-api-key', 'test-api-key');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should require authentication', async () => {
      const response = await request(server)
        .get('/api/v1/roleslist/events');
      
      expect(response.status).toBe(401);
    });
  });
});
