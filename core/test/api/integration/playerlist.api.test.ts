import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import Router from 'koa-router';
import request from 'supertest';
import * as playerlistController from '../../../api/controller/v1/playerlist';
import { errorHandler } from '../../../api/middleware/errorHandler';

// Mock API DB adapter
jest.mock('../../../lib/db/adapters/ApiDbAdapter', () => ({
    apiDbAdapter: {
        searchPlayers: jest.fn(),
        getPlayerByAuth: jest.fn(),
    }
}));

const { apiDbAdapter: dbClient } = require('../../../lib/db/adapters/ApiDbAdapter');

describe('Playerlist API Integration Tests', () => {
    let app: Koa;

    beforeEach(() => {
        jest.clearAllMocks();
        
        app = new Koa();
        app.use(errorHandler);
        app.use(bodyParser());
        
        const router = new Router();
        router.get('/playerlist/:ruid', playerlistController.getAllList);
        router.get('/playerlist/:ruid/:auth', playerlistController.getPlayerInfo);
        
        app.use(router.routes());
        app.use(router.allowedMethods());
    });

    describe('GET /playerlist/:ruid - Get All Players', () => {
        it('should return all players for a room', async () => {
            const mockPlayers = [
                {
                    uid: 1,
                    ruid: 'room123',
                    auth: 'auth1',
                    conn: 'conn1',
                    name: 'Player 1',
                    mute: false,
                    muteExpire: 0,
                    rejoinCount: 1,
                    joinDate: 1000000,
                    leftDate: 2000000,
                    malActCount: 0
                },
                {
                    uid: 2,
                    ruid: 'room123',
                    auth: 'auth2',
                    conn: 'conn2',
                    name: 'Player 2',
                    mute: false,
                    muteExpire: 0,
                    rejoinCount: 2,
                    joinDate: 1100000,
                    leftDate: 2100000,
                    malActCount: 0
                }
            ];

            (dbClient.searchPlayers as jest.Mock).mockResolvedValue(mockPlayers);

            const response = await request(app.callback())
                .get('/playerlist/room123')
                .expect(200);

            expect(response.body).toEqual([
                {
                    auth: 'auth1',
                    conn: 'conn1',
                    name: 'Player 1',
                    mute: false,
                    muteExpire: 0,
                    rejoinCount: 1,
                    joinDate: 1000000,
                    leftDate: 2000000,
                    malActCount: 0
                },
                {
                    auth: 'auth2',
                    conn: 'conn2',
                    name: 'Player 2',
                    mute: false,
                    muteExpire: 0,
                    rejoinCount: 2,
                    joinDate: 1100000,
                    leftDate: 2100000,
                    malActCount: 0
                }
            ]);
        });

        it('should return filtered players when searchQuery provided', async () => {
            const mockPlayers = [
                {
                    uid: 1,
                    ruid: 'room123',
                    auth: 'auth1',
                    conn: 'conn1',
                    name: 'Test Player',
                    mute: false,
                    muteExpire: 0,
                    rejoinCount: 1,
                    joinDate: 1000000,
                    leftDate: 2000000,
                    malActCount: 0
                }
            ];

            (dbClient.searchPlayers as jest.Mock).mockResolvedValue(mockPlayers);

            const response = await request(app.callback())
                .get('/playerlist/room123?searchQuery=test&start=0&count=10')
                .expect(200);

            expect(response.body).toEqual([
                {
                    auth: 'auth1',
                    conn: 'conn1',
                    name: 'Test Player',
                    mute: false,
                    muteExpire: 0,
                    rejoinCount: 1,
                    joinDate: 1000000,
                    leftDate: 2000000,
                    malActCount: 0
                }
            ]);
        });
    });

    describe('GET /playerlist/:ruid/:auth - Get Player Info', () => {
        it('should return player info for a specific auth', async () => {
            const mockPlayer = {
                uid: 1,
                ruid: 'room123',
                auth: 'auth1',
                conn: 'conn1',
                name: 'Test Player',
                mute: false,
                muteExpire: 0,
                rejoinCount: 1,
                joinDate: 1000000,
                leftDate: 2000000,
                malActCount: 0
            };

            (dbClient.getPlayerByAuth as jest.Mock).mockResolvedValue(mockPlayer);

            const response = await request(app.callback())
                .get('/playerlist/room123/auth1')
                .expect(200);

            expect(response.body).toEqual({
                auth: 'auth1',
                conn: 'conn1',
                name: 'Test Player',
                mute: false,
                muteExpire: 0,
                rejoinCount: 1,
                joinDate: 1000000,
                leftDate: 2000000,
                malActCount: 0
            });
        });
    });
});
