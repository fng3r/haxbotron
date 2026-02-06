import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import Router from 'koa-router';
import request from 'supertest';
import * as banlistController from '../../../api/controller/v1/banlist';
import { errorHandler } from '../../../api/middleware/errorHandler';

// Mock DBClient
jest.mock('../../../lib/DBClient', () => ({
    dbClient: {
        getBanList: jest.fn(),
        getBanByConn: jest.fn(),
        createBan: jest.fn(),
        deleteBan: jest.fn(),
    }
}));

const { dbClient } = require('../../../lib/DBClient');

describe('Banlist API Integration Tests', () => {
    let app: Koa;

    beforeEach(() => {
        jest.clearAllMocks();
        
        app = new Koa();
        app.use(errorHandler);
        app.use(bodyParser());
        
        const router = new Router();
        router.get('/banlist/:ruid', banlistController.getAllList);
        router.get('/banlist/:ruid/:conn', banlistController.getBanInfo);
        router.post('/banlist/:ruid', banlistController.banPlayer);
        router.delete('/banlist/:ruid/:conn', banlistController.unbanPlayer);
        
        app.use(router.routes());
        app.use(router.allowedMethods());
    });

    describe('GET /banlist/:ruid - Get All Bans', () => {
        it('should return all bans for a room', async () => {
            const mockBans = [
                {
                    uid: 1,
                    ruid: 'room123',
                    conn: 'conn1',
                    auth: 'auth1',
                    reason: 'spam',
                    register: 1000000,
                    expire: 2000000
                },
                {
                    uid: 2,
                    ruid: 'room123',
                    conn: 'conn2',
                    auth: 'auth2',
                    reason: 'toxic',
                    register: 1100000,
                    expire: 2100000
                }
            ];

            (dbClient.getBanList as jest.Mock).mockResolvedValue(mockBans);

            const response = await request(app.callback())
                .get('/banlist/room123')
                .expect(200);

            expect(response.body).toEqual([
                {
                    conn: 'conn1',
                    auth: 'auth1',
                    reason: 'spam',
                    register: 1000000,
                    expire: 2000000
                },
                {
                    conn: 'conn2',
                    auth: 'auth2',
                    reason: 'toxic',
                    register: 1100000,
                    expire: 2100000
                }
            ]);
        });

        it('should return paginated bans when start and count provided', async () => {
            const mockBans = [
                {
                    uid: 1,
                    ruid: 'room123',
                    conn: 'conn1',
                    auth: 'auth1',
                    reason: 'spam',
                    register: 1000000,
                    expire: 2000000
                }
            ];

            (dbClient.getBanList as jest.Mock).mockResolvedValue(mockBans);

            await request(app.callback())
                .get('/banlist/room123?start=0&count=10')
                .expect(200);
        });
    });

    describe('GET /banlist/:ruid/:conn - Get Ban Info', () => {
        it('should return ban info for a specific connection', async () => {
            const mockBan = {
                uid: 1,
                ruid: 'room123',
                conn: 'conn1',
                auth: 'auth1',
                reason: 'spam',
                register: 1000000,
                expire: 2000000
            };

            (dbClient.getBanByConn as jest.Mock).mockResolvedValue(mockBan);

            const response = await request(app.callback())
                .get('/banlist/room123/conn1')
                .expect(200);

            expect(response.body).toEqual({
                conn: 'conn1',
                auth: 'auth1',
                reason: 'spam',
                register: 1000000,
                expire: 2000000
            });
        });
    });

    describe('POST /banlist/:ruid - Ban Player', () => {
        it('should create a new ban', async () => {
            (dbClient.createBan as jest.Mock).mockResolvedValue(undefined);

            await request(app.callback())
                .post('/banlist/room123')
                .send({
                    conn: 'conn1',
                    auth: 'auth1',
                    reason: 'spam',
                    seconds: 3600
                })
                .expect(204);
        });

        it('should return 400 when required fields are missing', async () => {
            const response = await request(app.callback())
                .post('/banlist/room123')
                .send({ conn: 'conn1', auth: 'auth1' })
                .expect(400);

            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        });
    });

    describe('DELETE /banlist/:ruid/:conn - Unban Player', () => {
        it('should delete a ban', async () => {
            (dbClient.deleteBan as jest.Mock).mockResolvedValue(undefined);

            await request(app.callback())
                .delete('/banlist/room123/conn1')
                .expect(204);
        });
    });
});
