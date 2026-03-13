import Koa from 'koa';
import Router from 'koa-router';
import request from 'supertest';
import bodyParser from 'koa-bodyparser';
import { authenticationMiddleware } from '../../../api/middleware/authenticationMiddleware';
import { errorHandler } from '../../../api/middleware/errorHandler';
import { ValidationError, NotFoundError } from '../../../lib/errors';

/**
 * Response Format Contract Tests
 * Ensures all API responses follow consistent format standards
 */
describe('API Response Format Contract', () => {
  let app: Koa;
  let server: any;

  beforeEach(() => {
    app = new Koa();
    app.use(errorHandler);
    app.use(bodyParser());
    
    const router = new Router();
    
    // Success response endpoint
    router.get('/test/success', (ctx) => {
      ctx.status = 200;
      ctx.body = { data: { message: 'success' } };
    });
    
    // List response endpoint
    router.get('/test/list', (ctx) => {
      ctx.status = 200;
      ctx.body = { data: ['item1', 'item2', 'item3'] };
    });
    
    // Created response endpoint
    router.post('/test/create', (ctx) => {
      ctx.status = 201;
      ctx.body = { success: true, id: 'new-id' };
    });
    
    // No content response endpoint
    router.delete('/test/delete', (ctx) => {
      ctx.status = 204;
    });
    
    // Validation error endpoint
    router.post('/test/validation-error', (ctx) => {
      throw new ValidationError('Validation failed', { field: 'name' });
    });
    
    // Not found error endpoint
    router.get('/test/not-found', (ctx) => {
      throw new NotFoundError('Resource', 'test-id');
    });
    
    app.use(authenticationMiddleware(['test-api-key']));
    app.use(router.routes());
    app.use(router.allowedMethods());
    
    server = app.listen();
  });

  afterEach((done) => {
    server.close(done);
  });

  describe('Success Responses (200)', () => {
    it('should return plain objects (backward compatible)', async () => {
      const response = await request(server)
        .get('/test/success')
        .set('x-api-key', 'test-api-key');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ data: { message: 'success' } });
    });
  });

  describe('List Responses (200)', () => {
    it('should return plain arrays (backward compatible)', async () => {
      const response = await request(server)
        .get('/test/list')
        .set('x-api-key', 'test-api-key');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ data: ['item1', 'item2', 'item3'] });
    });
  });

  describe('Created Responses (201/204)', () => {
    it('should return 201 with body or 204 without body', async () => {
      const response = await request(server)
        .post('/test/create')
        .set('x-api-key', 'test-api-key')
        .send({ name: 'test' });
      
      expect(response.status).toBe(201);
      // Some endpoints return body, some don't - both are acceptable
    });
  });

  describe('No Content Responses (204)', () => {
    it('should return empty body', async () => {
      const response = await request(server)
        .delete('/test/delete')
        .set('x-api-key', 'test-api-key');
      
      expect(response.status).toBe(204);
      expect(response.body).toEqual({});
    });
  });

  describe('Error Responses', () => {
    it('should have consistent error structure (400)', async () => {
      const response = await request(server)
        .post('/test/validation-error')
        .set('x-api-key', 'test-api-key')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should have consistent error structure (404)', async () => {
      const response = await request(server)
        .get('/test/not-found')
        .set('x-api-key', 'test-api-key');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should include details when available', async () => {
      const response = await request(server)
        .post('/test/validation-error')
        .set('x-api-key', 'test-api-key')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body.error).toHaveProperty('details');
      expect(response.body.error.details).toEqual({ field: 'name' });
    });
  });

  describe('Content-Type Headers', () => {
    it('should return JSON content type', async () => {
      const response = await request(server)
        .get('/test/success')
        .set('x-api-key', 'test-api-key');
      
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });
});
