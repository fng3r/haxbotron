import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import Router from 'koa-router';
import request from 'supertest';
import * as roomController from '../../../api/controller/v1/room';
import { authenticationMiddleware } from '../../../api/middleware/authenticationMiddleware';
import { errorHandler } from '../../../api/middleware/errorHandler';

// Mock room operations
const mockRoomOperations = {
  getAllRoomIds: jest.fn(() => []),
  checkExistRoom: jest.fn(() => false),
  openNewRoom: jest.fn(),
  closeRoom: jest.fn(),
  getExistRoomList: jest.fn(() => []),
  getRoomInfo: jest.fn(),
  getRoomDetailInfo: jest.fn(),
  getOnlinePlayersIDList: jest.fn(() => []),
  getPlayerInfo: jest.fn(),
  checkOnlinePlayer: jest.fn(() => false),
  banPlayerTemporarily: jest.fn(),
  broadcast: jest.fn(),
  whisper: jest.fn(),
  getNotice: jest.fn(),
  setNotice: jest.fn(),
  deleteNotice: jest.fn(),
  setPassword: jest.fn(),
  clearPassword: jest.fn(),
  checkChatFreezed: jest.fn(() => false),
  freezeChat: jest.fn(),
  unfreezeChat: jest.fn(),
  getTeamColours: jest.fn(),
  setTeamColours: jest.fn(),
  checkPlayerMuted: jest.fn(() => false),
  mutePlayer: jest.fn(),
  unmutePlayer: jest.fn(),
  getDiscordWebhookConfig: jest.fn(),
  setDiscordWebhookConfig: jest.fn(),
};

jest.mock('../../../lib/room', () => ({
  getRoomOperations: jest.fn(() => mockRoomOperations),
}));

/**
 * API Contract Tests for Room Endpoints
 * These tests ensure backward compatibility with existing clients
 */
