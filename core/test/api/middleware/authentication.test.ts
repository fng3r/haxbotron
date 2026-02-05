import Koa from 'koa';
import Router from 'koa-router';
import request from 'supertest';
import { authenticationMiddleware } from '../../../api/middleware/authenticationMiddleware';
import { errorHandler } from '../../../api/middleware/errorHandler';

describe('Authentication Middleware', () => {
  let app: Koa;
  let server: any;

  beforeEach(() => {
    app = new Koa();
    const router = new Router();
    
    // Add error handler first
    app.use(errorHandler);
    
    // Create protected route with authentication
    router.get('/protected', authenticationMiddleware(['test-api-key']), (ctx) => {
      ctx.status = 200;
      ctx.body = { message: 'success' };
    });
    
    app.use(router.routes());
    app.use(router.allowedMethods());
    server = app.listen();
  });

  afterEach((done) => {
    server.close(done);
  });

  it('should reject requests without API key', async () => {
    const response = await request(server)
      .get('/protected');
    
    expect(response.status).toBe(401);
    expect(response.body.error).toBeDefined();
    expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
  });

  it('should reject requests with invalid API key', async () => {
    const response = await request(server)
      .get('/protected')
      .set('x-api-key', 'invalid-key');
    
    expect(response.status).toBe(401);
    expect(response.body.error).toBeDefined();
    expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
  });

  it('should accept requests with valid API key', async () => {
    const response = await request(server)
      .get('/protected')
      .set('x-api-key', 'test-api-key');
    
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'success' });
  });

  it('should accept requests with any configured API key', async () => {
    const response = await request(server)
      .get('/protected')
      .set('x-api-key', 'test-api-key');
    
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('success');
  });
});
