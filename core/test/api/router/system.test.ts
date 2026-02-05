import Koa from 'koa';
import Router from 'koa-router';
import request from 'supertest';
import bodyParser from 'koa-bodyparser';
import { authenticationMiddleware } from '../../../api/middleware/authenticationMiddleware';
import { errorHandler } from '../../../api/middleware/errorHandler';

describe('System API Endpoints', () => {
  let app: Koa;
  let server: any;

  beforeEach(() => {
    app = new Koa();
    
    // Add error handler first
    app.use(errorHandler);
    app.use(bodyParser());
    
    const router = new Router();
    
    // Mock system info endpoint with proper authentication middleware
    router.get('/api/v1/system', authenticationMiddleware(['test-api-key']), (ctx) => {
      ctx.status = 200;
      ctx.body = {
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        version: require('../../../package.json').version,
      };
    });
    
    app.use(router.routes());
    app.use(router.allowedMethods());
    server = app.listen();
  });

  afterEach((done) => {
    server.close(done);
  });

  it('should return system info with valid authentication', async () => {
    const response = await request(server)
      .get('/api/v1/system')
      .set('x-api-key', 'test-api-key');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('memory');
    expect(response.body).toHaveProperty('uptime');
    expect(response.body).toHaveProperty('version');
  });

  it('should reject system info request without authentication', async () => {
    const response = await request(server)
      .get('/api/v1/system');
    
    expect(response.status).toBe(401);
    expect(response.body.error).toBeDefined();
    expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
  });
});