describe('Room API Contract Tests', () => {
  let app: Koa;
  let server: any;

  beforeEach(() => {
    jest.clearAllMocks();
    app = new Koa();
    app.use(errorHandler);
    app.use(bodyParser());
    
    const router = new Router();
    
    // Register all room endpoints
    router.get('/api/v1/room', roomController.getRoomList);
    router.post('/api/v1/room', roomController.createRoom);
    router.get('/api/v1/room/:ruid', roomController.getRoomInfo);
    router.delete('/api/v1/room/:ruid', roomController.terminateRoom);
    router.get('/api/v1/room/:ruid/player', roomController.getPlayersList);
    router.get('/api/v1/room/:ruid/player/:id', roomController.getPlayerInfo);
    router.delete('/api/v1/room/:ruid/player/:id', roomController.kickOnlinePlayer);
    router.post('/api/v1/room/:ruid/chat', roomController.broadcast);
    router.post('/api/v1/room/:ruid/chat/:id', roomController.whisper);
    router.get('/api/v1/room/:ruid/info', roomController.getRoomDetailInfo);
    router.post('/api/v1/room/:ruid/info/password', roomController.setPassword);
    router.delete('/api/v1/room/:ruid/info/password', roomController.clearPassword);
    router.get('/api/v1/room/:ruid/info/freeze', roomController.checkChatFreezed);
    router.post('/api/v1/room/:ruid/info/freeze', roomController.freezeChat);
    router.delete('/api/v1/room/:ruid/info/freeze', roomController.unfreezeChat);
    router.get('/api/v1/room/:ruid/social/notice', roomController.getNotice);
    router.post('/api/v1/room/:ruid/social/notice', roomController.setNotice);
    router.delete('/api/v1/room/:ruid/social/notice', roomController.deleteNotice);
    router.get('/api/v1/room/:ruid/social/discord/webhook', roomController.getDiscordWebhookConfig);
    router.post('/api/v1/room/:ruid/social/discord/webhook', roomController.setDiscordWebhookConfig);
    router.get('/api/v1/room/:ruid/asset/team/colour', roomController.getTeamColours);
    router.post('/api/v1/room/:ruid/asset/team/colour', roomController.setTeamColours);
    router.get('/api/v1/room/:ruid/player/:id/permission/mute', roomController.checkPlayerMuted);
    router.post('/api/v1/room/:ruid/player/:id/permission/mute', roomController.mutePlayer);
    router.delete('/api/v1/room/:ruid/player/:id/permission/mute', roomController.unmutePlayer);
    
    app.use(authenticationMiddleware(['test-api-key']));
    app.use(router.routes());
    app.use(router.allowedMethods());
    
    server = app.listen();
  });

  afterEach((done) => {
    server.close(done);
  });

  describe('GET /api/v1/room - Get room list', () => {
    it('should return list of rooms with 200 status', async () => {
      const response = await request(server)
        .get('/api/v1/room')
        .set('x-api-key', 'test-api-key');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/v1/room - Create room', () => {
    it('should reject invalid room configuration with 400', async () => {
      const response = await request(server)
        .post('/api/v1/room')
        .set('x-api-key', 'test-api-key')
        .send({ invalid: 'data' });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return proper error structure for validation failures', async () => {
      const response = await request(server)
        .post('/api/v1/room')
        .set('x-api-key', 'test-api-key')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error).toHaveProperty('details');
    });
  });

  describe('GET /api/v1/room/:ruid - Get room info', () => {
    it('should return 404 for non-existent room', async () => {
      const response = await request(server)
        .get('/api/v1/room/nonexistent')
        .set('x-api-key', 'test-api-key');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('ROOM_NOT_FOUND');
    });
  });

  describe('DELETE /api/v1/room/:ruid - Terminate room', () => {
    it('should return 404 for non-existent room', async () => {
      const response = await request(server)
        .delete('/api/v1/room/nonexistent')
        .set('x-api-key', 'test-api-key');
      
      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('ROOM_NOT_FOUND');
    });
  });

  describe('POST /api/v1/room/:ruid/chat - Broadcast message', () => {
    it('should return 404 for non-existent room (checked before validation)', async () => {
      const response = await request(server)
        .post('/api/v1/room/test-room/chat')
        .set('x-api-key', 'test-api-key')
        .send({});
      
      // Room existence is checked first, so 404 is returned even if message is missing
      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('ROOM_NOT_FOUND');
    });

    it('should return 404 for non-existent room with valid message', async () => {
      const response = await request(server)
        .post('/api/v1/room/nonexistent/chat')
        .set('x-api-key', 'test-api-key')
        .send({ message: 'Hello' });
      
      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('ROOM_NOT_FOUND');
    });
  });

  describe('POST /api/v1/room/:ruid/info/password - Set password', () => {
    it('should return 400 when password is missing', async () => {
      const response = await request(server)
        .post('/api/v1/room/test-room/info/password')
        .set('x-api-key', 'test-api-key')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('DELETE /api/v1/room/:ruid/info/password - Clear password', () => {
    it('should return 404 for non-existent room', async () => {
      const response = await request(server)
        .delete('/api/v1/room/nonexistent/info/password')
        .set('x-api-key', 'test-api-key');
      
      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('ROOM_NOT_FOUND');
    });
  });

  describe('POST /api/v1/room/:ruid/asset/team/colour - Set team colours', () => {
    it('should return 400 for invalid team ID', async () => {
      const response = await request(server)
        .post('/api/v1/room/test-room/asset/team/colour')
        .set('x-api-key', 'test-api-key')
        .send({
          team: 99, // Invalid team
          angle: 0,
          textColour: 0xFFFFFF,
          teamColour1: 0xFF0000,
          teamColour2: 0xFF0000,
          teamColour3: 0xFF0000
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('DELETE /api/v1/room/:ruid/player/:id - Kick player', () => {
    it('should return 400 when required fields are missing', async () => {
      const response = await request(server)
        .delete('/api/v1/room/test-room/player/1')
        .set('x-api-key', 'test-api-key')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/room/:ruid/player/:id/permission/mute - Mute player', () => {
    it('should return 400 when muteExpire is missing', async () => {
      const response = await request(server)
        .post('/api/v1/room/test-room/player/1/permission/mute')
        .set('x-api-key', 'test-api-key')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Error Response Format', () => {
    it('should return consistent error format across all endpoints', async () => {
      const response = await request(server)
        .get('/api/v1/room/nonexistent')
        .set('x-api-key', 'test-api-key');
      
      // Verify error structure
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
      expect(typeof response.body.error.code).toBe('string');
      expect(typeof response.body.error.message).toBe('string');
    });
  });

  describe('Success Response Format', () => {
    it('should return plain arrays/objects (not wrapped)', async () => {
      const response = await request(server)
        .get('/api/v1/room')
        .set('x-api-key', 'test-api-key');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Authentication', () => {
    it('should require authentication for all endpoints', async () => {
      const response = await request(server)
        .get('/api/v1/room');
      
      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should reject invalid API keys', async () => {
      const response = await request(server)
        .get('/api/v1/room')
        .set('x-api-key', 'invalid-key');
      
      expect(response.status).toBe(401);
    });
  });
});
